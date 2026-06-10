const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
require('dotenv').config({ path: '../../.env' });

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const { v4: uuidv4 } = require('uuid');

async function main() {
  console.log('Starting seed...');

  // Create a club
  const club = await prisma.club.create({
    data: {
      name: 'Championship Golf Club',
      state: 'Lagos',
      city: 'Ikeja',
      logo: 'https://api.dicebear.com/7.x/shapes/svg?seed=cgc',
    },
  });
  console.log('Created club:', club.id);

  // Create a course
  const course = await prisma.course.create({
    data: {
      name: 'Championship Course',
      clubId: club.id,
      holesCount: 18,
      par: 72,
    },
  });
  console.log('Created course:', course.id);

  // Create holes
  const holes = [];
  for (let i = 1; i <= 18; i++) {
    const hole = await prisma.hole.create({
      data: {
        number: i,
        par: i % 3 === 0 ? 3 : (i % 5 === 0 ? 5 : 4),
        courseId: course.id,
      },
    });
    holes.push(hole);
  }
  console.log('Created 18 holes');

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Create a tournament
  const tournament = await prisma.tournament.create({
    data: {
      name: 'OpenClub Championship 2026',
      clubId: club.id,
      courseId: course.id,
      startDate: yesterday,
      endDate: tomorrow,
      status: 'ONGOING',
      format: 'STROKE_PLAY',
      scoringType: 'GROSS',
      holes: 54, // 3 days
      enableCut: true,
      cutAfterRound: 2,
    },
  });
  console.log('Created tournament:', tournament.id);

  // Create users and register them
  const players = [];
  const registrations = [];
  for (let i = 1; i <= 12; i++) {
    const user = await prisma.user.create({
      data: {
        email: `player${i}_${Date.now()}@example.com`,
        password: 'hashedpassword',
        firstName: `Player`,
        lastName: `${i}`,
        role: 'PLAYER',
        clubId: club.id,
      },
    });
    players.push(user);

    const reg = await prisma.registration.create({
      data: {
        userId: user.id,
        tournamentId: tournament.id,
        status: 'APPROVED',
        paymentStatus: 'PAID',
        madeCut: i <= 6 ? true : false, // Half make the cut, half miss
      },
    });
    registrations.push(reg);
  }
  console.log('Created 12 players and registered them');

  // Create groups for Day 1
  const day1Group1 = await prisma.group.create({ data: { name: 'Day 1 Group 1', tournamentId: tournament.id, startTime: yesterday } });
  const day1Group2 = await prisma.group.create({ data: { name: 'Day 1 Group 2', tournamentId: tournament.id, startTime: yesterday } });
  const day1Group3 = await prisma.group.create({ data: { name: 'Day 1 Group 3', tournamentId: tournament.id, startTime: yesterday } });
  
  // Create groups for Day 2
  const day2Group1 = await prisma.group.create({ data: { name: 'Day 2 Group 1', tournamentId: tournament.id, startTime: today } });
  const day2Group2 = await prisma.group.create({ data: { name: 'Day 2 Group 2', tournamentId: tournament.id, startTime: today } });
  const day2Group3 = await prisma.group.create({ data: { name: 'Day 2 Group 3', tournamentId: tournament.id, startTime: today } });

  // Create groups for Day 3 (Only 6 players, so 2 groups)
  const day3Group1 = await prisma.group.create({ data: { name: 'Day 3 Group 1', tournamentId: tournament.id, startTime: tomorrow } });
  const day3Group2 = await prisma.group.create({ data: { name: 'Day 3 Group 2', tournamentId: tournament.id, startTime: tomorrow } });

  const getGroupForPlayer = (playerIndex: number, day: number) => {
    if (day === 1) {
      if (playerIndex < 4) return day1Group1;
      if (playerIndex < 8) return day1Group2;
      return day1Group3;
    }
    if (day === 2) {
      if (playerIndex < 4) return day2Group1;
      if (playerIndex < 8) return day2Group2;
      return day2Group3;
    }
    if (day === 3) {
      if (playerIndex < 3) return day3Group1;
      return day3Group2;
    }
  };

  // Add scores
  for (let d = 1; d <= 3; d++) {
    for (let p = 0; p < 12; p++) {
      // On day 3, only first 6 players (who made the cut) play
      if (d === 3 && p >= 6) continue;

      const group = getGroupForPlayer(p, d);
      const player = players[p];

      for (let h = 0; h < 18; h++) {
        const hole = holes[h];
        let strokes = hole.par;
        if (p < 3) strokes -= 1; // Birdie machines (-18 per round)
        else if (p < 6) strokes += 0; // Par shooters (E per round)
        else if (p < 9) strokes += 1; // Bogey golfers (+18 per round)
        else strokes += 2; // Double bogey (+36 per round)
        
        await prisma.score.create({
          data: {
            userId: player.id,
            holeId: hole.id,
            groupId: group.id,
            strokes,
            status: 'CONFIRMED',
          },
        });
      }
    }
  }
  console.log('Added scores for all players');

  console.log('Seeding completed successfully!');
  console.log(`Tournament ID: ${tournament.id}`);
  console.log(`Club ID: ${club.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
