import { google, drive_v3 } from 'googleapis';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config();

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

async function listFolder(drive: drive_v3.Drive, folderId: string, label: string) {
  const res = await drive.files.list({
    q: `'${folderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType, size), nextPageToken',
    pageSize: 100,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    orderBy: 'name',
  });
  const files = res.data.files || [];
  console.log(`\n📁 ${label} (${folderId}) → ${files.length} items`);
  files.forEach((f) => {
    const tag = f.mimeType === FOLDER_MIME ? '📁' : f.mimeType?.startsWith('video/') ? '🎬' : '📄';
    console.log(`   ${tag} ${f.name}  [${f.mimeType}]`);
  });
}

async function main() {
  const drive = await buildDrive();

  const agenciasId = '1R_pfI-QMUpgIkymdCVBev69Sg9tG54Ke';
  console.log(`\n🔎 Listando "3. Agencias":`);
  const res = await drive.files.list({
    q: `'${agenciasId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
    pageSize: 50,
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
  });
  (res.data.files || []).forEach((f) => {
    console.log(`   📁 ${f.name}  → id: ${f.id}`);
  });

  // Ambas "Fender Arche"
  for (const f of res.data.files || []) {
    if (f.name?.toLowerCase().includes('fender arche')) {
      await listFolder(drive, f.id!, `Contenido de: ${f.name}`);
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
