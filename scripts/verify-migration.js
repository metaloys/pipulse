import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyMigration() {
  try {
    console.log('🔍 Checking if parentTaskId column exists...\n');

    // Try to query with parentTaskId field
    const { data, error } = await supabase
      .from('Task')
      .select('id, title, parentTaskId')
      .limit(1)
      .single();

    if (error && error.code === 'PGRST116') {
      console.log('📭 No tasks found, but that\'s OK');
      console.log('✅ parentTaskId column exists (no column error)');
      process.exit(0);
    }

    if (error) {
      if (error.message.includes('parentTaskId')) {
        console.log('❌ ERROR: parentTaskId column still does not exist');
        console.log('   Details:', error.message);
        process.exit(1);
      } else {
        console.log('⚠️  Other error:', error.message);
        process.exit(1);
      }
    }

    if (data) {
      console.log('✅ SUCCESS! parentTaskId column exists');
      console.log('   Sample task:', {
        id: data.id,
        title: data.title,
        parentTaskId: data.parentTaskId,
      });
      process.exit(0);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

verifyMigration();
