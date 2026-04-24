/**
 * Escanea frontend/public/courses/<folder>/<archivo> y matchea cada imagen
 * a un curso de la DB usando overlap de tokens entre el nombre del archivo
 * y el título del curso, restringido a la categoría del folder.
 *
 *   npx ts-node scripts/match-thumbnails.ts          # preview (no escribe)
 *   npx ts-node scripts/match-thumbnails.ts --commit # actualiza thumbnailUrl
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const PUBLIC_COURSES = path.resolve(
  __dirname,
  '..',
  '..',
  'frontend',
  'public',
  'courses',
);

const STOPWORDS = new Set([
  'de','del','la','el','los','las','y','o','u','un','una','en','con','para','por',
  'a','al','curso','master','clase','clases','tu','tus','mi','mis','que','como',
  'es','sin','the','of','for','to','your','my','vs','con-','di','le',
]);

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const tokens = (s: string): Set<string> => {
  const arr = slugify(s)
    .split(' ')
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
  return new Set(arr);
};

const scoreOverlap = (fileTokens: Set<string>, titleTokens: Set<string>): number => {
  let common = 0;
  for (const t of fileTokens) if (titleTokens.has(t)) common++;
  if (common === 0) return 0;
  // Score privilegia overlap relativo al archivo (los nombres de archivo suelen ser más cortos)
  return common / Math.max(fileTokens.size, 1);
};

// Mapea nombre de carpeta tipo "1. ADS - Anuncios - Facebook Google TikTok" → slug
const folderToCategorySlug = (folder: string): string =>
  slugify(folder.replace(/^\d+\.\s*/, '')).replace(/\s+/g, '-');

interface Match {
  file: string;
  url: string;
  course?: { id: string; slug: string; title: string };
  score: number;
  alternatives?: Array<{ slug: string; title: string; score: number }>;
}

(async () => {
  const commit = process.argv.includes('--commit');

  if (!fs.existsSync(PUBLIC_COURSES)) {
    console.error(`No existe: ${PUBLIC_COURSES}`);
    process.exit(1);
  }

  const categories = await prisma.category.findMany({
    include: {
      courses: { select: { id: true, slug: true, title: true, thumbnailUrl: true } },
    },
  });

  // Indexa categorías por slug para lookup rápido
  const catBySlug = new Map(categories.map((c) => [c.slug, c]));

  const folders = fs
    .readdirSync(PUBLIC_COURSES)
    .filter((f) => fs.statSync(path.join(PUBLIC_COURSES, f)).isDirectory());

  const matches: Match[] = [];
  const unmatchedFolders: string[] = [];
  const usedCourses = new Set<string>();

  for (const folder of folders) {
    const catSlug = folderToCategorySlug(folder);
    // 1. Match exacto por slug
    let category = catBySlug.get(catSlug);
    // 2. Containment
    if (!category) {
      category = categories.find(
        (c) => c.slug.includes(catSlug) || catSlug.includes(c.slug),
      );
    }
    // 3. Fuzzy por tokens de la categoría (acepta typos como "Ecommers" vs "Ecommerce")
    if (!category) {
      const folderTokens = tokens(folder.replace(/^\d+\.\s*/, ''));
      const scored = categories
        .map((c) => ({ c, score: scoreOverlap(folderTokens, tokens(c.name)) }))
        .filter((x) => x.score >= 0.5)
        .sort((a, b) => b.score - a.score);
      if (scored.length > 0) category = scored[0].c;
    }
    if (!category) {
      unmatchedFolders.push(folder);
      continue;
    }

    const files = fs
      .readdirSync(path.join(PUBLIC_COURSES, folder))
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f));

    for (const file of files) {
      const fileBase = file.replace(/\.[^.]+$/, '');
      const fileTokens = tokens(fileBase);

      const scored = category.courses
        .map((c) => ({ ...c, score: scoreOverlap(fileTokens, tokens(c.title)) }))
        .filter((c) => c.score > 0)
        .sort((a, b) => b.score - a.score);

      const best = scored[0];
      const url = `/courses/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`;

      matches.push({
        file: `${folder}/${file}`,
        url,
        course: best ? { id: best.id, slug: best.slug, title: best.title } : undefined,
        score: best?.score || 0,
        alternatives: scored.slice(1, 3).map((s) => ({ slug: s.slug, title: s.title, score: s.score })),
      });
    }
  }

  // Resolver conflictos: si dos archivos matchean al mismo curso, gana el de score más alto
  const byCourse = new Map<string, Match>();
  for (const m of matches) {
    if (!m.course) continue;
    const existing = byCourse.get(m.course.id);
    if (!existing || m.score > existing.score) byCourse.set(m.course.id, m);
  }

  // Imprime resumen
  console.log(`\n📁 Carpetas escaneadas: ${folders.length}`);
  if (unmatchedFolders.length > 0) {
    console.log(`⚠ Carpetas sin categoría: ${unmatchedFolders.join(', ')}`);
  }
  console.log(`🖼 Imágenes encontradas: ${matches.length}`);

  const matched = matches.filter((m) => m.course);
  const unmatched = matches.filter((m) => !m.course);
  const goodMatches = matched.filter((m) => m.score >= 0.5);
  const lowMatches = matched.filter((m) => m.score < 0.5);

  console.log(`✔ Match alta confianza (≥0.5): ${goodMatches.length}`);
  console.log(`⚠ Match baja confianza (<0.5): ${lowMatches.length}`);
  console.log(`✗ Sin match: ${unmatched.length}`);

  if (lowMatches.length > 0) {
    console.log(`\n--- BAJA CONFIANZA (revisar) ---`);
    for (const m of lowMatches) {
      console.log(`  ${m.file}`);
      console.log(`    → ${m.course!.title} (${m.score.toFixed(2)})`);
      if (m.alternatives && m.alternatives.length > 0) {
        for (const alt of m.alternatives) {
          console.log(`       alt: ${alt.title} (${alt.score.toFixed(2)})`);
        }
      }
    }
  }

  if (unmatched.length > 0) {
    console.log(`\n--- SIN MATCH (no se asignan) ---`);
    for (const m of unmatched) console.log(`  ${m.file}`);
  }

  // Aplica solo matches altos + bajos por defecto (todos los detectados)
  const toApply = [...byCourse.values()];

  if (!commit) {
    console.log(`\n[PREVIEW] Se aplicarían ${toApply.length} thumbnails. Pasá --commit para escribir.`);
    await prisma.$disconnect();
    return;
  }

  let updated = 0;
  for (const m of toApply) {
    if (!m.course) continue;
    await prisma.course.update({
      where: { id: m.course.id },
      data: { thumbnailUrl: m.url },
    });
    updated++;
    usedCourses.add(m.course.id);
  }
  console.log(`\n✔ Thumbnails actualizados: ${updated}`);

  // Cursos sin thumbnail
  const allCourses = categories.flatMap((c) => c.courses);
  const without = allCourses.filter((c) => !usedCourses.has(c.id) && !c.thumbnailUrl);
  if (without.length > 0) {
    console.log(`\n⚠ ${without.length} cursos sin thumbnail asignado:`);
    for (const c of without.slice(0, 20)) console.log(`   - ${c.title}`);
    if (without.length > 20) console.log(`   ... +${without.length - 20} más`);
  }

  await prisma.$disconnect();
})();
