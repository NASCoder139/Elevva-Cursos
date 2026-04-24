/**
 * Convierte archivos .ts → .mp4 directamente en Google Drive.
 *
 * Flujo por archivo:
 *   1) Descarga el .ts a un temp local
 *   2) Corre ffmpeg (remux rápido, con reencode de fallback si falla)
 *   3) Reemplaza el contenido del archivo en Drive (mismo fileId) con el .mp4
 *      y cambia el nombre y mimeType. NO crea archivo nuevo — así se mantiene
 *      la quota del usuario original (las Service Accounts no tienen quota).
 *   4) Limpia los temp locales
 *
 * Requiere:
 *   - ffmpeg en PATH
 *   - Service Account con permiso de Editor sobre la carpeta raíz
 *   - .env con GOOGLE_SERVICE_ACCOUNT_KEY_PATH y GOOGLE_DRIVE_ROOT_FOLDER_ID
 *
 * Uso:
 *   npx ts-node scripts/convert-ts-in-drive.ts                   # preview (solo lista)
 *   npx ts-node scripts/convert-ts-in-drive.ts --run             # ejecuta
 *   npx ts-node scripts/convert-ts-in-drive.ts --run --limit 5   # prueba con 5 archivos
 *   npx ts-node scripts/convert-ts-in-drive.ts --run --reencode  # fuerza reencode (más robusto)
 */
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawnSync } from 'child_process';
import * as dotenv from 'dotenv';

dotenv.config();

const FOLDER_MIME = 'application/vnd.google-apps.folder';

interface TsFile {
  fileId: string;
  name: string;
  parentFolderId: string;
  pathDisplay: string;
}

async function buildDrive(): Promise<drive_v3.Drive> {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_PATH no está definido en .env');
  const absolute = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  if (!fs.existsSync(absolute)) throw new Error(`No se encontró el archivo de credenciales: ${absolute}`);
  const auth = new google.auth.GoogleAuth({
    keyFile: absolute,
    scopes: ['https://www.googleapis.com/auth/drive'], // escritura completa
  });
  return google.drive({ version: 'v3', auth });
}

async function withRetry<T>(fn: () => Promise<T>, label: string, maxAttempts = 5): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastErr = err;
      const status = err?.response?.status ?? err?.code;
      const retryable =
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 429 ||
        /internal error|timeout|ECONNRESET|ETIMEDOUT/i.test(err?.message || '');
      if (!retryable || attempt === maxAttempts) throw err;
      const delay = Math.min(2000 * 2 ** (attempt - 1), 20000);
      console.log(`   ⚠ ${label} falló (${status || '?'}), reintentando en ${delay}ms (intento ${attempt}/${maxAttempts})`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

async function listFolder(drive: drive_v3.Drive, folderId: string) {
  const files: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const res = await withRetry(
      () =>
        drive.files.list({
          q: `'${folderId}' in parents and trashed = false`,
          fields: 'nextPageToken, files(id, name, mimeType, size)',
          pageSize: 1000,
          pageToken,
          orderBy: 'name',
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        }),
      `listFolder(${folderId})`,
    );
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
  return files;
}

async function collectTsFiles(
  drive: drive_v3.Drive,
  folderId: string,
  currentPath = '',
): Promise<TsFile[]> {
  const children = await listFolder(drive, folderId);
  const result: TsFile[] = [];
  for (const child of children) {
    const subPath = currentPath ? `${currentPath}/${child.name}` : child.name!;
    if (child.mimeType === FOLDER_MIME) {
      result.push(...(await collectTsFiles(drive, child.id!, subPath)));
    } else if (/\.ts$/i.test(child.name || '')) {
      result.push({
        fileId: child.id!,
        name: child.name!,
        parentFolderId: folderId,
        pathDisplay: subPath,
      });
    }
  }
  return result;
}

async function downloadFile(drive: drive_v3.Drive, fileId: string, dest: string) {
  const res = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' },
  );
  await new Promise<void>((resolve, reject) => {
    const out = fs.createWriteStream(dest);
    (res.data as NodeJS.ReadableStream)
      .on('error', reject)
      .pipe(out)
      .on('finish', resolve)
      .on('error', reject);
  });
}

function runFfmpeg(
  input: string,
  output: string,
  reencode: boolean,
): { ok: boolean; stderr: string } {
  const args = reencode
    ? [
        '-fflags', '+genpts+igndts',
        '-err_detect', 'ignore_err',
        '-i', input,
        '-c:v', 'libx264', '-preset', 'fast', '-crf', '20',
        '-c:a', 'aac', '-b:a', '192k',
        '-movflags', '+faststart',
        '-loglevel', 'error',
        '-y', output,
      ]
    : [
        '-i', input,
        '-c', 'copy',
        '-bsf:a', 'aac_adtstoasc',
        '-loglevel', 'error',
        '-y', output,
      ];
  const res = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  const ok =
    res.status === 0 && fs.existsSync(output) && fs.statSync(output).size > 0;
  return { ok, stderr: res.stderr || '' };
}

// Reemplaza el contenido de un archivo existente y cambia su nombre/mimeType.
// Mantiene el mismo fileId y el mismo owner (por eso usa la quota del usuario,
// no de la Service Account que no tiene quota propia).
async function replaceFile(
  drive: drive_v3.Drive,
  fileId: string,
  localPath: string,
  newName: string,
): Promise<void> {
  await drive.files.update({
    fileId,
    requestBody: {
      name: newName,
      mimeType: 'video/mp4',
    },
    media: {
      mimeType: 'video/mp4',
      body: fs.createReadStream(localPath),
    },
    supportsAllDrives: true,
  });
}

function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)}GB`;
}

async function main() {
  const args = process.argv.slice(2);
  const run = args.includes('--run');
  const forceReencode = args.includes('--reencode');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined;

  const rootId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  if (!rootId) throw new Error('GOOGLE_DRIVE_ROOT_FOLDER_ID no está definido en .env');

  console.log(`→ Modo: ${run ? 'EJECUTAR (descarga → ffmpeg → reemplaza en Drive con mismo fileId)' : 'PREVIEW (solo lista)'}`);
  console.log(`→ Raíz: ${rootId}`);
  if (forceReencode) console.log('→ Reencode forzado (más lento, más robusto)');
  if (limit) console.log(`→ Límite: ${limit} archivos`);

  const drive = await buildDrive();

  // Test de conexión: verifica que la Service Account puede ver la carpeta raíz
  console.log('\n🔑 Verificando acceso a la carpeta raíz...');
  try {
    const meta = await drive.files.get({
      fileId: rootId,
      fields: 'id, name, mimeType, capabilities(canEdit, canAddChildren, canDelete)',
      supportsAllDrives: true,
    });
    console.log(`   ✔ Carpeta: "${meta.data.name}"`);
    console.log(`   ✔ Permisos: canEdit=${meta.data.capabilities?.canEdit} canAddChildren=${meta.data.capabilities?.canAddChildren} canDelete=${meta.data.capabilities?.canDelete}`);
    if (!meta.data.capabilities?.canEdit || !meta.data.capabilities?.canAddChildren) {
      console.log('   ⚠ ADVERTENCIA: la Service Account no tiene permisos de Editor sobre esta carpeta.');
      console.log('     En Drive, compartila con la cuenta de servicio como "Editor".');
    }
  } catch (err: any) {
    console.error(`   ✖ No puedo acceder a la carpeta raíz: ${err.message}`);
    console.error(`   Detalle:`, err.response?.data || err);
    throw err;
  }

  console.log('\n⏳ Buscando archivos .ts en el árbol completo...');
  const all = await collectTsFiles(drive, rootId);
  const tsFiles = limit ? all.slice(0, limit) : all;
  console.log(`✔ Encontrados: ${all.length} archivos .ts${limit ? ` (procesando primeros ${tsFiles.length})` : ''}\n`);

  if (tsFiles.length === 0) {
    console.log('Nada para convertir.');
    return;
  }

  // Preview
  tsFiles.slice(0, 15).forEach((f, i) => console.log(`  ${i + 1}. ${f.pathDisplay}`));
  if (tsFiles.length > 15) console.log(`  ... y ${tsFiles.length - 15} más`);

  if (!run) {
    console.log('\nℹ Ejecutá con --run para procesar.');
    console.log('   Tip: empezá con --run --limit 3 para probar antes de hacer todos.');
    return;
  }

  const tempDir = path.join(os.tmpdir(), `drive-ts-convert-${Date.now()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  console.log(`\n📂 Temp: ${tempDir}`);

  const logPath = path.resolve(process.cwd(), 'scripts/convert-errors.log');
  fs.writeFileSync(logPath, `=== Conversion started: ${new Date().toISOString()} ===\n`, 'utf8');

  let ok = 0;
  let fail = 0;
  const failedFiles: string[] = [];
  const startTime = Date.now();

  for (let i = 0; i < tsFiles.length; i++) {
    const f = tsFiles[i];
    const prefix = `[${i + 1}/${tsFiles.length}]`;
    const tsLocal = path.join(tempDir, `${f.fileId}.ts`);
    const mp4Local = path.join(tempDir, `${f.fileId}.mp4`);
    const mp4Name = f.name.replace(/\.ts$/i, '.mp4');

    console.log(`\n${prefix} ${f.pathDisplay}`);

    const fileStart = Date.now();
    try {
      const tStart = Date.now();
      process.stdout.write('   ⏬ descargando... ');
      await downloadFile(drive, f.fileId, tsLocal);
      const tsSize = fs.statSync(tsLocal).size;
      process.stdout.write(`✔ ${fmtBytes(tsSize)} en ${((Date.now() - tStart) / 1000).toFixed(1)}s\n`);

      const ffStart = Date.now();
      process.stdout.write('   🔄 ffmpeg (remux)... ');
      let result = runFfmpeg(tsLocal, mp4Local, forceReencode);
      if (!result.ok && !forceReencode) {
        process.stdout.write('falló, reintentando con reencode... ');
        result = runFfmpeg(tsLocal, mp4Local, true);
      }
      if (!result.ok) throw new Error(`ffmpeg: ${result.stderr.slice(0, 300)}`);
      const mp4Size = fs.statSync(mp4Local).size;
      process.stdout.write(`✔ ${fmtBytes(mp4Size)} en ${((Date.now() - ffStart) / 1000).toFixed(1)}s\n`);

      const upStart = Date.now();
      process.stdout.write('   ⏫ reemplazando .ts por .mp4 (mismo fileId)... ');
      await replaceFile(drive, f.fileId, mp4Local, mp4Name);
      process.stdout.write(`✔ ${((Date.now() - upStart) / 1000).toFixed(1)}s\n`);

      const elapsedFile = (Date.now() - fileStart) / 1000;
      const elapsedTotal = (Date.now() - startTime) / 1000;
      const avgPerFile = elapsedTotal / (i + 1);
      const remaining = tsFiles.length - (i + 1);
      const etaMin = (remaining * avgPerFile) / 60;
      console.log(
        `   ⏱  archivo: ${elapsedFile.toFixed(1)}s | promedio: ${avgPerFile.toFixed(1)}s/archivo | ETA: ${etaMin.toFixed(1)} min`,
      );

      ok++;
    } catch (e: any) {
      fail++;
      failedFiles.push(f.pathDisplay);
      console.log(`   ✖ FALLO: ${e.message}`);
      fs.appendFileSync(
        logPath,
        `--- FAIL: ${f.pathDisplay} (fileId=${f.fileId}) ---\n${e.message || e}\n\n`,
        'utf8',
      );
    } finally {
      try { if (fs.existsSync(tsLocal)) fs.unlinkSync(tsLocal); } catch {}
      try { if (fs.existsSync(mp4Local)) fs.unlinkSync(mp4Local); } catch {}
    }
  }

  try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}

  const elapsedMin = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n────────────────────────────────`);
  console.log(`✔ Convertidos: ${ok} / ${tsFiles.length}  (${elapsedMin} min)`);
  if (fail > 0) {
    console.log(`✖ Fallos: ${fail}`);
    console.log(`\nArchivos que fallaron:`);
    failedFiles.forEach((p) => console.log(`  - ${p}`));
    console.log(`\nDetalles: ${logPath}`);
    if (!forceReencode) {
      console.log(`\nSugerencia: reintentá los fallos con --reencode`);
    }
  }
  console.log(`\nℹ Los archivos conservaron el mismo fileId — solo cambió el contenido y el nombre (.ts → .mp4).`);
}

main().catch((e) => {
  console.error('\n✖ Error:', e.message || e);
  if (e?.response?.data) {
    console.error('   Drive API detalle:', JSON.stringify(e.response.data, null, 2));
  }
  if (e?.stack) console.error('   Stack:', e.stack.split('\n').slice(0, 5).join('\n'));
  process.exit(1);
});
