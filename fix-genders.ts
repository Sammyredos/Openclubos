import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const users = await prisma.user.findMany();
  let males = 0;
  let females = 0;
  
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    if (user.gender === null || user.gender === undefined) {
      // randomly assign MALE or FEMALE
      const gender = Math.random() > 0.3 ? 'MALE' : 'FEMALE';
      await prisma.user.update({
        where: { id: user.id },
        data: { gender }
      });
      if (gender === 'MALE') males++;
      else females++;
    }
  }
  
  console.log(`Updated ${males} males and ${females} females.`);
}

main().catch(console.error).finally(() => process.exit(0));
