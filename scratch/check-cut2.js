const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const t = await prisma.tournament.findFirst({
    where: { name: { contains: 'OpenClub 3-Day Championship' } }
  });
  console.log('Tournament:', t?.name);
  console.log('enableCut:', t?.enableCut);
  console.log('cutAfterRound:', t?.cutAfterRound);
}

main().then(() => {
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
