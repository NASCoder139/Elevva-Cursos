import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const totalCourses = await prisma.course.count();
  const totalLessons = await prisma.lesson.count();
  const totalCategories = await prisma.category.count();
  const totalModules = await prisma.module.count();

  console.log(`\n📊 ESTADO FINAL`);
  console.log(`   Cursos:      ${totalCourses}`);
  console.log(`   Módulos:     ${totalModules}`);
  console.log(`   Lecciones:   ${totalLessons}`);
  console.log(`   Categorías:  ${totalCategories}`);

  const sinLecciones = await prisma.course.findMany({
    where: { lessonCount: 0 },
    orderBy: { title: 'asc' },
  });

  console.log(`\n⚠️  Cursos SIN lecciones: ${sinLecciones.length}`);
  sinLecciones.forEach((c) => {
    console.log(`   - ${c.title}`);
  });

  const ceroMin = await prisma.course.findMany({
    where: { durationMins: 0, lessonCount: { gt: 0 } },
    orderBy: { title: 'asc' },
  });

  console.log(`\n⚠️  Cursos con lecciones pero 0 min de duración: ${ceroMin.length}`);
  ceroMin.forEach((c) => {
    console.log(`   - ${c.title}: ${c.lessonCount} lecc`);
  });

  const top = await prisma.course.findMany({
    orderBy: { lessonCount: 'desc' },
    take: 10,
  });

  console.log(`\n🏆 Top 10 cursos por lecciones:`);
  top.forEach((c) => {
    const horas = Math.round(c.durationMins / 60);
    console.log(`   - ${c.title}: ${c.lessonCount} lecc · ${c.durationMins} min (${horas}h)`);
  });

  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
