import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ─── Admin User ──────────────────────────────────────────────────────────────

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@miaccess.com' },
    update: {},
    create: {
      email: 'admin@miaccess.com',
      passwordHash,
      firstName: 'Admin',
      lastName: 'MiAccess',
      role: 'ADMIN',
      isEmailVerified: true,
    },
  });

  console.log(`Admin user created: ${admin.email}`);

  // ─── Interests ───────────────────────────────────────────────────────────────

  const interestNames = [
    'Programación',
    'Diseño',
    'Marketing',
    'Negocios',
    'Fotografía',
    'Idiomas',
    'Música',
    'Cocina',
  ];

  const slugify = (text: string): string =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  for (const name of interestNames) {
    await prisma.interest.upsert({
      where: { slug: slugify(name) },
      update: {},
      create: {
        name,
        slug: slugify(name),
      },
    });
  }

  console.log(`Interests created: ${interestNames.length}`);

  // ─── Categories ──────────────────────────────────────────────────────────────

  const categories = [
    {
      name: 'Desarrollo Web',
      slug: 'desarrollo-web',
      description:
        'Aprende a crear sitios y aplicaciones web con las tecnologías más demandadas del mercado.',
      price: 4999.99,
    },
    {
      name: 'Diseño Gráfico',
      slug: 'diseno-grafico',
      description:
        'Domina las herramientas de diseño y crea piezas visuales impactantes para cualquier proyecto.',
      price: 3999.99,
    },
    {
      name: 'Marketing Digital',
      slug: 'marketing-digital',
      description:
        'Estrategias y técnicas para posicionar marcas y generar resultados en el mundo digital.',
      price: 3499.99,
    },
    {
      name: 'Emprendimiento',
      slug: 'emprendimiento',
      description:
        'Todo lo que necesitas saber para lanzar, gestionar y escalar tu propio negocio.',
      price: 2999.99,
    },
    {
      name: 'Inteligencia Artificial',
      slug: 'inteligencia-artificial',
      description:
        'Descubre el mundo de la IA, machine learning y deep learning con proyectos prácticos.',
      price: 5499.99,
    },
    {
      name: 'Fotografía',
      slug: 'fotografia',
      description:
        'Técnicas de fotografía digital, edición profesional y composición visual.',
      price: 2999.99,
    },
    {
      name: 'Edición de Video',
      slug: 'edicion-de-video',
      description:
        'Aprende a editar videos profesionales con las herramientas más utilizadas de la industria.',
      price: 3499.99,
    },
    {
      name: 'Finanzas Personales',
      slug: 'finanzas-personales',
      description:
        'Controla tus finanzas, aprende a invertir y construye tu libertad financiera.',
      price: 1999.99,
    },
    {
      name: 'Idiomas',
      slug: 'idiomas',
      description:
        'Cursos de idiomas con metodologías modernas para aprender rápido y efectivo.',
      price: 2499.99,
    },
    {
      name: 'Música y Audio',
      slug: 'musica-y-audio',
      description:
        'Producción musical, mezcla, masterización y teoría musical desde cero.',
      price: 2999.99,
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        price: cat.price,
      },
    });
  }

  console.log(`Categories created: ${categories.length}`);

  // ─── Sample Courses ──────────────────────────────────────────────────────────

  const webCat = await prisma.category.findUnique({ where: { slug: 'desarrollo-web' } });
  const designCat = await prisma.category.findUnique({ where: { slug: 'diseno-grafico' } });
  const mktCat = await prisma.category.findUnique({ where: { slug: 'marketing-digital' } });

  type SeedCourse = {
    title: string;
    slug: string;
    description: string;
    shortDesc: string;
    price: number | null;
    isFeatured: boolean;
    categoryId: string;
    thumbnailUrl: string;
    modules: { title: string; lessons: { title: string; durationSeconds: number; isFreePreview?: boolean }[] }[];
  };

  const sampleCourses: SeedCourse[] = [
    {
      title: 'React desde Cero a Profesional',
      slug: 'react-desde-cero',
      description:
        'Domina React 19 construyendo aplicaciones reales. Hooks, Context, routing, performance y más.',
      shortDesc: 'Aprende React con proyectos prácticos y buenas prácticas del 2026.',
      price: 950,
      isFeatured: true,
      categoryId: webCat!.id,
      thumbnailUrl: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800',
      modules: [
        {
          title: 'Fundamentos de React',
          lessons: [
            { title: 'Introducción y setup', durationSeconds: 720, isFreePreview: true },
            { title: 'JSX y componentes', durationSeconds: 900 },
            { title: 'Props y estado', durationSeconds: 1080 },
          ],
        },
        {
          title: 'Hooks avanzados',
          lessons: [
            { title: 'useEffect a fondo', durationSeconds: 1200 },
            { title: 'useMemo y useCallback', durationSeconds: 960 },
            { title: 'Custom hooks', durationSeconds: 840 },
          ],
        },
      ],
    },
    {
      title: 'Node.js + NestJS: API REST Moderna',
      slug: 'nodejs-nestjs-api',
      description:
        'Construye APIs robustas con NestJS, Prisma, PostgreSQL, autenticación JWT y despliegue.',
      shortDesc: 'El stack backend más demandado para crear APIs escalables.',
      price: 950,
      isFeatured: true,
      categoryId: webCat!.id,
      thumbnailUrl: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800',
      modules: [
        {
          title: 'Arquitectura NestJS',
          lessons: [
            { title: 'Módulos, controllers y providers', durationSeconds: 900, isFreePreview: true },
            { title: 'Dependency injection', durationSeconds: 720 },
          ],
        },
        {
          title: 'Persistencia con Prisma',
          lessons: [
            { title: 'Schema y migraciones', durationSeconds: 1080 },
            { title: 'Relaciones y queries', durationSeconds: 960 },
          ],
        },
      ],
    },
    {
      title: 'Figma para Diseñadores UI/UX',
      slug: 'figma-ui-ux',
      description:
        'Aprende a diseñar interfaces modernas, prototipos interactivos y design systems en Figma.',
      shortDesc: 'De cero a diseñador profesional con la herramienta líder del mercado.',
      price: 950,
      isFeatured: false,
      categoryId: designCat!.id,
      thumbnailUrl: 'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800',
      modules: [
        {
          title: 'Primeros pasos',
          lessons: [
            { title: 'Interfaz de Figma', durationSeconds: 600, isFreePreview: true },
            { title: 'Frames, layers y constraints', durationSeconds: 840 },
          ],
        },
      ],
    },
    {
      title: 'Marketing Digital 360°',
      slug: 'marketing-digital-360',
      description:
        'SEO, SEM, redes sociales, email marketing y analítica. Todo lo que necesitás para crecer online.',
      shortDesc: 'Estrategia integral para marcas que quieren resultados reales.',
      price: null,
      isFeatured: true,
      categoryId: mktCat!.id,
      thumbnailUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      modules: [
        {
          title: 'Fundamentos',
          lessons: [
            { title: 'El embudo de conversión', durationSeconds: 720, isFreePreview: true },
            { title: 'Buyer personas', durationSeconds: 600 },
          ],
        },
      ],
    },
  ];

  for (const c of sampleCourses) {
    const totalLessons = c.modules.reduce((acc, m) => acc + m.lessons.length, 0);
    const totalSeconds = c.modules.reduce(
      (acc, m) => acc + m.lessons.reduce((a, l) => a + l.durationSeconds, 0),
      0,
    );
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: {},
      create: {
        title: c.title,
        slug: c.slug,
        description: c.description,
        shortDesc: c.shortDesc,
        thumbnailUrl: c.thumbnailUrl,
        price: c.price ?? undefined,
        isFeatured: c.isFeatured,
        isPublished: true,
        categoryId: c.categoryId,
        lessonCount: totalLessons,
        durationMins: Math.round(totalSeconds / 60),
      },
    });

    const existingModules = await prisma.module.count({ where: { courseId: course.id } });
    if (existingModules === 0) {
      for (let mi = 0; mi < c.modules.length; mi++) {
        const m = c.modules[mi];
        const mod = await prisma.module.create({
          data: { title: m.title, sortOrder: mi, courseId: course.id },
        });
        for (let li = 0; li < m.lessons.length; li++) {
          const l = m.lessons[li];
          await prisma.lesson.create({
            data: {
              title: l.title,
              durationSeconds: l.durationSeconds,
              sortOrder: li,
              driveFileId: 'placeholder-drive-file-id',
              isFreePreview: l.isFreePreview || false,
              moduleId: mod.id,
            },
          });
        }
      }
    }
  }

  console.log(`Sample courses created: ${sampleCourses.length}`);

  // ─── Subscription Plans ──────────────────────────────────────────────────────

  const plans = [
    {
      key: 'SUBSCRIPTION_MONTHLY' as const,
      label: 'Mensual',
      price: 12,
      currency: 'USD',
      badge: 'Flexible',
      savings: null,
      features: [
        'Acceso completo a todos los cursos',
        'Nuevos cursos cada mes',
        'Soporte por email',
        'Cancelás cuando quieras',
      ],
      sortOrder: 0,
    },
    {
      key: 'SUBSCRIPTION_ANNUAL' as const,
      label: 'Anual',
      price: 120,
      currency: 'USD',
      badge: 'Ahorrás 2 meses',
      savings: '17%',
      features: [
        'Todo lo del plan mensual',
        'Equivalente a 2 meses gratis',
        'Acceso prioritario a webinars',
        'Mejor relación calidad / precio',
      ],
      sortOrder: 1,
    },
  ];

  for (const p of plans) {
    await prisma.plan.upsert({
      where: { key: p.key },
      update: {},
      create: p,
    });
  }

  console.log(`Plans created: ${plans.length}`);

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
