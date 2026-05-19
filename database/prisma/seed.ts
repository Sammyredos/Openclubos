import {
  PaymentStatus,
  PrismaClient,
  RegistrationStatus,
  TournamentStatus,
  UserRole,
} from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function getArgs() {
  return process.argv.slice(2).filter((a) => a !== '--');
}

function hasFlag(flag: string) {
  return getArgs().includes(flag);
}

function getArgValue(flag: string) {
  const args = getArgs();
  const prefix = `${flag}=`;
  const match = args.find((a) => a.startsWith(prefix));
  if (!match) return undefined;
  return match.slice(prefix.length);
}

function getIntArg(flag: string, defaultValue: number) {
  const raw = getArgValue(flag);
  if (!raw) return defaultValue;
  const n = Number(raw);
  if (!Number.isFinite(n)) return defaultValue;
  return Math.max(0, Math.floor(n));
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]) {
  return arr[randomInt(0, arr.length - 1)];
}

function shuffle<T>(arr: T[]) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function main() {
  const clearOnly = hasFlag('--clear');

  console.log(clearOnly ? '🧹 Clearing database...' : '🌱 Seeding database with direct connection...');

  // 1. Cleanup existing data (Optional, but recommended for clean seeds)
  // Note: Delete in order of dependencies
  await prisma.registration.deleteMany();
  await prisma.score.deleteMany();
  await prisma.group.deleteMany();
  await prisma.hole.deleteMany();
  await prisma.tournament.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany();
  await prisma.club.deleteMany();

  if (clearOnly) {
    console.log('🏁 Database cleared successfully!');
    return;
  }

  const clubsCount = Math.max(1, getIntArg('--clubs', 20));
  const staffPerClub = getIntArg('--staffPerClub', 5);
  const playersPerClub = getIntArg('--playersPerClub', 94);
  const tournamentsPerClub = getIntArg('--tournamentsPerClub', 2);
  const registrationsPerTournament = getIntArg('--registrationsPerTournament', 25);

  const passwordPlain = 'Password123!';
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  const firstNames = [
    'Liam',
    'Noah',
    'Oliver',
    'James',
    'Elijah',
    'William',
    'Henry',
    'Lucas',
    'Benjamin',
    'Theodore',
    'Olivia',
    'Emma',
    'Charlotte',
    'Amelia',
    'Sophia',
    'Mia',
    'Isabella',
    'Ava',
    'Evelyn',
    'Luna',
  ];
  const lastNames = [
    'Smith',
    'Johnson',
    'Williams',
    'Brown',
    'Jones',
    'Garcia',
    'Miller',
    'Davis',
    'Rodriguez',
    'Martinez',
    'Hernandez',
    'Lopez',
    'Gonzalez',
    'Wilson',
    'Anderson',
    'Thomas',
    'Taylor',
    'Moore',
    'Jackson',
    'Martin',
  ];

  const superAdminEmail = 'superadmin@openclub.os';
  const oakwoodAdminEmail = 'admin@oakwood.com';

  await prisma.user.create({
    data: {
      email: superAdminEmail,
      password: passwordHash,
      firstName: 'Admin',
      lastName: 'Primary',
      role: UserRole.SUPER_ADMIN,
    },
  });

  let createdClubs = 0;
  let createdCourses = 0;
  let createdHoles = 0;
  let createdUsers = 1;
  let createdTournaments = 0;
  let createdRegistrations = 0;

  const statuses: TournamentStatus[] = [
    TournamentStatus.ONGOING,
    TournamentStatus.REGISTRATION_OPEN,
    TournamentStatus.COMPLETED,
    TournamentStatus.DRAFT,
  ];

  let globalMemberIndex = 1;

  for (let i = 1; i <= clubsCount; i++) {
    const clubName = i === 1 ? 'Oakwood Country Club' : `OpenClub Golf Club ${i}`;
    const clubAddress =
      i === 1
        ? '123 Fairway Drive, Augusta, GA 30907'
        : `${randomInt(10, 999)} Greens Avenue, City ${i}`;

    const club = await prisma.club.create({
      data: { name: clubName, address: clubAddress },
    });
    createdClubs += 1;

    const course = await prisma.course.create({
      data: { name: `${clubName} Course`, clubId: club.id, holesCount: 18 },
    });
    createdCourses += 1;

    const holes = Array.from({ length: 18 }).map((_, idx) => {
      const number = idx + 1;
      const par = number % 6 === 0 ? 3 : number % 5 === 0 ? 5 : 4;
      const distance = par === 3 ? randomInt(120, 190) : par === 5 ? randomInt(420, 560) : randomInt(260, 420);
      return { courseId: course.id, number, par, index: number, distance };
    });
    const holesRes = await prisma.hole.createMany({ data: holes });
    createdHoles += holesRes.count;

    const clubAdminEmail = i === 1 ? oakwoodAdminEmail : `admin${i}@club${i}.com`;
    await prisma.user.create({
      data: {
        email: clubAdminEmail,
        password: passwordHash,
        firstName: pick(firstNames),
        lastName: pick(lastNames),
        role: UserRole.CLUB_ADMIN,
        clubId: club.id,
      },
    });
    createdUsers += 1;

    const staffRows = Array.from({ length: staffPerClub }).map((_, sIdx) => {
      const staffNum = sIdx + 1;
      const email = i === 1 ? `staff${staffNum}@oakwood.com` : `staff${staffNum}@club${i}.com`;
      return {
        email,
        password: passwordHash,
        firstName: pick(firstNames),
        lastName: pick(lastNames),
        role: UserRole.PLAYER,
        clubId: club.id,
      };
    });
    if (staffRows.length > 0) {
      const staffRes = await prisma.user.createMany({ data: staffRows });
      createdUsers += staffRes.count;
    }

    const playerRows = Array.from({ length: playersPerClub }).map(() => {
      const first = pick(firstNames);
      const last = pick(lastNames);
      const email = `member${globalMemberIndex}@example.com`;
      globalMemberIndex += 1;
      return {
        email,
        password: passwordHash,
        firstName: first,
        lastName: `${last}-${globalMemberIndex}`,
        role: UserRole.PLAYER,
        clubId: club.id,
      };
    });
    if (playerRows.length > 0) {
      const playersRes = await prisma.user.createMany({ data: playerRows });
      createdUsers += playersRes.count;
    }

    const clubPlayers = await prisma.user.findMany({
      where: { clubId: club.id, role: UserRole.PLAYER },
      select: { id: true },
    });

    for (let t = 0; t < tournamentsPerClub; t++) {
      const status = statuses[(i + t) % statuses.length];
      const now = new Date();
      let startDate: Date;
      let endDate: Date | null = null;
      let registrationCloseAt: Date | null = null;

      if (status === TournamentStatus.COMPLETED) {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - randomInt(25, 55));
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + randomInt(1, 3));
      } else if (status === TournamentStatus.ONGOING) {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - randomInt(0, 2));
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + randomInt(1, 3));
      } else if (status === TournamentStatus.REGISTRATION_OPEN) {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() + randomInt(10, 60));
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + randomInt(1, 3));
        registrationCloseAt = new Date(startDate);
        registrationCloseAt.setDate(registrationCloseAt.getDate() - randomInt(1, 14));
      } else {
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() + randomInt(90, 180));
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + randomInt(1, 3));
      }

      const tournament = await prisma.tournament.create({
        data: {
          name: `${clubName} Tournament ${t + 1}`,
          clubId: club.id,
          courseId: course.id,
          startDate,
          endDate,
          status,
          entryFee: randomInt(5000, 50000),
          maxPlayers: randomInt(60, 144),
          playerTypes: ['MEMBER'],
          registrationCloseAt,
        },
      });
      createdTournaments += 1;

      if (status === TournamentStatus.DRAFT || clubPlayers.length === 0) continue;

      const take = Math.min(registrationsPerTournament, clubPlayers.length);
      const selected = shuffle(clubPlayers).slice(0, take);
      const registrations = selected.map((p, idx) => {
        const paid = idx % 3 !== 0;
        const registeredAt = new Date(startDate);
        registeredAt.setDate(registeredAt.getDate() - randomInt(1, 20));
        return {
          userId: p.id,
          tournamentId: tournament.id,
          status: RegistrationStatus.APPROVED,
          paymentStatus: paid ? PaymentStatus.PAID : PaymentStatus.UNPAID,
          playerType: 'MEMBER',
          paymentReference: paid ? `PAY-${tournament.id.slice(0, 6)}-${p.id.slice(0, 6)}` : null,
          registeredAt,
        };
      });
      const regRes = await prisma.registration.createMany({ data: registrations });
      createdRegistrations += regRes.count;
    }
  }

  console.log(
    [
      '🏁 Seeding completed successfully!',
      `Super admin: ${superAdminEmail} / ${passwordPlain}`,
      `Club admin (Oakwood): ${oakwoodAdminEmail} / ${passwordPlain}`,
      `Clubs: ${createdClubs}`,
      `Courses: ${createdCourses}`,
      `Holes: ${createdHoles}`,
      `Users: ${createdUsers}`,
      `Tournaments: ${createdTournaments}`,
      `Registrations: ${createdRegistrations}`,
    ].join('\n'),
  );
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
