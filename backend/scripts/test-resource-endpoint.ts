import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const course = await prisma.course.findUnique({
    where: { slug: 'desarrolla-tu-influencer-virtual-fender-arche' },
    include: {
      modules: {
        include: {
          resources: { take: 1, orderBy: { sortOrder: 'asc' } },
          _count: { select: { lessons: true } },
        },
      },
    },
  });
  console.log('Course ID:', course?.id);
  const resWithLessons = course?.modules.find(m => m._count.lessons > 0 && m.resources.length > 0);
  const resNoLessons = course?.modules.find(m => m._count.lessons === 0 && m.resources.length > 0);
  console.log('Resource en módulo CON lecciones:', resWithLessons?.resources[0]?.id, '-', resWithLessons?.resources[0]?.fileName);
  console.log('Resource en módulo SIN lecciones:', resNoLessons?.resources[0]?.id, '-', resNoLessons?.resources[0]?.fileName);

  const admin = await prisma.user.findFirst({
    where: { role: { in: ['SUPER_ADMIN' as any, 'ADMIN' as any] } },
    select: { id: true, email: true, role: true },
  });
  console.log('Admin:', admin?.email, admin?.id);
  await prisma.$disconnect();
})();
