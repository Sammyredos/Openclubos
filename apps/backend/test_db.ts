import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const search = 'Samuel Osei';
  const tokens = search.trim().split(/[\s-]+/).filter(Boolean);

  const where: any = { deletedAt: null };

  if (tokens.length > 0) {
    where.AND = tokens.map((token: string) => ({
      OR: [
        { firstName: { contains: token, mode: 'insensitive' } },
        { lastName: { contains: token, mode: 'insensitive' } },
        { email: { contains: token, mode: 'insensitive' } },
        { club: { name: { contains: token, mode: 'insensitive' } } },
      ],
    }));
  }

  const users = await prisma.user.findMany({
    where,
    select: { firstName: true, lastName: true, email: true },
  });

  console.log('Search for "Samuel Osei":', users.length, 'users found.');
  console.log(users);
}

main().finally(() => prisma.$disconnect());
