import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const lesson = await prisma.lesson.findFirst({
    where: { durationSeconds: { gt: 60 } },
    include: { module: { include: { course: true } } },
    orderBy: { durationSeconds: 'desc' },
  });
  if (!lesson) { console.log('NONE'); process.exit(0); }
  console.log(JSON.stringify({
    courseTitle: lesson.module.course.title,
    courseSlug: lesson.module.course.slug,
    courseId: lesson.module.course.id,
    moduleTitle: lesson.module.title,
    lessonTitle: lesson.title,
    lessonId: lesson.id,
    driveFileId: lesson.driveFileId,
    durationSeconds: lesson.durationSeconds,
  }));
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });
