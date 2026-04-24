import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const courses = await prisma.course.findMany({
    where: { title: { contains: 'Fender', mode: 'insensitive' } },
    include: {
      modules: {
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: { select: { lessons: true, resources: true } },
        },
      },
    },
  });
  for (const c of courses) {
    console.log(`\n=== ${c.title} ===`);
    console.log(`  slug: ${c.slug}`);
    console.log(`  isPublished: ${c.isPublished}`);
    console.log(`  lessonCount: ${c.lessonCount}`);
    console.log(`  modules: ${c.modules.length}`);
    for (const m of c.modules) {
      console.log(`    [${m.sortOrder}] ${m.title} — L:${m._count.lessons} R:${m._count.resources}`);
    }
  }
  await prisma.$disconnect();
})();
