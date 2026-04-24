import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
(async () => {
  const admins = await prisma.user.findMany({
    where: { role: { not: 'USER' as any } },
    select: { id: true, email: true, role: true, firstName: true, lastName: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Usuarios con rol elevado: ${admins.length}\n`);
  for (const a of admins) {
    console.log(`${a.role.padEnd(12)} ${a.email}  (${a.firstName || ''} ${a.lastName || ''})`);
  }
  await prisma.$disconnect();
})();
