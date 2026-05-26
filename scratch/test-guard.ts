import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config({ path: '.env' });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

async function testRequest(url: string, token: string) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return {
    status: res.status,
    statusText: res.statusText,
    json: await res.json().catch(() => null)
  };
}

async function main() {
  // Find a tournament in the database (clubId is required in Tournament schema)
  const tournament = await prisma.tournament.findFirst();

  if (!tournament) {
    console.error('No tournament found for testing');
    return;
  }

  console.log(`Testing with Tournament: ${tournament.name} (${tournament.id}), Club: ${tournament.clubId}`);

  // Find a user belonging to the SAME club
  const sameClubUser = await prisma.user.findFirst({
    where: {
      clubId: tournament.clubId,
      status: 'ACTIVE'
    }
  });

  // Find a user belonging to a DIFFERENT club
  const diffClubUser = await prisma.user.findFirst({
    where: {
      clubId: {
        not: tournament.clubId,
      },
      NOT: {
        clubId: null,
      },
      status: 'ACTIVE'
    }
  });

  // Find a SUPER_ADMIN user
  const superAdmin = await prisma.user.findFirst({
    where: {
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    }
  });

  if (!sameClubUser || !diffClubUser) {
    console.error('Could not find suitable test users in DB');
    return;
  }

  console.log(`Same Club User: ${sameClubUser.email} (Club: ${sameClubUser.clubId})`);
  console.log(`Different Club User: ${diffClubUser.email} (Club: ${diffClubUser.clubId})`);
  if (superAdmin) {
    console.log(`Super Admin User: ${superAdmin.email} (Role: ${superAdmin.role})`);
  }

  // Sign tokens
  const sameClubToken = jwt.sign({
    sub: sameClubUser.id,
    email: sameClubUser.email,
    role: sameClubUser.role,
    clubId: sameClubUser.clubId,
    uat: sameClubUser.updatedAt.getTime()
  }, JWT_SECRET);

  const diffClubToken = jwt.sign({
    sub: diffClubUser.id,
    email: diffClubUser.email,
    role: diffClubUser.role,
    clubId: diffClubUser.clubId,
    uat: diffClubUser.updatedAt.getTime()
  }, JWT_SECRET);

  let superAdminToken = '';
  if (superAdmin) {
    superAdminToken = jwt.sign({
      sub: superAdmin.id,
      email: superAdmin.email,
      role: superAdmin.role,
      clubId: superAdmin.clubId,
      uat: superAdmin.updatedAt.getTime()
    }, JWT_SECRET);
  }

  const url = `http://localhost:3001/api/tournaments/${tournament.id}`;

  console.log('\n--- Running Test Requests ---');

  // Test 1: Same Club User -> Should be allowed (returns 200)
  const res1 = await testRequest(url, sameClubToken);
  console.log(`Test 1 (Same Club User): Status ${res1.status}. Allowed: ${res1.status === 200}`);
  if (res1.status !== 200) {
    console.error('Response body:', res1.json);
  }

  // Test 2: Different Club User -> Should be Forbidden (returns 403)
  const res2 = await testRequest(url, diffClubToken);
  console.log(`Test 2 (Diff Club User): Status ${res2.status}. Forbidden: ${res2.status === 403}`);
  if (res2.status !== 403) {
    console.error('Response body:', res2.json);
  }

  // Test 3: Super Admin -> Should be allowed (returns 200)
  if (superAdminToken) {
    const res3 = await testRequest(url, superAdminToken);
    console.log(`Test 3 (Super Admin): Status ${res3.status}. Allowed: ${res3.status === 200}`);
    if (res3.status !== 200) {
      console.error('Response body:', res3.json);
    }
  }

  console.log('\nAll tests complete.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
