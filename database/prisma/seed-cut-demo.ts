import {
  PaymentStatus,
  PrismaClient,
  RegistrationStatus,
  TournamentStatus,
  ScoreStatus,
  UserRole,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding Cut Demo Tournament...');

  // 1. Get a Club and Course
  const club = await prisma.club.findFirst();
  const course = await prisma.course.findFirst({
    include: { holes: true },
  });

  if (!club || !course) {
    throw new Error('Club or Course not found in database. Please run regular seed first.');
  }

  if (course.holes.length === 0) {
    throw new Error('Course has no holes in database.');
  }

  // 2. Create a 4-Day Tournament with Cut
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 3); // Started 3 days ago

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 3); // Ends today

  const tournament = await prisma.tournament.create({
    data: {
      name: `Major Championship (4-Day with Cut)`,
      description: 'A 4-day tournament testing the cut functionality.',
      clubId: club.id,
      courseId: course.id,
      startDate: startDate,
      endDate: endDate,
      status: TournamentStatus.ONGOING,
      format: 'STROKE_PLAY',
      scoringType: 'GROSS',
      holes: 18,
      allowGuests: false,
      enableCut: true,
      cutAfterRound: 3,
      cutLine: 10, // Top 10 advance
      playerTypes: ['MEMBER', 'EXTERNAL'],
      divisions: ['PRO', 'AMATEUR'],
      maxPlayersPerGroup: 4,
      entryFee: 50000,
      currency: 'NGN',
    },
  });

  console.log(`✅ Created Tournament: ${tournament.name}`);

  // 3. Create or get 20 Players
  const players = [];
  for (let i = 0; i < 20; i++) {
    const user = await prisma.user.create({
      data: {
        email: `player${i}@example.com`,
        firstName: `Player`,
        lastName: `${i}`,
        role: UserRole.PLAYER,
        password: 'password123', // Dummy password
        clubId: club.id,
        handicap: Math.floor(Math.random() * 24),
        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
      },
    });
    players.push(user);
  }
  console.log(`✅ Created 20 Players`);

  // 4. Register Players
  const registrations = [];
  for (const player of players) {
    const reg = await prisma.registration.create({
      data: {
        userId: player.id,
        tournamentId: tournament.id,
        status: RegistrationStatus.APPROVED,
        paymentStatus: PaymentStatus.PAID,
        playerType: 'MEMBER',
      },
    });
    registrations.push(reg);
  }
  console.log(`✅ Registered 20 Players`);

  // 5. Generate Groups and Scores for Day 1, 2, and 3
  // To keep it simple, we just create 1 group per day that contains everyone (backend doesn't strictly enforce group size on DB level)
  // Actually, let's create 5 groups of 4 per day
  const playerScores: Record<string, number> = {};
  
  for (const reg of registrations) {
    playerScores[reg.userId] = 0;
  }

  for (let day = 1; day <= 3; day++) {
    console.log(`⛳ Generating Day ${day} Groupings and Scores...`);
    
    // Create groups
    const groups = [];
    for (let i = 0; i < 5; i++) {
      const g = await prisma.group.create({
        data: {
          name: `Day ${day} - Group ${i + 1}`,
          tournamentId: tournament.id,
          startTime: new Date(startDate.getTime() + (day - 1) * 86400000 + i * 600000), // +10 mins each
        },
      });
      groups.push(g);
    }

    // Assign scores
    for (let i = 0; i < players.length; i++) {
      const player = players[i];
      const group = groups[Math.floor(i / 4)];
      
      for (const hole of course.holes) {
        const strokes = hole.par + Math.floor(Math.random() * 5) - 1;
        playerScores[player.id] += strokes;

        await prisma.score.create({
          data: {
            strokes,
            userId: player.id,
            holeId: hole.id,
            groupId: group.id,
            status: ScoreStatus.CONFIRMED, // Assume all confirmed
            markerId: players[(i + 1) % players.length].id, // Next player is marker
            recordedAt: new Date(startDate.getTime() + (day - 1) * 86400000 + hole.number * 900000),
          },
        });
      }
    }
  }

  // 6. Apply Cut Logic
  console.log('✂️ Applying Cut (Top 10 advance)...');
  
  const sortedPlayers = Object.entries(playerScores)
    .map(([userId, totalStrokes]) => ({ userId, totalStrokes }))
    .sort((a, b) => a.totalStrokes - b.totalStrokes);

  const cutLineIndex = Math.min((tournament.cutLine || 10) - 1, sortedPlayers.length - 1);
  const cutScoreThreshold = sortedPlayers[cutLineIndex].totalStrokes;

  let advanced = 0;
  let cut = 0;

  for (const player of sortedPlayers) {
    const madeCut = player.totalStrokes <= cutScoreThreshold;
    if (madeCut) advanced++;
    else cut++;

    await prisma.registration.updateMany({
      where: {
        userId: player.userId,
        tournamentId: tournament.id,
      },
      data: {
        madeCut,
      },
    });
  }

  console.log(`✅ Cut Applied! ${advanced} players advanced, ${cut} players missed the cut.`);
  console.log('🎉 Seed complete! Check the UI on Day 4 to see the grouping pool.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
