import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString =
  process.env.DATABASE_URL && process.env.DATABASE_URL !== 'undefined'
    ? process.env.DATABASE_URL
    : 'postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    where: {
      profilePhoto: {
        contains: 'ui-avatars.com',
      },
    },
  });

  console.log(`Found ${users.length} users with ui-avatars.com profile photos.`);

  for (const user of users) {
    console.log(`Updating user: ${user.firstName} ${user.lastName} (${user.email})`);
    await prisma.user.update({
      where: { id: user.id },
      data: { profilePhoto: null },
    });
  }

  // Also update superadmin name
  const superadmin = await prisma.user.findFirst({
    where: {
      email: {
        contains: 'superadmin',
        mode: 'insensitive',
      },
    },
  });
  if (superadmin) {
    console.log(`Found superadmin: ${superadmin.email}. Updating name to Samuel Obadina.`);
    await prisma.user.update({
      where: { id: superadmin.id },
      data: { firstName: 'Samuel', lastName: 'Obadina' },
    });
  }

  console.log('Cleanup completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
