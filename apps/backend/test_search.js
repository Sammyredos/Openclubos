const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { firstName: true, lastName: true, email: true } });
  console.log("All users:", users);
}

main();
