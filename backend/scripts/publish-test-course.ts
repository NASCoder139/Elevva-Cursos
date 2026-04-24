import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const slug = 'desarrolla-tu-influencer-virtual-fender-arche-2';
  const updated = await prisma.course.update({
    where: { slug },
    data: { isPublished: true },
    select: { title: true, slug: true, lessonCount: true, isPublished: true },
  });
  console.log(`\n✅ Publicado: ${updated.title}`);
  console.log(`   slug:        ${updated.slug}`);
  console.log(`   lecciones:   ${updated.lessonCount}`);
  console.log(`   isPublished: ${updated.isPublished}`);
  console.log(`\n🌐 Probalo en: http://localhost:5173/course/${updated.slug}`);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
