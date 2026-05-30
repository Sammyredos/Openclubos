const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: { db: { url: 'postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public' } }
});
prisma.user.findFirst({ where: { email: 'admin@oakwoodly.com' } }).then(u => {
  console.log('User found:', u);
}).finally(() => {
  prisma.$disconnect();
});
