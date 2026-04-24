import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const dryRun = !process.argv.includes('--confirm');

  const result = await prisma.$queryRawUnsafe<any[]>(`
    SELECT c.id, c.name, c.slug, COUNT(co.id)::int as course_count
    FROM "categories" c
    LEFT JOIN "courses" co ON co."categoryId" = c.id
    GROUP BY c.id, c.name, c.slug
    ORDER BY course_count ASC, c.name ASC
  `);

  const vacias = result.filter((c) => c.course_count === 0);
  const conCursos = result.filter((c) => c.course_count > 0);

  console.log(`\n📊 Categorías totales: ${result.length}`);
  console.log(`   Con cursos:  ${conCursos.length}`);
  console.log(`   Vacías:      ${vacias.length}\n`);

  if (vacias.length > 0) {
    console.log(`🗑  Categorías vacías:`);
    vacias.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name}  (slug: ${c.slug})`);
    });
  }

  console.log(`\n📚 Categorías con cursos:`);
  conCursos.forEach((c) => {
    console.log(`   - ${c.name}: ${c.course_count} cursos`);
  });

  if (vacias.length > 0 && !dryRun) {
    const ids = vacias.map((c) => c.id);
    const deleted = await prisma.category.deleteMany({
      where: { id: { in: ids } },
    });
    console.log(`\n✅ Categorías vacías borradas: ${deleted.count}`);
  } else if (vacias.length > 0 && dryRun) {
    console.log(`\n⚠️  Modo DRY-RUN. Para borrar las vacías ejecutá:`);
    console.log(`   npx ts-node scripts/check-empty-categories.ts --confirm`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
