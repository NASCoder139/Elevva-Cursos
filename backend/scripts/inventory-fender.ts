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

async function list(drive: drive_v3.Drive, folderId: string) {
  const all: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, size), nextPageToken',
      pageSize: 200,
      pageToken,
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
    });
    all.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
  return all;
}

async function walk(
  drive: drive_v3.Drive,
  folderId: string,
  depth = 0,
  acc: { [mime: string]: { count: number; samples: string[] } } = {},
): Promise<typeof acc> {
  const children = await list(drive, folderId);
  for (const c of children) {
    if (c.mimeType === FOLDER_MIME) {
      await walk(drive, c.id!, depth + 1, acc);
    } else {
      const mime = c.mimeType || 'unknown';
      acc[mime] = acc[mime] || { count: 0, samples: [] };
      acc[mime].count++;
      if (acc[mime].samples.length < 3) acc[mime].samples.push(c.name || '');
    }
  }
  return acc;
}

async function main() {
  const drive = await buildDrive();
  const folderId = '1TRsdLFgH4EKuef8wg0u3I2oywEUV06DV'; // Fender Arche real
  console.log(`\n⏳ Inventariando carpeta completa del curso...`);
  const stats = await walk(drive, folderId);

  console.log(`\n📊 Inventario:\n`);
  const sorted = Object.entries(stats).sort((a, b) => b[1].count - a[1].count);
  for (const [mime, { count, samples }] of sorted) {
    const tag = mime.startsWith('video/') ? '🎬'
      : mime.includes('pdf') ? '📕'
      : mime.includes('word') || mime.includes('document') ? '📝'
      : mime.includes('sheet') || mime.includes('excel') ? '📊'
      : mime.includes('presentation') ? '🎯'
      : mime.startsWith('image/') ? '🖼 '
      : mime.includes('zip') ? '📦'
      : mime.startsWith('audio/') ? '🔊'
      : mime.startsWith('text/') ? '📄'
      : '❓';
    console.log(`   ${tag}  ${count.toString().padStart(4)} × ${mime}`);
    samples.forEach((s) => console.log(`         "${s}"`));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
