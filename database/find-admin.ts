import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

process.env.DATABASE_URL = "postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'SUPER_ADMIN' },
    select: { id: true, email: true }
  });
  console.log('SUPER_ADMINS:', JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
