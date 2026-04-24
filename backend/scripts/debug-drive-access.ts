import { google, drive_v3 } from 'googleapis';
import { PrismaClient } from '@prisma/client';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();
const FOLDER_MIME = 'application/vnd.google-apps.folder';

async function buildDrive(): Promise<drive_v3.Drive> {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH!;
  const absolute = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  const auth = new google.auth.GoogleAuth({
    keyFile: absolute,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

async function listAll(drive: drive_v3.Drive, folderId: string, pageSize = 20) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size), nextPageToken',
    pageSize,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    orderBy: 'name',
  });
  return res.data.files || [];
}

async function main() {
  const drive = await buildDrive();

  // Tomamos el folderId real del curso desde el árbol conocido
  // Sabemos que el ROOT es GOOGLE_DRIVE_ROOT_FOLDER_ID, y necesitamos llegar a "Desarrolla tu influencer..."
  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID!;
  console.log(`\nROOT: ${rootId}`);

  const firstLesson = await prisma.lesson.findFirst({
    where: { module: { course: { slug: 'desarrolla-tu-influencer-virtual-fender-arche-2' } } },
  });
  console.log(`Lesson driveFileId: ${firstLesson?.driveFileId}`);

  // Trazar ancestros completos
  let fileId = firstLesson!.driveFileId;
  const ancestry: Array<{ id: string; name: string; mime: string }> = [];
  for (let i = 0; i < 10; i++) {
    const r = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, parents',
      supportsAllDrives: true,
    });
    ancestry.push({ id: r.data.id!, name: r.data.name || '', mime: r.data.mimeType || '' });
    if (!r.data.parents || r.data.parents.length === 0) break;
    fileId = r.data.parents[0];
  }

  console.log(`\n🔍 Ancestros (archivo → raíz):`);
  ancestry.forEach((a, i) => console.log(`   ${i}. [${a.mime.split('.').pop()}] ${a.name}  (${a.id})`));

  // Listar cada uno para ver qué contiene
  console.log(`\n📋 Contenido de cada carpeta ancestra:`);
  for (const a of ancestry) {
    if (a.mime !== FOLDER_MIME) continue;
    const kids = await listAll(drive, a.id, 30);
    console.log(`\n   📁 "${a.name}" (${a.id}) → ${kids.length} items`);
    kids.slice(0, 20).forEach((k) => {
      const tag = k.mimeType === FOLDER_MIME ? '📁' : k.mimeType?.startsWith('video/') ? '🎬' : '📄';
      console.log(`      ${tag} ${k.name}  [${k.mimeType?.split('/').pop()}]`);
    });
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
