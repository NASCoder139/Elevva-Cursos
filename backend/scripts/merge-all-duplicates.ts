import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Para cada grupo de duplicados (slug base + `-N` variantes):
//  1. Elige destino: el publicado, o el que tenga más módulos (mejor estructura)
//  2. Migra recursos huérfanos del origen al destino (match por título de módulo,
//     o al primer módulo del destino como fallback)
//  3. Borra el curso origen (cascada módulos + lecciones; recursos ya movidos)

(async () => {
  const courses = await prisma.course.findMany({
    include: {
      modules: {
        orderBy: { sortOrder: 'asc' },
        include: { resources: true },
      },
    },
  });

  const groups = new Map<string, typeof courses>();
  for (const c of courses) {
    const base = c.slug.replace(/-\d+$/, '');
    const arr = groups.get(base) || [];
    arr.push(c);
    groups.set(base, arr);
  }

  let mergedGroups = 0;
  let deletedCourses = 0;
  let movedResources = 0;

  for (const [base, arr] of groups) {
    if (arr.length < 2) continue;

    // Destino: el publicado; si hay varios o ninguno publicado, el de más módulos
    const sorted = [...arr].sort((a, b) => {
      if (a.isPublished !== b.isPublished) return a.isPublished ? -1 : 1;
      return b.modules.length - a.modules.length;
    });
    const dest = sorted[0];
    const sources = sorted.slice(1);

    console.log(`\n◆ ${base}`);
    console.log(`  → DESTINO: ${dest.slug} (pub:${dest.isPublished}, ${dest.modules.length} mod)`);

    for (const src of sources) {
      console.log(`  ← FUENTE:  ${src.slug} (pub:${src.isPublished}, ${src.modules.length} mod)`);

      for (const srcMod of src.modules) {
        if (srcMod.resources.length === 0) continue;
        const destMod =
          dest.modules.find((m) => m.title.trim() === srcMod.title.trim()) ||
          dest.modules[0];
        if (!destMod) {
          console.log(`    ⚠ Destino sin módulos — imposible migrar ${srcMod.resources.length} recursos`);
          continue;
        }
        for (const r of srcMod.resources) {
          // Evita duplicados: si ya existe un recurso con el mismo driveFileId en el destino, skip
          const exists = await prisma.resource.findFirst({
            where: { driveFileId: r.driveFileId, module: { courseId: dest.id } },
            select: { id: true },
          });
          if (exists) {
            console.log(`    · skip (ya existe en destino): ${r.fileName}`);
            continue;
          }
          await prisma.resource.update({
            where: { id: r.id },
            data: { moduleId: destMod.id },
          });
          movedResources++;
          console.log(`    ✓ ${r.fileName} → "${destMod.title}"`);
        }
      }

      // Antes de borrar, verifica que no queden recursos en el source
      const remaining = await prisma.resource.count({
        where: { module: { courseId: src.id } },
      });
      if (remaining > 0) {
        console.log(`    ⚠ Quedan ${remaining} recursos en fuente — NO se borra.`);
        continue;
      }
      await prisma.course.delete({ where: { id: src.id } });
      deletedCourses++;
      console.log(`    🗑 Curso fuente borrado`);
    }

    mergedGroups++;
  }

  console.log(`\n✔ Grupos procesados: ${mergedGroups}`);
  console.log(`✔ Cursos borrados: ${deletedCourses}`);
  console.log(`✔ Recursos migrados: ${movedResources}`);

  await prisma.$disconnect();
})();
