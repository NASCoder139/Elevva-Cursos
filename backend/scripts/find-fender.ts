import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const rows = await prisma.course.findMany({
    where: { title: { contains: 'Fender', mode: 'insensitive' } },
    select: { slug: true, title: true, categoryId: true, category: { select: { slug: true } } },
  });
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
})();
