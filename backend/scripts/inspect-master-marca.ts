import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  for (const slug of [
    'master-marca-personal-4-0-victor-heras',
    'master-marca-personal-4-0-victor-heras-2',
  ]) {
    const c = await prisma.course.findUnique({
      where: { slug },
      include: {
        modules: {
          orderBy: { sortOrder: 'asc' },
          include: {
            resources: { select: { type: true, fileName: true } },
            _count: { select: { lessons: true } },
          },
        },
      },
    });
    if (!c) continue;
    console.log(`\n=== ${c.title} (${c.slug}) ===`);
    for (const m of c.modules) {
      const r = m.resources.length > 0 ? ` · R:${m.resources.length}` : '';
      console.log(`  [${m.sortOrder}] "${m.title}" L:${m._count.lessons}${r}`);
      for (const res of m.resources) console.log(`      · ${res.type}: ${res.fileName}`);
    }
  }
  await prisma.$disconnect();
})();
