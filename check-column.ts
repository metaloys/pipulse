import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing env vars:');
  console.log('   SUPABASE_URL:', supabaseUrl);
  console.log('   SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '***' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumn() {
  try {
    const { data, error } = await supabase
      .from('Task')
      .select('id, title, parentTaskId')
      .limit(1)
      .maybeSingle();

    if (error && error.message.includes('parentTaskId')) {
      console.log('❌ Column parentTaskId does NOT exist yet');
      console.log('Error:', error.message);
      process.exit(1);
    }
    
    if (error) {
      console.log('⚠️  Other error:', error.message);
    } else {
      console.log('✅ parentTaskId column EXISTS!');
      console.log('Sample result:', data ? { id: data.id, title: data.title, parentTaskId: data.parentTaskId } : 'No tasks');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  process.exit(0);
}

checkColumn();
