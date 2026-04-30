/**
 * Re-encodea TODOS los videos de la library Bunny configurada en .env.
 * Útil cuando agregás una nueva resolución (ej: 1080p) en library settings
 * y querés que los videos ya subidos generen esas calidades nuevas.
 *
 * Uso:
 *   # Sin filtros — todos los videos de la library
 *   npx ts-node scripts/bunny-reencode-all.ts
 *
 *   # Solo los que tengan match con un slug de categoría (consulta DB)
 *   npx ts-node scripts/bunny-reencode-all.ts --categories "inteligencia-artificial,crypto,ingles"
 *
 *   # Limitar a N videos (pruebas)
 *   npx ts-node scripts/bunny-reencode-all.ts --limit 5
 *
 *   # Dry-run
 *   npx ts-node scripts/bunny-reencode-all.ts --dry-run
 */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config({ override: false });

const prisma = new PrismaClient();

interface CliFlags {
  categories?: string[];
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
    else if (a === '--categories' && next) {
      flags.categories = next.split(/[\s,]+/).map(s => s.trim()).filter(Boolean);
      i++;
    }
  }
  return flags;
}

async function reencodeVideo(libraryId: string, apiKey: string, videoId: string): Promise<void> {
  const res = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${videoId}/reencode`, {
    method: 'POST',
    headers: { AccessKey: apiKey, Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`reencode ${res.status}: ${await res.text()}`);
  }
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  const libraryId = process.env.BUNNY_LIBRARY_ID;
  const apiKey = process.env.BUNNY_API_KEY;
  if (!libraryId || !apiKey) throw new Error('BUNNY_LIBRARY_ID y BUNNY_API_KEY requeridos');

  console.log('🔄 Bunny re-encode tool');
  console.log('   Library:', libraryId);
  console.log('   Modo:', flags.dryRun ? 'DRY-RUN (no reencode)' : 'COMMIT');
  if (flags.categories) console.log('   Categorías:', flags.categories.join(', '));
  if (flags.limit) console.log('   Limit:', flags.limit);
  console.log('');

  const where: any = { bunnyVideoId: { not: null } };
  if (flags.categories?.length) {
    where.module = { course: { category: { slug: { in: flags.categories } } } };
  }

  const lessons = await prisma.lesson.findMany({
    where,
    take: flags.limit,
    select: { id: true, title: true, bunnyVideoId: true },
  });

  console.log(`📋 Videos a re-encodear: ${lessons.length}\n`);
  if (lessons.length === 0) {
    await prisma.$disconnect();
    return;
  }

  if (flags.dryRun) {
    lessons.slice(0, 20).forEach((l, i) => console.log(`   ${i + 1}. ${l.title} → ${l.bunnyVideoId}`));
    if (lessons.length > 20) console.log(`   ... y ${lessons.length - 20} más`);
    await prisma.$disconnect();
    return;
  }

  let success = 0;
  let failed = 0;
  const startedAt = Date.now();

  for (let i = 0; i < lessons.length; i++) {
    const l = lessons[i];
    if (!l.bunnyVideoId) continue;
    process.stdout.write(`[${i + 1}/${lessons.length}] ${l.title.slice(0, 60)}... `);
    try {
      await reencodeVideo(libraryId, apiKey, l.bunnyVideoId);
      process.stdout.write(`✓\n`);
      success++;
    } catch (err: any) {
      process.stdout.write(`❌ ${err.message}\n`);
      failed++;
    }
    // Pausa breve para no saturar la API de Bunny
    await new Promise((r) => setTimeout(r, 200));
  }

  const elapsedMin = Math.round((Date.now() - startedAt) / 60000);
  console.log(`\n═══════════════════════════════════════`);
  console.log(`✅ Re-encode disparado: ${success}`);
  console.log(`❌ Fallidos:            ${failed}`);
  console.log(`⏱  Tiempo del script:   ${elapsedMin} min`);
  console.log(`═══════════════════════════════════════`);
  console.log(`\nℹ  Bunny ahora procesará los videos en background.`);
  console.log(`   Cada video tarda 5-15 min en regenerar las nuevas resoluciones.`);
  console.log(`   Podés cerrar esta terminal — el reencoding sigue en Bunny.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('💥', err);
  process.exit(1);
});
