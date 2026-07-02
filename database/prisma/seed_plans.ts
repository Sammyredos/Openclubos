import { PrismaClient } from '@prisma/client';
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
  console.log('🌱 Clearing old plans and seeding new Subscription Plans...');

  // Delete existing subscriptions and plans to avoid conflicts and stale data
  await prisma.subscription.deleteMany();
  await prisma.subscriptionPlan.deleteMany();

  const plans = [
    // Premium Player
    {
      name: 'Premium Player (Monthly)',
      description: 'Handicap history & trends, performance analytics, digital scorecard',
      amount: 1500,
      currency: 'NGN',
      billingCycle: 'MONTHLY',
      targetAudience: 'PLAYER',
      features: ['Handicap history & trends', 'Advanced performance analytics', 'Personal statistics dashboard', 'Digital scorecard archive', 'Priority tournament registration', 'Exclusive badges and achievements'],
      isActive: true,
    },
    {
      name: 'Premium Player (Annual)',
      description: 'Handicap history & trends, performance analytics, digital scorecard',
      amount: 15000,
      currency: 'NGN',
      billingCycle: 'ANNUAL',
      targetAudience: 'PLAYER',
      features: ['Handicap history & trends', 'Advanced performance analytics', 'Personal statistics dashboard', 'Digital scorecard archive', 'Priority tournament registration', 'Exclusive badges and achievements'],
      isActive: true,
    },

    // Starter Organizer
    {
      name: 'Starter Organizer (Monthly)',
      description: 'Best for new organizers. 3 active tournaments.',
      amount: 7500,
      currency: 'NGN',
      billingCycle: 'MONTHLY',
      targetAudience: 'ORGANIZER',
      features: ['3 active tournaments', 'Up to 300 players/year', 'Registration management', 'Live leaderboard', 'Basic reports', 'Email notifications'],
      isActive: true,
    },
    {
      name: 'Starter Organizer (Annual)',
      description: 'Best for new organizers. 3 active tournaments.',
      amount: 75000,
      currency: 'NGN',
      billingCycle: 'ANNUAL',
      targetAudience: 'ORGANIZER',
      features: ['3 active tournaments', 'Up to 300 players/year', 'Registration management', 'Live leaderboard', 'Basic reports', 'Email notifications'],
      isActive: true,
    },

    // Professional Organizer
    {
      name: 'Professional Organizer (Monthly)',
      description: 'Flagship plan with unlimited features and advanced capabilities',
      amount: 20000,
      currency: 'NGN',
      billingCycle: 'MONTHLY',
      targetAudience: 'ORGANIZER',
      features: ['Unlimited tournaments', 'Unlimited players', 'Live scoring', 'Tee time generation', 'Groupings & flights', 'Payment management', 'Analytics', 'Branding customization', 'Multiple staff accounts'],
      isActive: true,
    },
    {
      name: 'Professional Organizer (Annual)',
      description: 'Flagship plan with unlimited features and advanced capabilities',
      amount: 200000,
      currency: 'NGN',
      billingCycle: 'ANNUAL',
      targetAudience: 'ORGANIZER',
      features: ['Unlimited tournaments', 'Unlimited players', 'Live scoring', 'Tee time generation', 'Groupings & flights', 'Payment management', 'Analytics', 'Branding customization', 'Multiple staff accounts'],
      isActive: true,
    },

    // Enterprise Organizer
    {
      name: 'Enterprise Organizer',
      description: 'Custom plan for federations and chains',
      amount: 0,
      currency: 'NGN',
      billingCycle: 'ANNUAL',
      targetAudience: 'ORGANIZER',
      features: ['Unlimited everything', 'Dedicated support', 'API access', 'White-label options', 'Custom integrations', 'SLA'],
      isActive: true,
    },

    // Founding Tournament Host (Launch Offer)
    {
      name: 'Founding Tournament Host',
      description: 'Launch Offer: Lifetime introductory price',
      amount: 50000,
      currency: 'NGN',
      billingCycle: 'ANNUAL',
      targetAudience: 'ORGANIZER',
      features: ['Professional features', 'Recognition as a founding customer', 'Locked-in pricing'],
      isActive: true,
    }
  ];

  for (const plan of plans) {
    // Need to cast billingCycle and targetAudience so TS doesn't complain
    await prisma.subscriptionPlan.create({
      data: {
        name: plan.name,
        description: plan.description,
        amount: plan.amount,
        currency: plan.currency,
        billingCycle: plan.billingCycle as any,
        targetAudience: plan.targetAudience as any,
        features: plan.features,
        isActive: plan.isActive
      }
    });
  }

  console.log('✅ Successfully seeded new plans!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
