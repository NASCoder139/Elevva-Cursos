import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Migra recursos desde un curso "fuente" (duplicado, sin publicar) al
// curso "destino" (publicado) matcheando módulos por título.
// Después borra el curso fuente.

const SOURCE_SLUG = 'desarrolla-tu-influencer-virtual-fender-arche';
const DEST_SLUG = 'desarrolla-tu-influencer-virtual-fender-arche-2';

(async () => {
  const source = await prisma.course.findUnique({
    where: { slug: SOURCE_SLUG },
    include: { modules: { include: { resources: true } } },
  });
  const dest = await prisma.course.findUnique({
    where: { slug: DEST_SLUG },
    include: { modules: true },
  });
  if (!source || !dest) {
    console.error('No se encontraron ambos cursos');
    process.exit(1);
  }

  console.log(`Fuente: ${source.title} (${source.modules.length} módulos)`);
  console.log(`Destino: ${dest.title} (${dest.modules.length} módulos)`);

  let moved = 0;
  let unmatched = 0;

  for (const srcMod of source.modules) {
    if (srcMod.resources.length === 0) continue;
    const destMod = dest.modules.find((m) => m.title.trim() === srcMod.title.trim());
    if (!destMod) {
      console.log(`  ✗ Sin match: "${srcMod.title}" (${srcMod.resources.length} recursos)`);
      unmatched += srcMod.resources.length;
      continue;
    }
    for (const r of srcMod.resources) {
      await prisma.resource.update({
        where: { id: r.id },
        data: { moduleId: destMod.id },
      });
      console.log(`  ✓ ${r.fileName} → "${destMod.title}"`);
      moved++;
    }
  }

  console.log(`\n→ Recursos migrados: ${moved}`);
  if (unmatched > 0) console.log(`→ Recursos sin match: ${unmatched}`);

  // Borra el curso fuente (duplicado, sin publicar)
  // Cascada borra módulos + lecciones pero NO recursos (ya los movimos)
  const remaining = await prisma.resource.count({
    where: { module: { courseId: source.id } },
  });
  if (remaining > 0) {
    console.log(`\n⚠ Quedan ${remaining} recursos en el curso fuente. NO se borra para no perderlos.`);
  } else {
    await prisma.course.delete({ where: { id: source.id } });
    console.log(`\n✔ Curso duplicado borrado: ${source.slug}`);
  }

  await prisma.$disconnect();
})();
