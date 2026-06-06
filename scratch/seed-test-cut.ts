import { PrismaClient, TournamentStatus, RegistrationStatus, PaymentStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });
const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log('🌱 Seeding 3-Day Tournament with Cut...');

  // 1. Get a Club and Course
  const club = await prisma.club.findFirst();
  if (!club) throw new Error('No club found in database.');

  const course = await prisma.course.findFirst({ where: { clubId: club.id } });
  if (!course) throw new Error('No course found in database.');

  const holes = await prisma.hole.findMany({ where: { courseId: course.id } });
  if (holes.length === 0) throw new Error('No holes found for course.');

  // 2. Get some players
  const players = await prisma.user.findMany({
    where: { role: 'PLAYER' },
    take: 12, // 12 players total
  });

  if (players.length < 12) throw new Error('Not enough players. Run npx prisma db seed first.');

  // 3. Create Tournament
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 1); // Started yesterday
  
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 1); // Ends tomorrow (3 days total)

  const tournament = await prisma.tournament.create({
    data: {
      name: `OpenClub 3-Day Championship ${Math.floor(Math.random() * 1000)}`,
      clubId: club.id,
      courseId: course.id,
      startDate,
      endDate,
      status: TournamentStatus.ONGOING,
      format: 'STROKE_PLAY',
      scoringType: 'GROSS',
      enableCut: true,
      cutAfterRound: 1, // Cut after Day 1
      cutLine: -50, // 50% cut
      maxPlayers: 10,
      enableWaitlist: true,
    },
  });

  console.log(`✅ Tournament created: ${tournament.name}`);

  // 4. Create Registrations (10 approved, 2 waitlisted)
  const approvedPlayers = players.slice(0, 10);
  const waitlistedPlayers = players.slice(10, 12);

  for (const p of approvedPlayers) {
    await prisma.registration.create({
      data: {
        tournamentId: tournament.id,
        userId: p.id,
        status: RegistrationStatus.APPROVED,
        paymentStatus: PaymentStatus.PAID,
        playerType: 'MEMBER',
      },
    });
  }

  for (const p of waitlistedPlayers) {
    await prisma.registration.create({
      data: {
        tournamentId: tournament.id,
        userId: p.id,
        status: RegistrationStatus.WAITLISTED,
        paymentStatus: PaymentStatus.UNPAID,
        playerType: 'MEMBER',
      },
    });
  }

  console.log(`✅ Created 10 approved registrations and 2 waitlisted.`);

  // 5. Create Groupings for Day 1
  // 10 players -> 3 groups (4, 4, 2)
  const day1Date = new Date(startDate);
  
  for (let i = 0; i < 3; i++) {
    const groupPlayers = approvedPlayers.slice(i * 4, (i + 1) * 4);
    if (groupPlayers.length === 0) break;

    const groupTime = new Date(day1Date);
    groupTime.setHours(8, i * 10, 0, 0);

    const group = await prisma.group.create({
      data: {
        tournamentId: tournament.id,
        name: `Group ${i + 1}`,
        startTime: groupTime,
      },
    });

    // 6. Enter Scores for Day 1
    // We want a mix of scores so the cut works.
    // Group 1 gets good scores, Group 2 gets medium, Group 3 gets bad.
    for (const p of groupPlayers) {
      let baseStrokes = 4;
      if (i === 0) baseStrokes = 3; // Good
      if (i === 1) baseStrokes = 5; // Medium
      if (i === 2) baseStrokes = 6; // Bad

      const scoresData = holes.map((h) => ({
        groupId: group.id,
        userId: p.id,
        holeId: h.id,
        strokes: baseStrokes + randomInt(0, 2),
      }));

      await prisma.score.createMany({ data: scoresData });
    }
  }

  console.log(`✅ Created Day 1 Groupings and populated scores for all 10 players!`);
  console.log(`\n🎉 Seed complete! Go to the Organizer Admin Dashboard -> Tournaments to test the Make Cut button!`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
