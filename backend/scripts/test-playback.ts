import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // 1. Listar usuarios admin
  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN' },
    select: { id: true, email: true },
  });
  console.log(`\n👑 Admins en la base: ${admins.length}`);
  admins.forEach((a) => console.log(`   - ${a.email}`));

  // 2. Encontrar un curso con lecciones reales
  const curso = await prisma.course.findFirst({
    where: {
      lessonCount: { gt: 10 },
      durationMins: { gt: 0 },
    },
    include: {
      modules: {
        include: {
          lessons: {
            take: 1,
            orderBy: { sortOrder: 'asc' },
          },
        },
        take: 1,
        orderBy: { sortOrder: 'asc' },
      },
    },
    orderBy: { lessonCount: 'desc' },
  });

  if (!curso) {
    console.log('❌ No hay cursos con lecciones');
    await prisma.$disconnect();
    return;
  }

  const lesson = curso.modules[0]?.lessons[0];
  console.log(`\n🎬 Curso de prueba: ${curso.title}`);
  console.log(`   slug: ${curso.slug}`);
  console.log(`   publicado: ${curso.isPublished}`);
  console.log(`   lecciones: ${curso.lessonCount} · ${curso.durationMins} min`);
  if (lesson) {
    console.log(`   1ra lección:  ${lesson.title}`);
    console.log(`   driveFileId:  ${lesson.driveFileId}`);
    console.log(`   duración:     ${lesson.durationSeconds}s`);
    console.log(`   esFreePreview:${lesson.isFreePreview}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
