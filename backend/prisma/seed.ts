import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: 'demo@cal.com' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@cal.com',
      timezone: 'UTC',
    },
  });

  console.log('✅ Created user:', user.email);

  // Create event types
  await prisma.eventType.upsert({
    where: { slug: '30min' },
    update: {},
    create: {
      userId: user.id,
      title: '30 Minute Meeting',
      description: 'A quick 30-minute meeting to discuss your needs.',
      duration: 30,
      slug: '30min',
      isActive: true,  // ← ADD THIS LINE
    },
  });

  await prisma.eventType.upsert({
    where: { slug: '60min' },
    update: {},
    create: {
      userId: user.id,
      title: '60 Minute Meeting',
      description: 'In-depth consultation session to explore opportunities.',
      duration: 60,
      slug: '60min',
      isActive: true,  // ← ADD THIS LINE
    },
  });

  console.log('✅ Created event types');

  // Create availability (Monday to Friday, 9 AM - 5 PM)
  const days = [1, 2, 3, 4, 5]; // 1=Monday, 5=Friday
  
  for (const day of days) {
    await prisma.availability.upsert({
      where: {
        userId_dayOfWeek: {
          userId: user.id,
          dayOfWeek: day,
        },
      },
      update: {},
      create: {
        userId: user.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00',
        timezone: 'UTC',
      },
    });
  }

  console.log('✅ Created availability (Mon-Fri, 9 AM - 5 PM)');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
