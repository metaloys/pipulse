/**
 * Simple seed script for SQLite
 * Runs directly with Node.js after Prisma migration
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  try {
    // Create test worker user
    const worker = await prisma.user.create({
      data: {
        piUsername: 'testworker1',
        userRole: 'WORKER',
        status: 'ACTIVE',
        totalEarnings: 0,
        totalTasksCompleted: 0,
        level: 'NEWCOMER',
        currentStreak: 0,
        longestStreak: 0,
      },
    });
    console.log('✅ Created test worker:', worker.id);

    // Create streak for worker
    await prisma.streak.create({
      data: {
        userId: worker.id,
        currentStreak: 0,
        longestStreak: 0,
      },
    });

    // Create test employer user
    const employer = await prisma.user.create({
      data: {
        piUsername: 'testemployer1',
        userRole: 'EMPLOYER',
        status: 'ACTIVE',
        totalEarnings: 0,
        totalTasksCompleted: 0,
        level: 'ESTABLISHED',
        currentStreak: 0,
        longestStreak: 0,
      },
    });
    console.log('✅ Created test employer:', employer.id);

    // Create streak for employer
    await prisma.streak.create({
      data: {
        userId: employer.id,
        currentStreak: 0,
        longestStreak: 0,
      },
    });

    // Create test tasks
    const task1 = await prisma.task.create({
      data: {
        title: 'Test App Review',
        description: 'Please review this test application thoroughly and provide feedback',
        instructions: 'Download the app, install it, test all features, and provide feedback',
        category: 'APP_TESTING',
        proofType: 'TEXT',
        piReward: 5.5,
        timeEstimate: 60,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        slotsAvailable: 3,
        slotsRemaining: 3,
        taskStatus: 'AVAILABLE',
        employerId: employer.id,
      },
    });
    console.log('✅ Created test task:', task1.id);

    const task2 = await prisma.task.create({
      data: {
        title: 'Content Review & Feedback',
        description: 'Review our new content and provide detailed feedback',
        instructions: 'Review the content document and provide written feedback',
        category: 'CONTENT_REVIEW',
        proofType: 'TEXT',
        piReward: 3.25,
        timeEstimate: 45,
        deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        slotsAvailable: 5,
        slotsRemaining: 5,
        taskStatus: 'AVAILABLE',
        employerId: employer.id,
      },
    });
    console.log('✅ Created second test task:', task2.id);

    // Create platform settings
    await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        autoApprovalHours: 48,
        slotLockMinutes: 120,
        maxRevisionAttempts: 1,
        commissionRate: 15,
      },
    });
    console.log('✅ Created platform settings');

    console.log('\n✨ Seed complete!');
    console.log(`
Test Data Created:
- Worker: testworker1 (ID: ${worker.id})
- Employer: testemployer1 (ID: ${employer.id})
- Task 1: "Test App Review" (ID: ${task1.id})
- Task 2: "Content Review & Feedback" (ID: ${task2.id})

You can now test the application with these users!
    `);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
