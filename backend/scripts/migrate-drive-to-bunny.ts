/**
 * Migra los videos de las lecciones desde Google Drive a Bunny Stream.
 * Para cada lesson con `driveFileId` y sin `bunnyVideoId`:
 *   1. Crea un video en Bunny (POST /videos)
 *   2. Hace stream del archivo de Drive y lo PUT al video creado
 *   3. Guarda el `bunnyVideoId` en la lesson
 *
 * Uso:
 *   # Solo categorías específicas (recomendado)
 *   npx ts-node scripts/migrate-drive-to-bunny.ts --categories inteligencia-artificial,crypto,ingles
 *
 *   # Todas las lecciones pendientes
 *   npx ts-node scripts/migrate-drive-to-bunny.ts
 *
 *   # Limitar a N lecciones (para probar)
 *   npx ts-node scripts/migrate-drive-to-bunny.ts --limit 5
 *
 *   # Solo cursos específicos por slug
 *   npx ts-node scripts/migrate-drive-to-bunny.ts --courses curso-a,curso-b
 *
 *   # Dry-run (no escribe en DB ni sube nada, solo lista)
 *   npx ts-node scripts/migrate-drive-to-bunny.ts --dry-run
 */
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import * as path from 'path';
import * as dotenv from 'dotenv';

// override: false → respeta env vars ya definidas en el shell (PowerShell, etc).
// Permite hacer `$env:DATABASE_URL=neon` antes de correr el script.
dotenv.config({ override: false });

const prisma = new PrismaClient();

interface CliFlags {
  categories?: string[];
  courses?: string[];
  limit?: number;
  dryRun: boolean;
}

function parseArgs(argv: string[]): CliFlags {
  const flags: CliFlags = { dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--limit' && next) { flags.limit = Number(next); i++; }
    else if (a === '--categories' && next) { flags.categories = next.split(/[\s,]+/).map(s => s.trim()).filter(Boolean); i++; }
    else if (a === '--courses' && next) { flags.courses = next.split(/[\s,]+/).map(s => s.trim()).filter(Boolean); i++; }
  }
  return flags;
}

async function getDrive() {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_PATH no configurado');
  const absolute = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  const auth = new google.auth.GoogleAuth({
    keyFile: absolute,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

async function bunnyCreateVideo(libraryId: string, apiKey: string, title: string): Promise<string> {
  const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: 'POST',
    headers: {
      AccessKey: apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    throw new Error(`Bunny createVideo ${res.status}: ${await res.text()}`);
  }
  const json = await res.json() as any;
  return json.guid as string;
}

async function bunnyUpload(libraryId: string, apiKey: string, videoId: string, stream: NodeJS.ReadableStream, sizeBytes?: number) {
  const headers: Record<string, string> = {
    AccessKey: apiKey,
    'Content-Type': 'application/octet-stream',
  };
  if (sizeBytes) headers['Content-Length'] = String(sizeBytes);

  const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
    method: 'PUT',
    headers,
    body: stream as any,
    // @ts-ignore — Node fetch acepta duplex para streams
    duplex: 'half',
  });
  if (!res.ok) {
    throw new Error(`Bunny upload ${res.status}: ${await res.text()}`);
  }
}

async function bunnyDelete(libraryId: string, apiKey: string, videoId: string) {
  await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}`, {
    method: 'DELETE',
    headers: { AccessKey: apiKey },
  }).catch(() => {});
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;
  if (!libraryId || !apiKey) {
    throw new Error('BUNNY_LIBRARY_ID y BUNNY_API_KEY deben estar configurados');
  }

  // Pista útil para confirmar a qué DB se conecta sin loggear credenciales
  const dbHint = (process.env.DATABASE_URL || '').includes('neon.tech') ? 'Neon (producción)' : 'localhost (local)';

  console.log('🐰 Bunny migration tool');
  console.log('   Library:', libraryId);
  console.log('   DB:     ', dbHint);
  console.log('   Modo:', flags.dryRun ? 'DRY-RUN (no escribe nada)' : 'COMMIT');
  if (flags.categories) console.log('   Categorías:', flags.categories.join(', '));
  if (flags.courses) console.log('   Cursos:', flags.courses.join(', '));
  if (flags.limit) console.log('   Limit:', flags.limit);
  console.log('');

  // Construir filtro
  const where: any = {
    bunnyVideoId: null,
    driveFileId: { not: '' },
  };
  if (flags.categories && flags.categories.length > 0) {
    where.module = { course: { category: { slug: { in: flags.categories } } } };
  }
  if (flags.courses && flags.courses.length > 0) {
    where.module = where.module || { course: {} };
    where.module.course = { ...(where.module.course || {}), slug: { in: flags.courses } };
  }

  console.log('   WHERE:', JSON.stringify(where));

  // Sanity check: cuántas lecciones existen sin filtros (en la DB activa)
  const sanity = await prisma.lesson.count();
  console.log('   Total lecciones en esta DB:', sanity);

  const lessons = await prisma.lesson.findMany({
    where,
    take: flags.limit,
    orderBy: { createdAt: 'asc' },
    include: {
      module: { include: { course: { include: { category: true } } } },
    },
  });

  console.log(`📋 Lecciones a migrar: ${lessons.length}\n`);
  if (lessons.length === 0) {
    await prisma.$disconnect();
    return;
  }

  if (flags.dryRun) {
    lessons.slice(0, 30).forEach((l, i) => {
      console.log(`   ${i + 1}. [${l.module.course.category.slug}] ${l.module.course.title} → ${l.title}`);
    });
    if (lessons.length > 30) console.log(`   ... y ${lessons.length - 30} más`);
    console.log('\nUsa --commit (sin --dry-run) para subir de verdad.\n');
    await prisma.$disconnect();
    return;
  }

  const drive = await getDrive();
  let success = 0;
  let failed = 0;
  const startedAt = Date.now();

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const label = `[${i + 1}/${lessons.length}] ${lesson.module.course.title} → ${lesson.title}`;
    process.stdout.write(`\n${label}\n   Drive ID: ${lesson.driveFileId}\n`);

    let bunnyVideoId: string | null = null;
    try {
      // 1. Obtener metadata de Drive (tamaño)
      const meta = await drive.files.get({ fileId: lesson.driveFileId, fields: 'id, size, name' });
      const sizeBytes = meta.data.size ? Number(meta.data.size) : undefined;
      const sizeMB = sizeBytes ? Math.round(sizeBytes / 1024 / 1024) : 0;
      process.stdout.write(`   Tamaño: ${sizeMB} MB\n`);

      // 2. Crear video en Bunny
      const title = `${lesson.module.course.title} — ${lesson.title}`.substring(0, 200);
      bunnyVideoId = await bunnyCreateVideo(libraryId, apiKey, title);
      process.stdout.write(`   Bunny video creado: ${bunnyVideoId}\n`);

      // 3. Stream desde Drive y upload a Bunny
      const driveStream = await drive.files.get(
        { fileId: lesson.driveFileId, alt: 'media' },
        { responseType: 'stream' },
      );
      process.stdout.write(`   Subiendo a Bunny...`);
      const uploadStart = Date.now();
      await bunnyUpload(libraryId, apiKey, bunnyVideoId, driveStream.data, sizeBytes);
      const uploadSec = Math.round((Date.now() - uploadStart) / 1000);
      process.stdout.write(` ✓ (${uploadSec}s)\n`);

      // 4. Guardar en DB
      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { bunnyVideoId },
      });
      process.stdout.write(`   ✅ DB actualizada\n`);
      success++;
    } catch (err: any) {
      process.stdout.write(`   ❌ Error: ${err.message}\n`);
      // Si creamos el video en Bunny pero falló después, lo borramos para no dejar huérfanos
      if (bunnyVideoId) {
        process.stdout.write(`   🗑  Limpiando video Bunny huérfano...\n`);
        await bunnyDelete(libraryId, apiKey, bunnyVideoId);
      }
      failed++;
    }
  }

  const elapsedMin = Math.round((Date.now() - startedAt) / 60000);
  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ Subidas:  ${success}`);
  console.log(`❌ Fallidas: ${failed}`);
  console.log(`⏱  Tiempo:   ${elapsedMin} min`);
  console.log(`═══════════════════════════════════════`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('💥', err);
  process.exit(1);
});
