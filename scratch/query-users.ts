import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    take: 10,
    where: { status: 'ACTIVE' },
    select: { id: true, email: true, role: true, clubId: true }
  });
  console.log('Active Users:', users);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
