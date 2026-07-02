import { PrismaClient, SubscriptionStatus } from '@prisma/client';
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
  console.log('Fetching existing plans, clubs, and players...');
  
  const plans = await prisma.subscriptionPlan.findMany();
  
  if (plans.length === 0) {
    console.log('No plans found! Please run seed_plans.ts first.');
    return;
  }
  
  const clubs = await prisma.club.findMany();
  const players = await prisma.user.findMany({
    where: { role: 'PLAYER' }
  });
  
  const organizerPlans = plans.filter(p => p.targetAudience === 'ORGANIZER');
  const playerPlans = plans.filter(p => p.targetAudience === 'PLAYER');
  
  console.log(`Found ${organizerPlans.length} Organizer Plans, ${playerPlans.length} Player Plans.`);
  console.log(`Found ${clubs.length} Clubs, ${players.length} Players.`);
  
  // Create subscriptions for Clubs
  if (organizerPlans.length > 0) {
    for (const club of clubs) {
      const plan = organizerPlans[Math.floor(Math.random() * organizerPlans.length)];
      
      const existing = await prisma.subscription.findFirst({
        where: { clubId: club.id }
      });
      
      if (!existing) {
        await prisma.subscription.create({
          data: {
            clubId: club.id,
            subscriptionPlanId: plan.id,
            status: SubscriptionStatus.ACTIVE,
            nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
          }
        });
        console.log(`Created subscription for club: ${club.name}`);
      }
    }
  }

  // Create subscriptions for Players
  if (playerPlans.length > 0) {
    for (const player of players) {
      const plan = playerPlans[Math.floor(Math.random() * playerPlans.length)];
      
      const existing = await prisma.subscription.findFirst({
        where: { userId: player.id }
      });
      
      if (!existing) {
        await prisma.subscription.create({
          data: {
            userId: player.id,
            subscriptionPlanId: plan.id,
            status: SubscriptionStatus.ACTIVE,
            nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
          }
        });
        console.log(`Created subscription for player: ${player.email}`);
      }
    }
  }
  
  console.log('Subscriptions seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
