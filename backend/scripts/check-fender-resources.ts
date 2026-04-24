import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const course = await prisma.course.findUnique({
    where: { slug: 'desarrolla-tu-influencer-virtual-fender-arche' },
    include: {
      modules: {
        orderBy: { sortOrder: 'asc' },
        include: {
          resources: { orderBy: { sortOrder: 'asc' } },
          _count: { select: { lessons: true } },
        },
      },
    },
  });
  if (!course) { console.log('NO COURSE'); process.exit(1); }
  console.log(`Curso: ${course.title}`);
  console.log(`Módulos: ${course.modules.length}`);
  for (const m of course.modules) {
    const resLabel = m.resources.length > 0 ? ` · RESOURCES: ${m.resources.length}` : '';
    console.log(`  [${m.sortOrder}] ${m.title} — lecciones: ${m._count.lessons}${resLabel}`);
    for (const r of m.resources) {
      const sz = Number(r.sizeBytes);
      const kb = sz > 0 ? ` (${(sz/1024).toFixed(0)} KB)` : '';
      console.log(`      · ${r.type}: ${r.fileName}${kb}`);
    }
  }
  await prisma.$disconnect();
})();
