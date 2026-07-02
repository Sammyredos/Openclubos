const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Subscription Plans...');

  const plans = [
    {
      name: 'Basic Organizer',
      description: 'Essential tools for small clubs',
      amount: 50000,
      currency: 'NGN',
      billingCycle: 'MONTHLY',
      targetAudience: 'ORGANIZER',
      features: ['Up to 2 Tournaments', 'Basic Support', 'Standard Reports'],
      isActive: true,
    },
    {
      name: 'Professional Organizer',
      description: 'Advanced features for large clubs',
      amount: 150000,
      currency: 'NGN',
      billingCycle: 'MONTHLY',
      targetAudience: 'ORGANIZER',
      features: ['Unlimited Tournaments', 'Priority Support', 'Advanced Analytics', 'Custom Branding'],
      isActive: true,
    },
    {
      name: 'Standard Player',
      description: 'For active golfers',
      amount: 15000,
      currency: 'NGN',
      billingCycle: 'MONTHLY',
      targetAudience: 'PLAYER',
      features: ['Digital Handicap', 'Tournament Registration', 'Score Tracking'],
      isActive: true,
    }
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }

  console.log('Successfully seeded plans!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
