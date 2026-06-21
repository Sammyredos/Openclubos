const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const activeTournaments = await prisma.tournament.findMany({
    where: {
      deletedAt: null,
      status: {
        in: ['ONGOING', 'REGISTRATION_OPEN'],
      },
    },
    select: {
      name: true,
      status: true
    }
  });

  console.log("Active Tournaments:", JSON.stringify(activeTournaments, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
