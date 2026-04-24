import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const total = await prisma.resource.count();
  const byType = await prisma.resource.groupBy({ by: ['type'], _count: { _all: true } });
  const coursesWithResources = await prisma.course.count({
    where: { modules: { some: { resources: { some: {} } } } },
  });
  const totalCourses = await prisma.course.count();
  console.log(`Recursos totales: ${total}`);
  console.log(`Cursos con recursos: ${coursesWithResources} / ${totalCourses}`);
  console.log(`\nPor tipo:`);
  for (const t of byType) console.log(`  ${t.type}: ${t._count._all}`);
  await prisma.$disconnect();
})();
