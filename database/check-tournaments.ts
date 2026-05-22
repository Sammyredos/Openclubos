import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

process.env.DATABASE_URL = "postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const clubs = await prisma.club.findMany({
    where: { name: { contains: 'ikoyi', mode: 'insensitive' } },
    select: { id: true, name: true }
  });
  console.log('CLUBS MATCHING IKOYI:', JSON.stringify(clubs, null, 2));

  for (const club of clubs) {
    const tournaments = await prisma.tournament.findMany({
      where: { clubId: club.id },
      select: { id: true, name: true, status: true, startDate: true }
    });
    console.log(`TOURNAMENTS FOR ${club.name} (${club.id}):`, JSON.stringify(tournaments, null, 2));
  }
}

main().finally(() => prisma.$disconnect());
