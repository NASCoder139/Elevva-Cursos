import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

(async () => {
  const courses = await prisma.course.findMany({
    include: {
      modules: {
        include: {
          _count: { select: { lessons: true, resources: true } },
        },
      },
    },
  });

  // Agrupa por slug base (sin sufijo numérico -2, -3, ...)
  const groups = new Map<string, typeof courses>();
  for (const c of courses) {
    const base = c.slug.replace(/-\d+$/, '');
    const arr = groups.get(base) || [];
    arr.push(c);
    groups.set(base, arr);
  }

  console.log('=== DUPLICADOS DETECTADOS ===\n');
  let pairs = 0;
  for (const [base, arr] of groups) {
    if (arr.length < 2) continue;
    pairs++;
    console.log(`\n◆ Base slug: ${base}`);
    for (const c of arr) {
      const totalLessons = c.modules.reduce((s, m) => s + m._count.lessons, 0);
      const totalResources = c.modules.reduce((s, m) => s + m._count.resources, 0);
      const emoji = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(c.title) ? ' 🎨' : '';
      console.log(`  ${c.isPublished ? '🟢' : '⚫'} ${c.slug}${emoji}`);
      console.log(`     "${c.title}" · L:${totalLessons} R:${totalResources} · ${c.modules.length} mod`);
    }
  }
  console.log(`\n→ Total pares/grupos de duplicados: ${pairs}`);

  await prisma.$disconnect();
})();
