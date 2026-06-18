const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({
    where: {
      AND: [
        { OR: [ { firstName: { contains: 'John', mode: 'insensitive' } }, { lastName: { contains: 'John', mode: 'insensitive' } } ] },
        { OR: [ { firstName: { contains: 'Doe', mode: 'insensitive' } }, { lastName: { contains: 'Doe', mode: 'insensitive' } } ] }
      ]
    }
  });
  console.log('Found:', users.length);
}
run();
