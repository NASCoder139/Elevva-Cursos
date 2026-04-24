import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dryRun = !process.argv.includes('--confirm');

  const demos = await prisma.course.findMany({
    where: { slug: { startsWith: 'demo-' } },
    select: { id: true, title: true, slug: true, lessonCount: true },
    orderBy: { title: 'asc' },
  });

  console.log(`\n🔍 Cursos demo encontrados: ${demos.length}`);
  console.log(`   (todos con slug demo-*, lecciones falsas con thumbnails de Unsplash)\n`);

  if (dryRun) {
    demos.slice(0, 5).forEach((c) => console.log(`   - ${c.title} (${c.lessonCount} lecc falsas)`));
    console.log(`   ... y ${demos.length - 5} más`);
    console.log(`\n⚠️  DRY-RUN. Para borrar:\n   npx ts-node scripts/delete-demo-courses.ts --confirm\n`);
    await prisma.$disconnect();
    return;
  }

  const ids = demos.map((c) => c.id);

  const tags = await prisma.courseTag.deleteMany({ where: { courseId: { in: ids } } });
  const favs = await prisma.favorite.deleteMany({ where: { courseId: { in: ids } } });
  const purchases = await prisma.purchase.deleteMany({ where: { courseId: { in: ids } } });
  const deleted = await prisma.course.deleteMany({ where: { id: { in: ids } } });

  console.log(`🗑  CourseTag: ${tags.count}`);
  console.log(`🗑  Favoritos: ${favs.count}`);
  console.log(`🗑  Compras:   ${purchases.count}`);
  console.log(`✅ Cursos borrados: ${deleted.count}`);

  const restantes = await prisma.course.count();
  console.log(`\n📊 Cursos restantes: ${restantes}`);

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
