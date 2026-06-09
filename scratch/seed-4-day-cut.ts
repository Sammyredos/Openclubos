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
  console.log('🌱 Seeding 4-Day Tournament with Cut after Day 2...');

  // 1. Get a Club and Course
  const club = await prisma.club.findFirst();
  if (!club) throw new Error('No club found in database.');

  const course = await prisma.course.findFirst({ where: { clubId: club.id } });
  if (!course) throw new Error('No course found in database.');

  const holes = await prisma.hole.findMany({ where: { courseId: course.id } });
  if (holes.length === 0) throw new Error('No holes found for course.');

  // 2. Get some players (up to 20)
  const players = await prisma.user.findMany({
    where: { role: 'PLAYER' },
    take: 20,
  });

  if (players.length < 16) throw new Error('Not enough players. Run npx prisma db seed first.');

  // 3. Create Tournament
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 2); // Started 2 days ago
  
  const endDate = new Date(today);
  endDate.setDate(endDate.getDate() + 1); // Ends tomorrow (4 days total)

  const tournament = await prisma.tournament.create({
    data: {
      name: `OpenClub 4-Day Masters ${Math.floor(Math.random() * 1000)}`,
      clubId: club.id,
      courseId: course.id,
      startDate,
      endDate,
      status: TournamentStatus.ONGOING,
      format: 'STROKE_PLAY',
      scoringType: 'GROSS',
      enableCut: true,
      cutAfterRound: 2, // Cut after Day 2
      cutLine: -50, // 50% cut
      maxPlayers: 20,
      enableWaitlist: true,
      lockedGroupingsDays: [1, 2], // Day 1 and Day 2 are locked
    },
  });

  console.log(`✅ Tournament created: ${tournament.name}`);

  // 4. Create Registrations
  const approvedPlayers = players.slice(0, 16);
  const waitlistedPlayers = players.slice(16, 20);

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

  console.log(`✅ Created 16 approved registrations and ${waitlistedPlayers.length} waitlisted.`);

  // 5. Create Groupings & Scores for Day 1
  const day1Date = new Date(startDate);
  await seedRound(1, day1Date, approvedPlayers, tournament.id, holes);

  // 6. Create Groupings & Scores for Day 2
  const day2Date = new Date(startDate);
  day2Date.setDate(day2Date.getDate() + 1);
  await seedRound(2, day2Date, approvedPlayers, tournament.id, holes);

  console.log(`✅ Created Day 1 and Day 2 Groupings with full scores!`);
  console.log(`\n🎉 Seed complete! Check the Leaderboard tab to test the new Cut-Off Banner!`);
}

async function seedRound(round: number, date: Date, players: any[], tournamentId: string, holes: any[]) {
  for (let i = 0; i < 4; i++) {
    const groupPlayers = players.slice(i * 4, (i + 1) * 4);
    if (groupPlayers.length === 0) break;

    const groupTime = new Date(date);
    groupTime.setHours(8, i * 10, 0, 0);

    const group = await prisma.group.create({
      data: {
        tournamentId,
        name: `Day ${round} - Group ${i + 1}`,
        startTime: groupTime,
      },
    });

    for (const p of groupPlayers) {
      // Different performance based on group index just to spread out scores
      let baseStrokes = 4;
      if (i === 0) baseStrokes = 3; // Good
      if (i === 1) baseStrokes = 4; // Medium
      if (i >= 2) baseStrokes = 5; // Bad

      const scoresData = holes.map((h) => ({
        groupId: group.id,
        userId: p.id,
        holeId: h.id,
        strokes: baseStrokes + randomInt(0, 2),
      }));

      await prisma.score.createMany({ data: scoresData });
    }
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
