/**
 * Recorre un árbol de Google Drive con la estructura:
 *   Raíz → Categoría → Curso → Módulo → Lección (archivo de video)
 *
 * Uso:
 *   # Vista previa (no escribe nada en la DB): genera scripts/drive-tree.preview.json
 *   npx ts-node scripts/import-drive-tree.ts
 *
 *   # Commit: crea/actualiza categorías, cursos, módulos y lecciones
 *   npx ts-node scripts/import-drive-tree.ts --commit
 *
 *   # Limitar a los primeros N cursos por categoría (respetando el orden de Drive)
 *   npx ts-node scripts/import-drive-tree.ts --commit --limit 9
 *
 *   # Procesar solo ciertos cursos por slug
 *   npx ts-node scripts/import-drive-tree.ts --commit --only curso-a,curso-b
 *
 *   # Excluir categorías completas (por slug)
 *   npx ts-node scripts/import-drive-tree.ts --commit --skip-categories ia-chatg,otra
 *
 *   # Excluir cursos específicos por slug
 *   npx ts-node scripts/import-drive-tree.ts --commit --skip-courses cursos-saber-comunicar-club-de-oratoria
 *
 *   # Override de la carpeta raíz (si no usás GOOGLE_DRIVE_ROOT_FOLDER_ID)
 *   npx ts-node scripts/import-drive-tree.ts --root <folderId>
 */
import { PrismaClient } from '@prisma/client';
import { google, drive_v3 } from 'googleapis';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 80);

const cleanName = (name: string): string =>
  name.replace(/^\s*\d+[\.\-\)]?\s*/, '').trim();

const stripExt = (name: string): string =>
  name.replace(/\.(mp4|mov|webm|mkv|avi|m4v)$/i, '').trim();

const FOLDER_MIME = 'application/vnd.google-apps.folder';

// ─── Tipos ──────────────────────────────────────────────────────────────────

interface LessonNode {
  driveFileId: string;
  title: string;
  fileName: string;
  durationSeconds: number;
}
type ResourceType = 'PDF' | 'DOC' | 'SHEET' | 'PPT' | 'IMAGE' | 'AUDIO' | 'ARCHIVE' | 'OTHER';
interface ResourceNode {
  driveFileId: string;
  title: string;
  fileName: string;
  mimeType: string;
  type: ResourceType;
  sizeBytes: number;
}
interface ModuleNode {
  folderId: string;
  title: string;
  folderName: string;
  lessons: LessonNode[];
  resources: ResourceNode[];
}
interface CourseNode {
  folderId: string;
  title: string;
  slug: string;
  folderName: string;
  modules: ModuleNode[];
  totalLessons: number;
  totalSeconds: number;
  tsFiles: string[];
}
interface CategoryNode {
  folderId: string;
  name: string;
  slug: string;
  folderName: string;
  courses: CourseNode[];
}

// ─── Drive ──────────────────────────────────────────────────────────────────

async function buildDrive(): Promise<drive_v3.Drive> {
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath) throw new Error('GOOGLE_SERVICE_ACCOUNT_KEY_PATH no está definido en .env');
  const absolute = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
  if (!fs.existsSync(absolute)) throw new Error(`No se encontró el archivo de credenciales: ${absolute}`);
  const auth = new google.auth.GoogleAuth({
    keyFile: absolute,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

async function listFolder(drive: drive_v3.Drive, folderId: string) {
  const files: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const res = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields:
        'nextPageToken, files(id, name, mimeType, size, videoMediaMetadata, shortcutDetails)',
      pageSize: 1000,
      pageToken,
      orderBy: 'name',
    });
    files.push(...(res.data.files || []));
    pageToken = res.data.nextPageToken || undefined;
  } while (pageToken);
  return files;
}

// Resuelve shortcuts a su archivo de destino (devuelve el archivo original si no es shortcut)
async function resolveShortcut(
  drive: drive_v3.Drive,
  file: drive_v3.Schema$File,
): Promise<drive_v3.Schema$File> {
  if (file.mimeType !== 'application/vnd.google-apps.shortcut') return file;
  const targetId = file.shortcutDetails?.targetId;
  if (!targetId) return file;
  try {
    const res = await drive.files.get({
      fileId: targetId,
      fields: 'id, name, mimeType, size, videoMediaMetadata',
    });
    // Mantenemos el nombre del shortcut (suele estar mejor ordenado) pero el id/mime del target
    return { ...res.data, name: file.name || res.data.name };
  } catch {
    return file;
  }
}

const isVideo = (f: drive_v3.Schema$File) =>
  !!f.mimeType && (f.mimeType.startsWith('video/') || f.mimeType === 'application/octet-stream' && /\.(mp4|mov|webm|mkv|avi|m4v)$/i.test(f.name || ''));

// Archivo .ts (HLS / MPEG-TS) que no podemos reproducir en navegador tal cual.
// Drive suele reportarlos como text/plain, application/octet-stream o video/mp2t.
const isTsFile = (f: drive_v3.Schema$File) =>
  !!f.name && /\.ts$/i.test(f.name) && f.mimeType !== FOLDER_MIME;

// Clasifica archivos no-video como recursos descargables.
// Excluye metadata de macOS (__MACOSX, ._*) y archivos vacíos.
function classifyResource(f: drive_v3.Schema$File): ResourceType | null {
  const name = f.name || '';
  const mime = f.mimeType || '';
  if (mime === FOLDER_MIME) return null;
  if (name.startsWith('._') || name.includes('__MACOSX')) return null;
  if (mime.includes('pdf')) return 'PDF';
  if (mime.includes('wordprocessingml') || mime.includes('msword') || mime.includes('application/vnd.google-apps.document')) return 'DOC';
  if (mime.includes('spreadsheetml') || mime.includes('ms-excel') || mime.includes('application/vnd.google-apps.spreadsheet')) return 'SHEET';
  if (mime.includes('presentationml') || mime.includes('ms-powerpoint') || mime.includes('application/vnd.google-apps.presentation')) return 'PPT';
  if (mime.startsWith('image/')) return 'IMAGE';
  if (mime.startsWith('audio/')) return 'AUDIO';
  if (mime.includes('zip') || mime.includes('x-rar') || mime.includes('x-7z') || mime.includes('compressed')) return 'ARCHIVE';
  // Fallback por extensión en caso de application/octet-stream o faltante
  if (/\.pdf$/i.test(name)) return 'PDF';
  if (/\.(docx?|odt|rtf)$/i.test(name)) return 'DOC';
  if (/\.(xlsx?|ods|csv)$/i.test(name)) return 'SHEET';
  if (/\.(pptx?|odp|key)$/i.test(name)) return 'PPT';
  if (/\.(zip|rar|7z|tar|gz)$/i.test(name)) return 'ARCHIVE';
  return null; // No lo marcamos como recurso — podría ser un .ts, un video, un shortcut, etc.
}

// Recorre recursivamente una carpeta y devuelve videos + archivos .ts + recursos (PDFs, docs, etc.)
async function collectMediaRecursive(
  drive: drive_v3.Drive,
  folderId: string,
): Promise<{ videos: drive_v3.Schema$File[]; tsFiles: string[]; resources: drive_v3.Schema$File[] }> {
  const children = await listFolder(drive, folderId);
  const videos: drive_v3.Schema$File[] = [];
  const tsFiles: string[] = [];
  const resources: drive_v3.Schema$File[] = [];
  for (const child of children) {
    const resolved = await resolveShortcut(drive, child);
    if (isVideo(resolved)) {
      videos.push(resolved);
    } else if (isTsFile(resolved)) {
      tsFiles.push(resolved.name || '');
    } else if (resolved.mimeType === FOLDER_MIME) {
      const nested = await collectMediaRecursive(drive, resolved.id!);
      videos.push(...nested.videos);
      tsFiles.push(...nested.tsFiles);
      resources.push(...nested.resources);
    } else if (classifyResource(resolved) !== null) {
      resources.push(resolved);
    }
  }
  return { videos, tsFiles, resources };
}

async function getFolderMeta(drive: drive_v3.Drive, folderId: string) {
  const res = await drive.files.get({ fileId: folderId, fields: 'id, name, mimeType' });
  return res.data;
}

// ─── Walk ───────────────────────────────────────────────────────────────────

function videoToLesson(v: drive_v3.Schema$File): LessonNode {
  return {
    driveFileId: v.id!,
    fileName: v.name || '',
    title: cleanName(stripExt(v.name || 'Lección')),
    durationSeconds: v.videoMediaMetadata?.durationMillis
      ? Math.round(Number(v.videoMediaMetadata.durationMillis) / 1000)
      : 0,
  };
}

const stripResourceExt = (name: string): string =>
  name.replace(/\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp|rtf|csv|zip|rar|7z|tar|gz|jpe?g|png|gif|webp|mp3|wav|m4a|ogg)$/i, '').trim();

function fileToResource(f: drive_v3.Schema$File): ResourceNode | null {
  const type = classifyResource(f);
  if (!type) return null;
  return {
    driveFileId: f.id!,
    fileName: f.name || '',
    title: cleanName(stripResourceExt(f.name || 'Recurso')),
    mimeType: f.mimeType || 'application/octet-stream',
    type,
    sizeBytes: f.size ? Number(f.size) : 0,
  };
}

// Recorre una carpeta-módulo: junta todos los videos + recursos a cualquier profundidad
async function walkModule(
  drive: drive_v3.Drive,
  folder: drive_v3.Schema$File,
): Promise<{ module: ModuleNode; tsFiles: string[] }> {
  const { videos, tsFiles, resources } = await collectMediaRecursive(drive, folder.id!);
  return {
    module: {
      folderId: folder.id!,
      folderName: folder.name || '',
      title: cleanName(folder.name || 'Módulo'),
      lessons: videos.map(videoToLesson),
      resources: resources.map(fileToResource).filter((r): r is ResourceNode => r !== null),
    },
    tsFiles,
  };
}

async function walkCourse(drive: drive_v3.Drive, folder: drive_v3.Schema$File): Promise<CourseNode> {
  const children = await listFolder(drive, folder.id!);
  const resolvedChildren: drive_v3.Schema$File[] = [];
  for (const c of children) resolvedChildren.push(await resolveShortcut(drive, c));

  const subfolders = resolvedChildren.filter((f) => f.mimeType === FOLDER_MIME);
  const rootVideos = resolvedChildren.filter((f) => isVideo(f));
  const rootTsFiles = resolvedChildren.filter((f) => isTsFile(f)).map((f) => f.name || '');
  const rootResources = resolvedChildren
    .map(fileToResource)
    .filter((r): r is ResourceNode => r !== null);

  const modules: ModuleNode[] = [];
  const courseTsFiles: string[] = [...rootTsFiles];

  if (rootVideos.length > 0 || rootResources.length > 0) {
    modules.push({
      folderId: folder.id!,
      folderName: 'General',
      title: 'General',
      lessons: rootVideos.map(videoToLesson),
      resources: rootResources,
    });
  }

  for (const sub of subfolders) {
    const { module: mod, tsFiles } = await walkModule(drive, sub);
    modules.push(mod);
    courseTsFiles.push(...tsFiles);
  }

  const totalLessons = modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalSeconds = modules.reduce(
    (s, m) => s + m.lessons.reduce((a, l) => a + l.durationSeconds, 0),
    0,
  );
  const title = cleanName(folder.name || 'Curso');

  return {
    folderId: folder.id!,
    folderName: folder.name || '',
    title,
    slug: slugify(title),
    modules,
    totalLessons,
    totalSeconds,
    tsFiles: courseTsFiles,
  };
}

async function walkCategory(drive: drive_v3.Drive, folder: drive_v3.Schema$File): Promise<CategoryNode> {
  const children = await listFolder(drive, folder.id!);
  const courseFolders = children.filter((f) => f.mimeType === FOLDER_MIME);

  const courses: CourseNode[] = [];
  for (const cf of courseFolders) {
    courses.push(await walkCourse(drive, cf));
  }

  const name = cleanName(folder.name || 'Categoría');
  return {
    folderId: folder.id!,
    folderName: folder.name || '',
    name,
    slug: slugify(name),
    courses,
  };
}

async function walkRoot(drive: drive_v3.Drive, rootFolderId: string): Promise<CategoryNode[]> {
  const meta = await getFolderMeta(drive, rootFolderId);
  if (meta.mimeType !== FOLDER_MIME) throw new Error('El ID provisto no es una carpeta');
  const children = await listFolder(drive, rootFolderId);
  const categoryFolders = children.filter((f) => f.mimeType === FOLDER_MIME);

  const categories: CategoryNode[] = [];
  for (const cf of categoryFolders) {
    categories.push(await walkCategory(drive, cf));
  }
  return categories;
}

// ─── Commit a la DB ─────────────────────────────────────────────────────────

async function commitTree(
  tree: CategoryNode[],
  filter: { limit?: number; only?: string[]; skipCategories?: string[]; skipCourses?: string[] },
) {
  let categoryIdx = 0;
  let totalCoursesCreated = 0;
  let totalCoursesSkipped = 0;
  let totalEmptySkipped = 0;
  let totalLessons = 0;
  const usedSlugs = new Set<string>();

  for (const cat of tree) {
    if (filter.skipCategories?.includes(cat.slug)) {
      console.log(`\n⏭  Categoría omitida: "${cat.name}" (${cat.courses.length} cursos)`);
      totalCoursesSkipped += cat.courses.length;
      continue;
    }
    // Busca por slug O name para reconciliar con categorías que ya existen
    // (p.ej. seed previo con distinto slug pero mismo nombre)
    const existing = await prisma.category.findFirst({
      where: { OR: [{ slug: cat.slug }, { name: cat.name }] },
    });
    const category = existing
      ? await prisma.category.update({
          where: { id: existing.id },
          data: { name: cat.name, slug: cat.slug },
        })
      : await prisma.category.create({
          data: {
            name: cat.name,
            slug: cat.slug,
            sortOrder: categoryIdx++,
            isActive: true,
          },
        });
    console.log(`\n▶ Categoría: "${category.name}" (${cat.courses.length} cursos en Drive)`);

    let courseIdx = 0;
    const selected = filter.only
      ? cat.courses.filter((c) => filter.only!.includes(c.slug))
      : filter.limit
      ? cat.courses.slice(0, filter.limit)
      : cat.courses;

    for (const c of selected) {
      // Omitir cursos explícitamente excluidos
      if (filter.skipCourses?.includes(c.slug)) {
        console.log(`   ⏭  Omitido por filtro: ${c.title}`);
        totalCoursesSkipped++;
        continue;
      }
      // Auto-skip de cursos sin lecciones
      if (c.totalLessons === 0) {
        console.log(`   ⏭  Omitido (0 lecciones): ${c.title}`);
        totalEmptySkipped++;
        continue;
      }

      // Auto-sufijo si el slug ya se usó en esta corrida
      let finalSlug = c.slug;
      let suffix = 2;
      while (usedSlugs.has(finalSlug)) {
        finalSlug = `${c.slug}-${suffix++}`;
      }
      usedSlugs.add(finalSlug);
      if (finalSlug !== c.slug) {
        console.log(`   ℹ  Slug duplicado: "${c.slug}" → "${finalSlug}"`);
      }

      const course = await prisma.course.upsert({
        where: { slug: finalSlug },
        update: { title: c.title, categoryId: category.id },
        create: {
          title: c.title,
          slug: finalSlug,
          description: `Curso completo: ${c.title}.`,
          shortDesc: c.title,
          isPublished: false,
          sortOrder: courseIdx++,
          categoryId: category.id,
        },
      });

      // Borra módulos existentes para reimportar limpio (cascada borra lecciones)
      await prisma.module.deleteMany({ where: { courseId: course.id } });

      let modIdx = 0;
      let lessonsInCourse = 0;
      let secondsInCourse = 0;
      let resourcesInCourse = 0;

      for (const m of c.modules) {
        const mod = await prisma.module.create({
          data: { title: m.title, sortOrder: modIdx, courseId: course.id },
        });
        for (let i = 0; i < m.lessons.length; i++) {
          const l = m.lessons[i];
          const isFreePreview = modIdx === 0 && i === 0;
          await prisma.lesson.create({
            data: {
              title: l.title,
              driveFileId: l.driveFileId,
              durationSeconds: l.durationSeconds,
              sortOrder: i,
              moduleId: mod.id,
              isFreePreview,
            },
          });
          lessonsInCourse++;
          secondsInCourse += l.durationSeconds;
        }
        for (let i = 0; i < m.resources.length; i++) {
          const r = m.resources[i];
          await prisma.resource.create({
            data: {
              title: r.title,
              fileName: r.fileName,
              driveFileId: r.driveFileId,
              mimeType: r.mimeType,
              type: r.type,
              sizeBytes: BigInt(r.sizeBytes),
              sortOrder: i,
              moduleId: mod.id,
            },
          });
          resourcesInCourse++;
        }
        modIdx++;
      }

      await prisma.course.update({
        where: { id: course.id },
        data: { lessonCount: lessonsInCourse, durationMins: Math.round(secondsInCourse / 60) },
      });

      totalCoursesCreated++;
      totalLessons += lessonsInCourse;
      const resStr = resourcesInCourse > 0 ? `, ${resourcesInCourse} recursos` : '';
      console.log(`   ✔ ${c.title} — ${c.modules.length} módulos, ${lessonsInCourse} lecciones${resStr}, ${Math.round(secondsInCourse / 60)} min`);
    }

    totalCoursesSkipped += cat.courses.length - selected.length;
  }

  console.log(
    `\n✔ Importados: ${totalCoursesCreated} cursos, ${totalLessons} lecciones.`,
  );
  console.log(
    `   Omitidos por filtro: ${totalCoursesSkipped} | Omitidos por 0 lecciones: ${totalEmptySkipped}`,
  );
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes('--commit');
  const limitIdx = args.indexOf('--limit');
  const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : undefined;
  const onlyIdx = args.indexOf('--only');
  const only = onlyIdx >= 0 ? args[onlyIdx + 1].split(',').map((s) => s.trim()) : undefined;
  const skipIdx = args.indexOf('--skip-categories');
  const skipCategories =
    skipIdx >= 0 ? args[skipIdx + 1].split(',').map((s) => s.trim()) : undefined;
  const skipCoursesIdx = args.indexOf('--skip-courses');
  const skipCourses =
    skipCoursesIdx >= 0
      ? args[skipCoursesIdx + 1].split(',').map((s) => s.trim())
      : undefined;
  const rootIdx = args.indexOf('--root');
  const rootId =
    rootIdx >= 0 ? args[rootIdx + 1] : process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  if (!rootId) throw new Error('Falta el ID de la carpeta raíz: seteá GOOGLE_DRIVE_ROOT_FOLDER_ID o pasá --root <id>');

  console.log(`→ Raíz: ${rootId}`);
  console.log(`→ Modo: ${commit ? 'COMMIT (escribe en DB)' : 'PREVIEW (solo JSON)'}`);
  if (limit) console.log(`→ Límite: primeros ${limit} cursos por categoría`);
  if (only) console.log(`→ Filtro por slugs: ${only.join(', ')}`);
  if (skipCategories) console.log(`→ Categorías omitidas: ${skipCategories.join(', ')}`);
  if (skipCourses) console.log(`→ Cursos omitidos: ${skipCourses.join(', ')}`);

  const drive = await buildDrive();

  console.log('\n⏳ Leyendo árbol de Drive...');
  const tree = await walkRoot(drive, rootId);

  // Resumen
  const totalCourses = tree.reduce((s, c) => s + c.courses.length, 0);
  const totalLessons = tree.reduce(
    (s, c) => s + c.courses.reduce((a, co) => a + co.totalLessons, 0),
    0,
  );
  console.log(
    `\n✔ Encontrado: ${tree.length} categorías · ${totalCourses} cursos · ${totalLessons} lecciones\n`,
  );

  for (const cat of tree) {
    console.log(`📁 ${cat.name}`);
    cat.courses.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.title}  [slug: ${c.slug}]  ${c.totalLessons} lecc · ${Math.round(c.totalSeconds / 60)} min`);
    });
  }

  // Diagnóstico: para cada curso con 0 lecciones, listar qué contiene su carpeta
  const empty = tree.flatMap((cat) =>
    cat.courses.filter((c) => c.totalLessons === 0).map((c) => ({ cat: cat.name, course: c })),
  );
  if (empty.length > 0) {
    console.log(`\n⚠ Cursos con 0 lecciones (${empty.length}). Diagnóstico de contenido:`);
    for (const { cat, course } of empty) {
      console.log(`\n  📁 ${cat} / ${course.title}`);
      try {
        const children = await listFolder(drive, course.folderId);
        if (children.length === 0) {
          console.log(`     (carpeta vacía)`);
        } else {
          for (const ch of children) {
            const kind =
              ch.mimeType === FOLDER_MIME
                ? '📁 carpeta'
                : ch.mimeType === 'application/vnd.google-apps.shortcut'
                ? `🔗 shortcut → ${ch.shortcutDetails?.targetMimeType || '?'}`
                : ch.mimeType?.startsWith('video/')
                ? '🎬 video'
                : `📄 ${ch.mimeType || '?'}`;
            console.log(`     - ${kind}  "${ch.name}"`);
          }
        }
      } catch (err: any) {
        console.log(`     ✖ Error al leer la carpeta: ${err.message}`);
      }
    }
  }

  // Reporte de archivos .ts (MPEG-TS, necesitan conversión a .mp4 antes de importar)
  const coursesWithTs = tree.flatMap((cat) =>
    cat.courses
      .filter((c) => c.tsFiles.length > 0)
      .map((c) => ({ cat: cat.name, course: c })),
  );
  if (coursesWithTs.length > 0) {
    console.log(
      `\n⚠ Cursos con archivos .ts (no reproducibles en navegador, hay que convertir a .mp4):`,
    );
    for (const { cat, course } of coursesWithTs) {
      console.log(
        `\n  📁 ${cat} / ${course.title}  —  ${course.tsFiles.length} archivos .ts`,
      );
      course.tsFiles.slice(0, 5).forEach((name) => console.log(`     - ${name}`));
      if (course.tsFiles.length > 5) {
        console.log(`     ... y ${course.tsFiles.length - 5} más`);
      }
    }
    // Escribir reporte detallado a archivo para usar con el script de conversión
    const tsReportPath = path.resolve(process.cwd(), 'scripts/ts-files-report.json');
    fs.writeFileSync(
      tsReportPath,
      JSON.stringify(
        coursesWithTs.map(({ cat, course }) => ({
          category: cat,
          course: course.title,
          folderId: course.folderId,
          tsFiles: course.tsFiles,
        })),
        null,
        2,
      ),
      'utf8',
    );
    console.log(`\n💾 Reporte detallado de .ts: ${tsReportPath}`);
  }

  // Siempre escribe el preview JSON
  const outPath = path.resolve(process.cwd(), 'scripts/drive-tree.preview.json');
  fs.writeFileSync(outPath, JSON.stringify(tree, null, 2), 'utf8');
  console.log(`\n💾 JSON de vista previa: ${outPath}`);

  if (commit) {
    console.log('\n⏳ Escribiendo en la base de datos...');
    await commitTree(tree, { limit, only, skipCategories, skipCourses });
  } else {
    console.log('\nℹ Ejecutá de nuevo con --commit para crear los cursos en la DB.');
  }
}

main()
  .catch((e) => {
    console.error('\n✖ Error:', e.message || e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
