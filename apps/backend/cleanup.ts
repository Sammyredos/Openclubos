const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config({ path: '../../.env' });

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const clubId = 'c89c37fe-a26a-47b5-84ad-b341f853c8eb'; // ID of the first seeded club

  console.log('Starting cleanup...');

  // Delete registrations for tournaments under this club
  const tournaments = await prisma.tournament.findMany({ where: { clubId } });
  for (const t of tournaments) {
    await prisma.registration.deleteMany({ where: { tournamentId: t.id } });
    await prisma.group.deleteMany({ where: { tournamentId: t.id } });
  }

  // Delete scores for users in this club
  const users = await prisma.user.findMany({ where: { clubId } });
  for (const u of users) {
    await prisma.score.deleteMany({ where: { userId: u.id } });
  }

  // Delete users
  await prisma.user.deleteMany({ where: { clubId } });

  // Delete tournaments
  await prisma.tournament.deleteMany({ where: { clubId } });

  // Delete holes & tee boxes
  const courses = await prisma.course.findMany({ where: { clubId } });
  for (const c of courses) {
    await prisma.hole.deleteMany({ where: { courseId: c.id } });
    await prisma.teeBox.deleteMany({ where: { courseId: c.id } });
  }
  
  // Delete courses
  await prisma.course.deleteMany({ where: { clubId } });

  // Delete club
  await prisma.club.delete({ where: { id: clubId } });

  console.log('Cleanup completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
