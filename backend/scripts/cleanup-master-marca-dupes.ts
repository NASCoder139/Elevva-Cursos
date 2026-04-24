import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const course = await prisma.course.findUnique({
    where: { slug: 'master-marca-personal-4-0-victor-heras-2' },
    include: {
      modules: {
        orderBy: { sortOrder: 'asc' },
        include: { resources: true },
      },
    },
  });
  if (!course) { console.log('NO COURSE'); return; }

  // Agrupa recursos por fileName. Para cada fileName con duplicados,
  // conserva UNO (el que NO esté en "Modulo 10" si hay opción).
  const byName = new Map<string, Array<{ id: string; moduleTitle: string; moduleSortOrder: number }>>();
  for (const m of course.modules) {
    for (const r of m.resources) {
      const arr = byName.get(r.fileName) || [];
      arr.push({ id: r.id, moduleTitle: m.title, moduleSortOrder: m.sortOrder });
      byName.set(r.fileName, arr);
    }
  }

  let deleted = 0;
  for (const [fileName, entries] of byName) {
    if (entries.length < 2) continue;
    // Preferir mantener el que NO está en el módulo "Modulo 10"
    const sorted = [...entries].sort((a, b) => {
      const aIsModulo10 = a.moduleTitle.startsWith('Modulo 10');
      const bIsModulo10 = b.moduleTitle.startsWith('Modulo 10');
      if (aIsModulo10 !== bIsModulo10) return aIsModulo10 ? 1 : -1;
      return 0;
    });
    const keep = sorted[0];
    const toDelete = sorted.slice(1);
    console.log(`\n${fileName}`);
    console.log(`  ✔ keep: "${keep.moduleTitle}"`);
    for (const d of toDelete) {
      console.log(`  ✗ delete: "${d.moduleTitle}"`);
      await prisma.resource.delete({ where: { id: d.id } });
      deleted++;
    }
  }
  console.log(`\n→ Recursos duplicados borrados: ${deleted}`);
  await prisma.$disconnect();
})();
