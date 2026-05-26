import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';

// Load .env
dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const tournaments = await prisma.tournament.findMany({
    take: 5,
    select: { id: true, name: true, clubId: true }
  });
  console.log('Tournaments:', tournaments);

  const courses = await prisma.course.findMany({
    take: 5,
    select: { id: true, name: true, clubId: true }
  });
  console.log('Courses:', courses);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
