import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dryRun = !process.argv.includes('--confirm');

  const seedCourses = await prisma.course.findMany({
    where: { lessonCount: 0 },
    orderBy: { title: 'asc' },
    select: { id: true, title: true, slug: true, categoryId: true },
  });

  console.log(`\n🔍 Cursos sin lecciones encontrados: ${seedCourses.length}\n`);
  seedCourses.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.title}  (slug: ${c.slug})`);
  });

  if (dryRun) {
    console.log(`\n⚠️  Modo DRY-RUN. Para borrar de verdad ejecutá:`);
    console.log(`   npx ts-node scripts/delete-seed-courses.ts --confirm\n`);
    await prisma.$disconnect();
    return;
  }

  console.log(`\n🗑  Borrando ${seedCourses.length} cursos...`);

  const ids = seedCourses.map((c) => c.id);

  // CourseTag depende de Course → borrar primero
  const deletedTags = await prisma.courseTag.deleteMany({
    where: { courseId: { in: ids } },
  });
  console.log(`   ✓ CourseTag borrados: ${deletedTags.count}`);

  // Favorite depende de Course
  const deletedFavs = await prisma.favorite.deleteMany({
    where: { courseId: { in: ids } },
  });
  console.log(`   ✓ Favorite borrados: ${deletedFavs.count}`);

  // Modules y Lessons tienen onDelete: Cascade, se borran solos
  const deleted = await prisma.course.deleteMany({
    where: { id: { in: ids } },
  });

  console.log(`\n✅ Cursos borrados: ${deleted.count}\n`);

  const restantes = await prisma.course.count();
  console.log(`📊 Cursos restantes en la base: ${restantes}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
