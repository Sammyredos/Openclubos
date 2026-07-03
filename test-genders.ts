import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const males = await prisma.user.count({ where: { gender: 'MALE' } });
  const females = await prisma.user.count({ where: { gender: 'FEMALE' } });
  
  console.log(`Males: ${males}, Females: ${females}`);
}

main().catch(console.error).finally(() => process.exit(0));
