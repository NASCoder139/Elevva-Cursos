import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.resource.count().then(n => {
  console.log('resources count:', n);
  p.$disconnect();
});
