/**
 * Seed Test Tasks for Week 3
 * 
 * This script seeds the database with test tasks for worker browse flow testing.
 * Run with: node seed-test-tasks.js
 */

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Simple CUID-like generator
function generateId() {
  return 'c' + crypto.randomBytes(8).toString('hex');
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedTestTasks() {
  try {
    console.log('🌱 Starting test task seed...\n');

    // Step 1: Get or create test employer
    console.log('📋 Step 1: Finding/creating test employer...');
    let { data: employers, error: employerError } = await supabase
      .from('User')
      .select('id, piUsername, userRole')
      .eq('userRole', 'employer')
      .limit(1);

    if (employerError) throw employerError;

    let employerId;
    if (employers && employers.length > 0) {
      employerId = employers[0].id;
      console.log(`✅ Using existing employer: ${employers[0].piUsername} (${employerId})\n`);
    } else {
      console.log('⚠️ No employer found. Creating test employer...');
      const { data: newEmployer, error: createError } = await supabase
        .from('User')
        .insert([{
          id: generateId(),
          piUid: `test-employer-${Date.now()}`,
          piUsername: `testemployer${Date.now()}`,
          userRole: 'employer',
          level: 'ESTABLISHED',
          status: 'ACTIVE',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }])
        .select()
        .single();

      if (createError) throw createError;
      employerId = newEmployer.id;
      console.log(`✅ Created test employer: ${newEmployer.piUsername}\n`);
    }

    // Step 2: Insert test tasks
    console.log('📝 Step 2: Inserting test tasks...');
    const testTasks = [
      {
        id: generateId(),
        title: 'Test Survey Task',
        description: 'Complete a short survey about Pi Network adoption and usage',
        category: 'SURVEY',
        instructions: '1. Answer all questions honestly\n2. Take approximately 5 minutes\n3. Submit your responses',
        proofType: 'TEXT',
        piReward: 0.1,
        timeEstimate: 5,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        slotsAvailable: 5,
        slotsRemaining: 5,
        taskStatus: 'available',
        employerId: employerId,
      },
      {
        id: generateId(),
        title: 'App Testing - Pi Wallet UI',
        description: 'Test the Pi Wallet interface and report any UX issues',
        category: 'APP_TESTING',
        instructions: '1. Download Pi app from App Store\n2. Navigate through wallet screens\n3. Test transaction flow\n4. Report any bugs or issues\n5. Take screenshots of any problems',
        proofType: 'PHOTO',
        piReward: 0.25,
        timeEstimate: 30,
        deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        slotsAvailable: 3,
        slotsRemaining: 3,
        taskStatus: 'available',
        employerId: employerId,
      },
      {
        id: generateId(),
        title: 'Content Review - Pi Network Blog',
        description: 'Review and provide feedback on Pi Network blog post drafts',
        category: 'CONTENT_REVIEW',
        instructions: '1. Read the provided blog post\n2. Check for:\n   - Grammar and spelling\n   - Clarity and flow\n   - Technical accuracy\n3. Provide detailed feedback in the review form',
        proofType: 'TEXT',
        piReward: 0.15,
        timeEstimate: 20,
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
        slotsAvailable: 10,
        slotsRemaining: 10,
        taskStatus: 'available',
        employerId: employerId,
      },
    ];

    const { data: insertedTasks, error: insertError } = await supabase
      .from('Task')
      .insert(testTasks.map(t => ({
        ...t,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })))
      .select();

    if (insertError) throw insertError;

    console.log(`✅ Successfully inserted ${insertedTasks.length} test tasks\n`);

    // Step 3: Display task summary
    console.log('📊 Task Summary:');
    insertedTasks.forEach((task, idx) => {
      console.log(`\n${idx + 1}. ${task.title}`);
      console.log(`   ID: ${task.id}`);
      console.log(`   Category: ${task.category}`);
      console.log(`   Reward: ${task.piReward}π`);
      console.log(`   Slots: ${task.slotsRemaining}/${task.slotsAvailable}`);
      console.log(`   Deadline: ${task.deadline}`);
    });

    console.log('\n✅ Task seeding complete!');
    console.log('\n🧪 Test in Pi Browser:');
    console.log('1. Open http://localhost:3000 in Pi Browser');
    console.log('2. Authenticate with a worker account');
    console.log('3. Browse the "Available Tasks" section');
    console.log('4. Verify the seeded tasks appear\n');

  } catch (error) {
    console.error('❌ Error seeding tasks:', error);
    process.exit(1);
  }
}

seedTestTasks();
