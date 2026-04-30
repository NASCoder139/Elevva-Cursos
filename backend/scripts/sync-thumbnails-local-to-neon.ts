/**
 * Copia las thumbnailUrl de los cursos de la DB LOCAL a Neon (producción).
 * Útil después de migrar de local→Neon, cuando las imágenes se cargaron localmente
 * pero falta sincronizarlas con producción.
 *
 * Uso:
 *   npx ts-node scripts/sync-thumbnails-local-to-neon.ts          # dry-run por default
 *   npx ts-node scripts/sync-thumbnails-local-to-neon.ts --commit # escribe en Neon
 */
import { PrismaClient } from '@prisma/client';

const LOCAL_URL = 'postgresql://miaccess:miaccess123@localhost:5432/miaccess?schema=public';
const NEON_URL = 'postgresql://neondb_owner:npg_7MPsQl1hkgfO@ep-noisy-shape-an580eey-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

async function main() {
  const commit = process.argv.includes('--commit');
  console.log('🖼  Sincronizando thumbnails: local → Neon');
  console.log('   Modo:', commit ? 'COMMIT' : 'DRY-RUN (usá --commit para escribir)');
  console.log('');

  const localPrisma = new PrismaClient({ datasources: { db: { url: LOCAL_URL } } });
  const neonPrisma = new PrismaClient({ datasources: { db: { url: NEON_URL } } });

  try {
    const localCourses = await localPrisma.course.findMany({
      where: { thumbnailUrl: { not: null } },
      select: { slug: true, thumbnailUrl: true },
    });
    console.log(`   Cursos en local con thumbnail: ${localCourses.length}`);

    const neonCourses = await neonPrisma.course.findMany({
      select: { slug: true, thumbnailUrl: true },
    });
    console.log(`   Cursos en Neon (total): ${neonCourses.length}`);

    const neonBySlug = new Map(neonCourses.map((c) => [c.slug, c.thumbnailUrl]));

    let toUpdate = 0;
    let alreadySet = 0;
    let notInNeon = 0;
    const updates: { slug: string; thumbnailUrl: string }[] = [];

    for (const local of localCourses) {
      if (!local.thumbnailUrl) continue;
      const neon = neonBySlug.get(local.slug);
      if (neon === undefined) {
        notInNeon++;
        continue;
      }
      if (neon === local.thumbnailUrl) {
        alreadySet++;
        continue;
      }
      toUpdate++;
      updates.push({ slug: local.slug, thumbnailUrl: local.thumbnailUrl });
    }

    console.log('');
    console.log(`   📊 A actualizar: ${toUpdate}`);
    console.log(`   ✓  Ya iguales:  ${alreadySet}`);
    console.log(`   ⏭  No en Neon (faltan importar): ${notInNeon}`);
    console.log('');

    if (toUpdate === 0) {
      console.log('No hay nada que actualizar.');
      return;
    }

    if (!commit) {
      console.log('Cursos que se actualizarían (primeros 10):');
      updates.slice(0, 10).forEach((u, i) => console.log(`   ${i + 1}. ${u.slug} → ${u.thumbnailUrl.substring(0, 60)}...`));
      if (updates.length > 10) console.log(`   ... y ${updates.length - 10} más`);
      console.log('\nUsá --commit para aplicar.');
      return;
    }

    console.log('🚀 Aplicando cambios en Neon...');
    let success = 0;
    let failed = 0;
    for (const u of updates) {
      try {
        await neonPrisma.course.update({
          where: { slug: u.slug },
          data: { thumbnailUrl: u.thumbnailUrl },
        });
        success++;
      } catch (err: any) {
        console.log(`   ❌ ${u.slug}: ${err.message}`);
        failed++;
      }
    }
    console.log(`\n✅ Actualizados: ${success}`);
    if (failed > 0) console.log(`❌ Fallidos:    ${failed}`);
  } finally {
    await localPrisma.$disconnect();
    await neonPrisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('💥', err);
  process.exit(1);
});
