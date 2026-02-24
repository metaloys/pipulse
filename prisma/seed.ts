/**
 * Prisma Seed Script
 * 
 * Usage:
 *   npm run seed  (after running migration)
 * 
 * Creates:
 * - Test worker user (testworker1)
 * - Test employer user (testemployer1)
 * - Sample task for testing
 * 
 * Run this after: npx prisma migrate dev --name init_schema
 */

const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Seeding database...')

  try {
    // Create test worker user
    const worker = await prisma.user.create({
      data: {
        piUsername: 'testworker1',
        userRole: 'WORKER',
        status: 'ACTIVE',
        totalEarnings: 0,
        totalTasksCompleted: 0,
      },
    })
    console.log('✅ Created test worker:', worker.id)

    // Create test employer user
    const employer = await prisma.user.create({
      data: {
        piUsername: 'testemployer1',
        userRole: 'EMPLOYER',
        status: 'ACTIVE',
        totalEarnings: 0,
        totalTasksCompleted: 0,
      },
    })
    console.log('✅ Created test employer:', employer.id)

    // Create test task
    const task = await prisma.task.create({
      data: {
        title: 'Test App Review',
        description:
          'Please review this test application thoroughly and provide feedback',
        instructions:
          'Download the app, install it, test all features, and provide feedback',
        category: 'APP_TESTING',
        proofType: 'TEXT',
        piReward: 5.5,
        timeEstimate: 60,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        slotsAvailable: 3,
        slotsRemaining: 3,
        employerId: employer.id,
      },
    })
    console.log('✅ Created test task:', task.id)

    // Create platform settings
    const settings = await prisma.platformSettings.upsert({
      where: { id: 'default' },
      update: {},
      create: {
        id: 'default',
        autoApprovalHours: 48,
        slotLockMinutes: 120,
        maxRevisionAttempts: 1,
        commissionRate: 15,
      },
    })
    console.log('✅ Created platform settings')

    console.log('\n✨ Seed complete!')
    console.log(`
    Test Data Created:
    - Worker ID: ${worker.id}
    - Employer ID: ${employer.id}
    - Task ID: ${task.id}
    
    You can now:
    1. Log in with piUsername: testworker1
    2. Log in with piUsername: testemployer1
    3. View the task on the marketplace
    `)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
