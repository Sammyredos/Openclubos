const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const count = await prisma.registration.count({ where: { status: { in: ['WAITLISTED', 'REJECTED'] } } });
  console.log('Waitlist/Rejected Count:', count);
}
main().finally(() => prisma.$disconnect());
