import { google, drive_v3 } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const FOLDER_MIME = 'application/vnd.google-apps.folder';
const SHORTCUT_MIME = 'application/vnd.google-apps.shortcut';

async function buildDrive(): Promise<drive_v3.Drive> {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH!;
  const absolute = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  const auth = new google.auth.GoogleAuth({
    keyFile: absolute,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

async function listAll(drive: drive_v3.Drive, folderId: string) {
  const files: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'nextPageToken, files(id, name, mimeType, size, shortcutDetails)',
      pageSize: 1000,
      pageToken,
      orderBy: 'name',
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
  return files;
}

async function walk(
  drive: drive_v3.Drive,
  folderId: string,
  depth = 0,
  acc: { [mime: string]: { count: number; samples: string[] } } = {},
): Promise<typeof acc> {
  const indent = '  '.repeat(depth);
  const children = await listAll(drive, folderId);
  console.error(`${indent}📂 folder ${folderId} → ${children.length} hijos`);
  for (const c of children) {
    let effective = c;
    if (c.mimeType === SHORTCUT_MIME) {
      try {
        const res = await drive.files.get({
          fileId: c.shortcutDetails?.targetId!,
          fields: 'id, name, mimeType',
        });
        effective = { ...res.data, name: c.name };
      } catch { /* ignore */ }
    }
    if (effective.mimeType === FOLDER_MIME) {
      await walk(drive, effective.id!, depth + 1, acc);
    } else {
      const mime = effective.mimeType || 'unknown';
      acc[mime] = acc[mime] || { count: 0, samples: [] };
      acc[mime].count++;
      if (acc[mime].samples.length < 3) {
        acc[mime].samples.push(effective.name || '');
      }
    }
  }
  return acc;
}

async function main() {
  const slug = process.argv[2] || 'desarrolla-tu-influencer-virtual-fender-arche-2';
  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) {
    console.log(`❌ No encuentro el curso con slug: ${slug}`);
    await prisma.$disconnect();
    return;
  }

  // Buscar el folderId en Drive — usamos el driveFileId de una lección para rastrear hacia arriba
  const firstLesson = await prisma.lesson.findFirst({
    where: { module: { courseId: course.id } },
  });
  if (!firstLesson) {
    console.log(`❌ Curso sin lecciones`);
    await prisma.$disconnect();
    return;
  }

  const drive = await buildDrive();

  // Subimos por parents hasta la carpeta del curso (3 niveles: módulo → curso)
  const lessonFile = await drive.files.get({
    fileId: firstLesson.driveFileId,
    fields: 'id, name, parents',
  });
  let current = lessonFile.data;
  let steps = 0;
  while (current.parents && current.parents.length > 0 && steps < 3) {
    const parentRes = await drive.files.get({
      fileId: current.parents[0],
      fields: 'id, name, parents, mimeType',
    });
    console.log(`↑ Parent: ${parentRes.data.name}`);
    current = parentRes.data;
    steps++;
  }
  // Al llegar aquí, current debería ser la carpeta de categoría. Subimos uno más solo para mostrar.

  // Lo que realmente queremos: la carpeta del curso. Sé que es 2 niveles arriba del archivo.
  // Redo: subo exactamente 2 niveles (módulo → curso)
  const m1 = await drive.files.get({ fileId: firstLesson.driveFileId, fields: 'parents' });
  const moduleFolder = m1.data.parents?.[0];
  if (!moduleFolder) {
    console.log('❌ No pude detectar carpeta del módulo');
    await prisma.$disconnect();
    return;
  }
  const m2 = await drive.files.get({ fileId: moduleFolder, fields: 'parents, name' });
  console.log(`\n📁 Carpeta del módulo detectada: ${m2.data.name}`);
  const courseFolder = m2.data.parents?.[0];
  if (!courseFolder) {
    console.log('❌ No pude detectar carpeta del curso');
    await prisma.$disconnect();
    return;
  }
  const courseFolderMeta = await drive.files.get({ fileId: courseFolder, fields: 'name' });
  console.log(`📁 Carpeta del curso detectada: ${courseFolderMeta.data.name}\n`);

  // Recorrer la carpeta del curso completa
  const stats = await walk(drive, courseFolder);

  console.log(`\n📊 Inventario de MIME types en "${course.title}":\n`);
  const sorted = Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  for (const [mime, { count, samples }] of sorted) {
    const kind = mime.startsWith('video/')
      ? '🎬 VIDEO'
      : mime.includes('pdf')
      ? '📕 PDF'
      : mime.includes('word') || mime.includes('document')
      ? '📝 DOC'
      : mime.includes('sheet') || mime.includes('excel')
      ? '📊 SHEET'
      : mime.includes('presentation')
      ? '🎯 PPT'
      : mime.startsWith('image/')
      ? '🖼  IMG'
      : mime.includes('zip') || mime.includes('compressed')
      ? '📦 ZIP'
      : mime.includes('audio/')
      ? '🔊 AUDIO'
      : '📄 OTRO';
    console.log(`   ${kind}  ${count.toString().padStart(4)} × ${mime}`);
    samples.forEach((s) => console.log(`         ${s}`));
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
