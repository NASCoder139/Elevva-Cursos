import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type SeedCourse = {
  title: string;
  thumb: string;
  price: number | null;
  featured?: boolean;
};

type SeedCategory = {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  courses: SeedCourse[];
};

const slugify = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

// ─── 16 categorías solicitadas ──────────────────────────────────────────────
const CATEGORIES: SeedCategory[] = [
  {
    name: 'ADS - Anuncios Meta/Google/TikTok',
    slug: 'ads-anuncios',
    description: 'Campañas publicitarias en Meta Ads, Google Ads y TikTok Ads.',
    sortOrder: 1,
    courses: [
      { title: 'TikTok Ads - Juan Lombana', thumb: 'https://images.unsplash.com/photo-1611605698335-8b1569810432?w=800', price: 950, featured: true },
      { title: 'Fórmula de Ventas Ilimitadas - Julián Otálora', thumb: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', price: 1200 },
      { title: 'Google Ads eCommerce 2025 - Alan Valdez', thumb: 'https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?w=800', price: 890 },
      { title: 'Google Ads Factory - Alan Valdez', thumb: 'https://images.unsplash.com/photo-1533750516457-a7f992034fec?w=800', price: 950 },
      { title: 'Instagram y Facebook ADS - Felipe Vergara', thumb: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800', price: 790 },
      { title: 'M5-95 - Juan ADS', thumb: 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800', price: 1100 },
      { title: 'Metodología JADS - Juan ADS', thumb: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800', price: 950 },
      { title: 'Protocolo IA - Julián Otálora', thumb: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', price: 1200 },
      { title: 'TikTok Mastery - Jhon Hurtado', thumb: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800', price: 890 },
    ],
  },
  {
    name: 'Ecommerce - Dropshipping',
    slug: 'ecommerce-dropshipping',
    description: 'Cursos para crear tiendas online y modelos de dropshipping.',
    sortOrder: 2,
    courses: [
      { title: 'Master Escala 100k - Ivan Caicedo', thumb: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800', price: 1500, featured: true },
      { title: 'Academia Amazon FBA - Paco Gonzales', thumb: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800', price: 1200 },
      { title: 'Carrera de Ecommerce - Mauro Stendel', thumb: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800', price: 990 },
      { title: 'Organic Ecom - Marc Verdú', thumb: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800', price: 890 },
      { title: 'Organic Ecom 2.0 - Marc Verdú', thumb: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=800', price: 1100 },
      { title: 'Ecommerce Master - Hermo', thumb: 'https://images.unsplash.com/photo-1522204523234-8729aa6e3d5f?w=800', price: 990 },
      { title: 'Ecommerce 0-17 millones - Andrei Mincov', thumb: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=800', price: 1500 },
      { title: 'Vender en Mercado Libre - Smart', thumb: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=800', price: 650 },
    ],
  },
  {
    name: 'Agencias - Growth Partner',
    slug: 'agencias-growth-partner',
    description: 'Cómo armar y escalar tu propia agencia digital.',
    sortOrder: 3,
    courses: [
      { title: 'Agencia Digital Pro - Manuel Suárez', thumb: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800', price: 1800 },
      { title: 'Growth Partner Method', thumb: 'https://images.unsplash.com/photo-1553877522-43269d4ea984?w=800', price: 1500, featured: true },
      { title: 'Escala tu Agencia 10X', thumb: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800', price: 1200 },
      { title: 'Clientes a Demanda para Agencias', thumb: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800', price: 990 },
    ],
  },
  {
    name: 'Marketing de Afiliados - Productos Digitales',
    slug: 'marketing-afiliados',
    description: 'Genera ingresos vendiendo productos digitales como afiliado.',
    sortOrder: 4,
    courses: [
      { title: 'Hotmart Master - Pat Flynn', thumb: 'https://images.unsplash.com/photo-1579621970588-a35d0e7ab9b6?w=800', price: 790 },
      { title: 'Afiliados Pro 2026', thumb: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800', price: 890, featured: true },
      { title: 'ClickBank Profits', thumb: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800', price: 590 },
      { title: 'Vendes Infoproductos sin Crear', thumb: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800', price: 690 },
    ],
  },
  {
    name: 'Marketing de Lanzamientos',
    slug: 'marketing-lanzamientos',
    description: 'Estrategias de lanzamiento tipo Product Launch Formula.',
    sortOrder: 5,
    courses: [
      { title: 'Fórmula de Lanzamiento - Jeff Walker', thumb: 'https://images.unsplash.com/photo-1542621334-a254cf47733d?w=800', price: 1500, featured: true },
      { title: 'Lanza tu Curso Online', thumb: 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800', price: 990 },
      { title: 'Webinars de Alta Conversión', thumb: 'https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=800', price: 790 },
      { title: 'Estrategia Evergreen', thumb: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800', price: 890 },
    ],
  },
  {
    name: 'Marca Personal - Redes Sociales',
    slug: 'marca-personal',
    description: 'Construye tu marca personal en redes sociales.',
    sortOrder: 6,
    courses: [
      { title: 'Marca Personal 360 - Vilma Núñez', thumb: 'https://images.unsplash.com/photo-1535223289827-42f1e9919769?w=800', price: 890, featured: true },
      { title: 'Instagram Growth Hacks', thumb: 'https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800', price: 590 },
      { title: 'LinkedIn para Profesionales', thumb: 'https://images.unsplash.com/photo-1611944212129-29977ae1398c?w=800', price: 490 },
      { title: 'Contenido que Vende', thumb: 'https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800', price: 690 },
    ],
  },
  {
    name: 'Mentores Virales',
    slug: 'mentores-virales',
    description: 'Aprende de mentores que se han hecho virales.',
    sortOrder: 7,
    courses: [
      { title: 'Sé Viral en 30 Días', thumb: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800', price: 690 },
      { title: 'Fórmula Viral - Caso Real', thumb: 'https://images.unsplash.com/photo-1557838923-2985c318be48?w=800', price: 790, featured: true },
      { title: 'Reels que Explotan', thumb: 'https://images.unsplash.com/photo-1611162618071-b39a2ec055fb?w=800', price: 490 },
    ],
  },
  {
    name: 'Ventas - WhatsApp',
    slug: 'ventas-whatsapp',
    description: 'Técnicas de cierre de ventas por WhatsApp.',
    sortOrder: 8,
    courses: [
      { title: 'WhatsApp Business Master', thumb: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?w=800', price: 590, featured: true },
      { title: 'Cierre de Ventas al 80%', thumb: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=800', price: 790 },
      { title: 'Automatización WhatsApp', thumb: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?w=800', price: 690 },
    ],
  },
  {
    name: 'Inteligencia Artificial',
    slug: 'inteligencia-artificial',
    description: 'Domina las herramientas de IA del momento.',
    sortOrder: 9,
    courses: [
      { title: 'ChatGPT para Negocios', thumb: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800', price: 690, featured: true },
      { title: 'Prompt Engineering Pro', thumb: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800', price: 890 },
      { title: 'Midjourney Mastery', thumb: 'https://images.unsplash.com/photo-1673187456281-6c99d8a1a3ad?w=800', price: 590 },
      { title: 'Automatiza con IA - n8n + Make', thumb: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', price: 990 },
    ],
  },
  {
    name: 'YouTube y Monetización',
    slug: 'youtube-monetizacion',
    description: 'Crece y monetiza tu canal de YouTube.',
    sortOrder: 10,
    courses: [
      { title: 'YouTube desde Cero a 100K', thumb: 'https://images.unsplash.com/photo-1611162617213-7d7a39e9b1d7?w=800', price: 890, featured: true },
      { title: 'Algoritmo YouTube 2026', thumb: 'https://images.unsplash.com/photo-1579019163248-e7761241d85a?w=800', price: 690 },
      { title: 'Monetización Avanzada', thumb: 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800', price: 790 },
    ],
  },
  {
    name: 'Páginas Web - WordPress',
    slug: 'paginas-web-wordpress',
    description: 'Crea sitios web profesionales con WordPress y Elementor.',
    sortOrder: 11,
    courses: [
      { title: 'WordPress Pro 2026', thumb: 'https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800', price: 590, featured: true },
      { title: 'Elementor Master', thumb: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800', price: 490 },
      { title: 'Landing Pages que Convierten', thumb: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800', price: 690 },
      { title: 'WooCommerce desde Cero', thumb: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800', price: 790 },
    ],
  },
  {
    name: 'Edición de Video y Recursos',
    slug: 'edicion-de-video',
    description: 'Premiere, CapCut, DaVinci Resolve y After Effects.',
    sortOrder: 12,
    courses: [
      { title: 'Premiere Pro Completo', thumb: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800', price: 790 },
      { title: 'CapCut para Creadores', thumb: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=800', price: 390, featured: true },
      { title: 'DaVinci Resolve Avanzado', thumb: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800', price: 890 },
      { title: 'After Effects Motion', thumb: 'https://images.unsplash.com/photo-1626785774625-ddcddc3445e9?w=800', price: 990 },
    ],
  },
  {
    name: 'Varios - Mentalidad - Finanzas',
    slug: 'varios-mentalidad-finanzas',
    description: 'Mentalidad de éxito, productividad y finanzas personales.',
    sortOrder: 13,
    courses: [
      { title: 'Mindset Millonario', thumb: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', price: 590, featured: true },
      { title: 'Inversión Inteligente', thumb: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800', price: 690 },
      { title: 'Productividad Extrema', thumb: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800', price: 390 },
    ],
  },
  {
    name: 'Trading',
    slug: 'trading',
    description: 'Trading profesional en forex, acciones y más.',
    sortOrder: 14,
    courses: [
      { title: 'Trading desde Cero', thumb: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800', price: 990, featured: true },
      { title: 'Smart Money Concepts', thumb: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=800', price: 1200 },
      { title: 'Price Action Avanzado', thumb: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800', price: 890 },
      { title: 'Trading Algorítmico', thumb: 'https://images.unsplash.com/photo-1614028674026-a65e31bfd27c?w=800', price: 1500 },
    ],
  },
  {
    name: 'Crypto',
    slug: 'crypto',
    description: 'Mundo cripto: Bitcoin, DeFi, NFTs y más.',
    sortOrder: 15,
    courses: [
      { title: 'Bitcoin y Blockchain', thumb: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800', price: 790, featured: true },
      { title: 'DeFi Master Course', thumb: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800', price: 990 },
      { title: 'NFT Creator Pro', thumb: 'https://images.unsplash.com/photo-1644361566696-3d442b5b482a?w=800', price: 890 },
    ],
  },
  {
    name: 'Cursos de Inglés',
    slug: 'cursos-ingles',
    description: 'Aprende inglés desde básico hasta avanzado.',
    sortOrder: 16,
    courses: [
      { title: 'Inglés para Principiantes', thumb: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=800', price: 490 },
      { title: 'Business English', thumb: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800', price: 790, featured: true },
      { title: 'Inglés Conversacional', thumb: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800', price: 590 },
      { title: 'IELTS Preparation', thumb: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800', price: 890 },
    ],
  },
];

async function main() {
  console.log('🌱 Seed demo del catálogo...');

  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {
        name: cat.name,
        description: cat.description,
        sortOrder: cat.sortOrder,
      },
      create: {
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
      },
    });

    console.log(`  📁 ${cat.name}`);

    for (const c of cat.courses) {
      const courseSlug = `demo-${slugify(c.title)}`;

      const course = await prisma.course.upsert({
        where: { slug: courseSlug },
        update: {
          title: c.title,
          thumbnailUrl: c.thumb,
          price: c.price ?? undefined,
          isFeatured: c.featured || false,
          isPublished: true,
          categoryId: category.id,
        },
        create: {
          title: c.title,
          slug: courseSlug,
          description: `${c.title} — curso de demostración para visualizar el catálogo.`,
          shortDesc: 'Curso de demostración.',
          thumbnailUrl: c.thumb,
          price: c.price ?? undefined,
          isFeatured: c.featured || false,
          isPublished: true,
          categoryId: category.id,
          lessonCount: 12,
          durationMins: 180,
        },
      });

      // Asegura al menos un módulo con una lección (para que se vea "completo")
      const hasModules = await prisma.module.count({ where: { courseId: course.id } });
      if (hasModules === 0) {
        const mod = await prisma.module.create({
          data: { title: 'Introducción', sortOrder: 0, courseId: course.id },
        });
        await prisma.lesson.create({
          data: {
            title: 'Bienvenida',
            durationSeconds: 600,
            sortOrder: 0,
            driveFileId: 'placeholder-drive-file-id',
            isFreePreview: true,
            moduleId: mod.id,
          },
        });
      }
    }
  }

  const total = await prisma.course.count({ where: { isPublished: true } });
  console.log(`\n✅ Listo. Cursos publicados totales: ${total}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
