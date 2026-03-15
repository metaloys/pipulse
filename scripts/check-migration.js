import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMigration() {
  try {
    // Try to query a simple field from Task to see if parentTaskId is there
    const { data, error } = await supabase
      .from('Task')
      .select('id, parentTaskId')
      .limit(1);

    if (error) {
      // If error contains "parentTaskId", it means column doesn't exist
      if (error.message.includes('parentTaskId') || error.code === 'PGRST204') {
        console.log('❌ Column parentTaskId does not exist yet');
        console.log('📋 Error:', error.message);
        
        // Try executing SQL via Supabase REST API with direct HTTP call
        console.log('\n🔄 Attempting direct SQL execution...');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
          {
            method: 'POST',
            headers: {
              'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
              'X-Client-Info': 'supabase-js/2.0',
            },
            body: JSON.stringify({
              query: `
                ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "parentTaskId" TEXT;
                ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
                CREATE INDEX IF NOT EXISTS "Task_parentTaskId_idx" ON "Task"("parentTaskId");
              `
            })
          }
        );
        console.log('Response:', response.status);
      } else {
        console.log('⚠️  Error:', error.message);
      }
    } else {
      console.log('✅ parentTaskId column exists!');
      console.log('Sample data:', data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }

  process.exit(0);
}

checkMigration();
