import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const demos = await prisma.course.findMany({
    where: {
      OR: [
        { slug: { startsWith: 'demo-' } },
        { slug: { startsWith: 'store-' } },
      ],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      lessonCount: true,
      thumbnailUrl: true,
    },
    orderBy: { title: 'asc' },
  });

  console.log(`\n🔍 Cursos con slug demo-*/store-*: ${demos.length}\n`);
  demos.forEach((c, i) => {
    console.log(`   ${i + 1}. ${c.title}`);
    console.log(`      slug: ${c.slug}`);
    console.log(`      publicado: ${c.isPublished} · lecciones: ${c.lessonCount}`);
    console.log(`      thumbnail: ${c.thumbnailUrl?.slice(0, 60)}...`);
    console.log();
  });

  // Ver qué muestra la API pública (isPublished: true)
  const publicos = await prisma.course.findMany({
    where: { isPublished: true },
    select: { title: true, slug: true, lessonCount: true },
    orderBy: { title: 'asc' },
  });

  console.log(`\n📢 Cursos PÚBLICOS (isPublished=true): ${publicos.length}`);
  publicos.forEach((c) => console.log(`   - ${c.title} (${c.slug}) · ${c.lessonCount} lecc`));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
