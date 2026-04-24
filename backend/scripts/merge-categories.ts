import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Pares [mantener, borrar]. Siempre se conserva "Categoría A" (primer elemento).
// Los cursos de la(s) categoría(s) siguiente(s) se mueven a la primera.
const MERGES: Array<{ keep: string; removes: string[] }> = [
  { keep: 'Ecommers - Dropshipping',                 removes: ['Ecommerce - Dropshipping'] },
  { keep: 'Youtube y Monetización',                  removes: ['YouTube y Monetización'] },
  { keep: 'Marketing de Lanzamiento',                removes: ['Marketing de Lanzamientos'] },
  { keep: 'Cursos de Inglés',                        removes: ['Inglés'] },
  { keep: 'ADS - Anuncios - Facebook Google TikTok', removes: ['ADS - Anuncios Meta/Google/TikTok'] },
  { keep: 'Agencias',                                removes: ['Agencias - Growth Partner', 'Growth Partner'] },
  { keep: 'Mentores Virales',                        removes: ['Mentoría y Viralidad'] },
  { keep: 'Mentalidad',                              removes: ['Varios - Mentalidad - Finanzas'] },
  { keep: 'Páginas Web - WordPress',                 removes: ['Sitios Web y WordPress'] },
];

async function main() {
  const dryRun = !process.argv.includes('--confirm');

  console.log(`\n${dryRun ? '🔍 DRY-RUN' : '🚀 EJECUCIÓN REAL'}\n`);

  for (const { keep, removes } of MERGES) {
    const keepCat = await prisma.category.findUnique({ where: { name: keep } });
    if (!keepCat) {
      console.log(`⚠️  NO existe categoría a mantener: "${keep}" — skip`);
      continue;
    }

    console.log(`\n📂 Mantener: "${keep}"`);

    for (const removeName of removes) {
      const rmCat = await prisma.category.findUnique({ where: { name: removeName } });
      if (!rmCat) {
        console.log(`   ℹ️  No existe: "${removeName}"`);
        continue;
      }

      const courseCount = await prisma.course.count({ where: { categoryId: rmCat.id } });
      const purchaseCount = await prisma.purchase.count({ where: { categoryId: rmCat.id } });

      console.log(`   ↳ Borrar "${removeName}" → mover ${courseCount} cursos y ${purchaseCount} compras`);

      if (!dryRun) {
        await prisma.$transaction([
          prisma.course.updateMany({
            where: { categoryId: rmCat.id },
            data: { categoryId: keepCat.id },
          }),
          prisma.purchase.updateMany({
            where: { categoryId: rmCat.id },
            data: { categoryId: keepCat.id },
          }),
          prisma.category.delete({ where: { id: rmCat.id } }),
        ]);
        console.log(`      ✅ Merged`);
      }
    }
  }

  const total = await prisma.category.count();
  console.log(`\n📊 Categorías restantes: ${total}`);

  if (dryRun) {
    console.log(`\nPara ejecutar de verdad:`);
    console.log(`   npx ts-node scripts/merge-categories.ts --confirm`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
