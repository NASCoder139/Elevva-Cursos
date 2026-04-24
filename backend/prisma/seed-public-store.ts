import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type StoreCourse = {
  slug: string;
  title: string;
  shortDesc: string;
  thumbnailUrl: string;
  price: number;
  isFeatured?: boolean;
};

type StoreCategory = {
  name: string;
  slug: string;
  description: string;
  price: number;
  sortOrder: number;
  courses: StoreCourse[];
};

const CATEGORIES: StoreCategory[] = [
  {
    name: 'Desarrollo Web',
    slug: 'desarrollo-web',
    description:
      'Aprende a crear sitios y aplicaciones web con las tecnologías más demandadas del mercado.',
    price: 4999.99,
    sortOrder: 100,
    courses: [
      {
        slug: 'store-react-desde-cero',
        title: 'React desde Cero',
        shortDesc: 'Construye interfaces modernas con React y TypeScript.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
        price: 890,
        isFeatured: true,
      },
      {
        slug: 'store-nodejs-nestjs-api',
        title: 'APIs con NestJS y Node.js',
        shortDesc: 'Desarrolla APIs REST robustas con NestJS y Prisma.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
        price: 990,
      },
      {
        slug: 'store-fullstack-next',
        title: 'Full Stack con Next.js 15',
        shortDesc: 'App Router, Server Components y autenticación.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800',
        price: 1190,
      },
    ],
  },
  {
    name: 'Diseño Gráfico',
    slug: 'diseno-grafico',
    description:
      'Domina las herramientas de diseño y crea piezas visuales impactantes.',
    price: 3999.99,
    sortOrder: 101,
    courses: [
      {
        slug: 'store-figma-ui-ux',
        title: 'Figma UI/UX Profesional',
        shortDesc: 'Diseña interfaces modernas con prototipado avanzado.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1561070791-2526d30994b8?w=800',
        price: 790,
        isFeatured: true,
      },
      {
        slug: 'store-photoshop-pro',
        title: 'Photoshop Profesional',
        shortDesc: 'Retoque fotográfico, composición y efectos avanzados.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800',
        price: 690,
      },
    ],
  },
  {
    name: 'Marketing Digital',
    slug: 'marketing-digital',
    description:
      'Estrategias y técnicas para posicionar marcas y generar resultados online.',
    price: 3499.99,
    sortOrder: 102,
    courses: [
      {
        slug: 'store-marketing-360',
        title: 'Marketing Digital 360°',
        shortDesc: 'SEO, SEM, redes sociales y email marketing desde cero.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
        price: 890,
        isFeatured: true,
      },
      {
        slug: 'store-seo-pro',
        title: 'SEO Profesional',
        shortDesc: 'Posiciona tu sitio en los primeros resultados de Google.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?w=800',
        price: 790,
      },
    ],
  },
  {
    name: 'Emprendimiento',
    slug: 'emprendimiento',
    description:
      'Todo lo que necesitas para lanzar, gestionar y escalar tu negocio.',
    price: 2999.99,
    sortOrder: 103,
    courses: [
      {
        slug: 'store-startup-mvp',
        title: 'Lanza tu MVP en 30 Días',
        shortDesc: 'Valida tu idea y lanza tu producto mínimo viable.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800',
        price: 690,
      },
      {
        slug: 'store-business-scaling',
        title: 'Escalá tu Negocio Digital',
        shortDesc: 'Estrategias probadas para multiplicar tus ingresos.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800',
        price: 990,
      },
    ],
  },
  {
    name: 'Fotografía',
    slug: 'fotografia',
    description:
      'Técnicas de fotografía digital, edición profesional y composición visual.',
    price: 2999.99,
    sortOrder: 104,
    courses: [
      {
        slug: 'store-fotografia-retrato',
        title: 'Fotografía de Retrato',
        shortDesc: 'Iluminación, pose y edición para retratos impactantes.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1554080353-a576cf803bda?w=800',
        price: 590,
      },
      {
        slug: 'store-lightroom-pro',
        title: 'Lightroom Pro',
        shortDesc: 'Flujos de trabajo y edición masiva de fotos.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800',
        price: 490,
      },
    ],
  },
  {
    name: 'Finanzas Personales',
    slug: 'finanzas-personales',
    description:
      'Controla tus finanzas, aprende a invertir y construye tu libertad financiera.',
    price: 1999.99,
    sortOrder: 105,
    courses: [
      {
        slug: 'store-finanzas-basicas',
        title: 'Finanzas Personales desde Cero',
        shortDesc: 'Presupuesto, ahorro e inversión para principiantes.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800',
        price: 390,
      },
      {
        slug: 'store-inversion-bolsa',
        title: 'Inversión en Bolsa',
        shortDesc: 'Estrategias para invertir en acciones con seguridad.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800',
        price: 590,
      },
    ],
  },
  {
    name: 'Idiomas',
    slug: 'idiomas',
    description:
      'Cursos de idiomas con metodologías modernas para aprender rápido y efectivo.',
    price: 2499.99,
    sortOrder: 106,
    courses: [
      {
        slug: 'store-ingles-conversacional',
        title: 'Inglés Conversacional',
        shortDesc: 'Habla con fluidez en situaciones reales.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
        price: 590,
      },
      {
        slug: 'store-ielts-preparation',
        title: 'IELTS Preparation',
        shortDesc: 'Preparación completa para el examen IELTS.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?w=800',
        price: 890,
      },
    ],
  },
  {
    name: 'Música y Audio',
    slug: 'musica-y-audio',
    description:
      'Producción musical, mezcla, masterización y teoría musical desde cero.',
    price: 2999.99,
    sortOrder: 107,
    courses: [
      {
        slug: 'store-produccion-musical',
        title: 'Producción Musical con Ableton',
        shortDesc: 'Crea, mezcla y masteriza tus propios temas.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800',
        price: 690,
      },
      {
        slug: 'store-mezcla-masterizacion',
        title: 'Mezcla y Masterización Pro',
        shortDesc: 'Técnicas profesionales de audio para obtener sonido de estudio.',
        thumbnailUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800',
        price: 790,
      },
    ],
  },
];

async function main() {
  console.log('🏪 Seed de tienda pública (categorías con precio)...\n');

  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        price: cat.price,
        sortOrder: cat.sortOrder,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        price: cat.price,
        sortOrder: cat.sortOrder,
      },
    });

    console.log(`  📁 ${cat.name}`);

    for (const c of cat.courses) {
      const course = await prisma.course.upsert({
        where: { slug: c.slug },
        update: {
          title: c.title,
          shortDesc: c.shortDesc,
          thumbnailUrl: c.thumbnailUrl,
          price: c.price,
          isPublished: true,
          isFeatured: c.isFeatured ?? false,
          categoryId: category.id,
        },
        create: {
          title: c.title,
          slug: c.slug,
          description: c.shortDesc,
          shortDesc: c.shortDesc,
          thumbnailUrl: c.thumbnailUrl,
          price: c.price,
          durationMins: 240,
          isPublished: true,
          isFeatured: c.isFeatured ?? false,
          categoryId: category.id,
        },
      });

      const existingModules = await prisma.module.count({ where: { courseId: course.id } });
      if (existingModules === 0) {
        const mod = await prisma.module.create({
          data: {
            title: 'Introducción',
            sortOrder: 1,
            courseId: course.id,
          },
        });
        await prisma.lesson.create({
          data: {
            title: 'Bienvenida al curso',
            description: 'Presentación general del curso.',
            durationSeconds: 300,
            sortOrder: 1,
            isFreePreview: true,
            driveFileId: 'demo-file-id',
            moduleId: mod.id,
          },
        });
      }
    }
  }

  // Limpiar precios accidentales en categorías del dashboard
  await prisma.category.updateMany({
    where: {
      slug: { in: ['inteligencia-artificial', 'edicion-de-video'] },
    },
    data: { price: null },
  });

  const total = await prisma.course.count({ where: { isPublished: true } });
  console.log(`\n✅ Tienda lista. Cursos publicados totales: ${total}`);
}

main().finally(() => prisma.$disconnect());
