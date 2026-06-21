import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:your-secure-password@localhost:5433/openclub?schema=public';
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const STATES = ['Lagos', 'Abuja', 'Rivers', 'Oyo', 'Kano', 'Enugu', 'Edo', 'Delta'];
const CITIES: Record<string, string[]> = {
  'Lagos': ['Ikeja', 'Lekki', 'Victoria Island'],
  'Abuja': ['Garki', 'Wuse', 'Maitama'],
  'Rivers': ['Port Harcourt', 'Obio-Akpor'],
  'Oyo': ['Ibadan', 'Ogbomosho'],
  'Kano': ['Kano Municipal', 'Fagge'],
  'Enugu': ['Enugu North', 'Enugu South'],
  'Edo': ['Benin City', 'Uromi'],
  'Delta': ['Asaba', 'Warri']
};

const GENDERS: any[] = ['MALE', 'FEMALE', 'MALE', 'FEMALE', 'MALE'];

async function main() {
  const clubs = await prisma.club.findMany({
    where: { state: null }
  });

  for (const club of clubs) {
    const state = STATES[Math.floor(Math.random() * STATES.length)];
    const city = CITIES[state][Math.floor(Math.random() * CITIES[state].length)];
    await prisma.club.update({
      where: { id: club.id },
      data: {
        state,
        city,
        address: `123 ${city} Road`,
      }
    });
  }

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { state: null },
        { gender: null },
        { dob: null }
      ]
    }
  });

  for (const user of users) {
    const state = STATES[Math.floor(Math.random() * STATES.length)];
    const city = CITIES[state][Math.floor(Math.random() * CITIES[state].length)];
    const gender = GENDERS[Math.floor(Math.random() * GENDERS.length)];
    const year = 1970 + Math.floor(Math.random() * 30);
    const month = String(1 + Math.floor(Math.random() * 12)).padStart(2, '0');
    const day = String(1 + Math.floor(Math.random() * 28)).padStart(2, '0');
    
    await prisma.user.update({
      where: { id: user.id },
      data: {
        state: user.state || state,
        city: user.city || city,
        address: user.address || `456 ${city} Avenue`,
        gender: user.gender || gender,
        dob: user.dob || `${year}-${month}-${day}`
      }
    });
  }

  console.log(`Updated ${clubs.length} clubs and ${users.length} users with missing demographic/location data`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
