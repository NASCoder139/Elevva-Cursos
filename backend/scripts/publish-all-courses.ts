import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

(async () => {
  const courses = await prisma.course.findMany({
    include: { _count: { select: { modules: true } } },
  });

  let published = 0;
  let skippedEmpty = 0;
  let alreadyPublished = 0;

  for (const c of courses) {
    if (c.isPublished) { alreadyPublished++; continue; }
    if ((c.lessonCount || 0) === 0) {
      console.log(`⏭  Sin lecciones: ${c.title} (${c.slug})`);
      skippedEmpty++;
      continue;
    }
    await prisma.course.update({
      where: { id: c.id },
      data: { isPublished: true },
    });
    published++;
  }

  console.log(`\n✔ Publicados: ${published}`);
  console.log(`✔ Ya estaban publicados: ${alreadyPublished}`);
  console.log(`⏭  Sin lecciones (no publicados): ${skippedEmpty}`);

  await prisma.$disconnect();
})();
