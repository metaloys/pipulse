// Check user roles in database
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://jwkysjidtkzriodgiydj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3a3lzamlkdGt6cmlvZGdpeWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTY5NzMxOCwiZXhwIjoyMDg3MjczMzE4fQ.XCPAyqe3zAYy_3e8d1WAeduYIZnRJ4AwfA17o2ZQJzU'
);

async function checkUsers() {
  const { data, error } = await supabase
    .from('User')
    .select('id, userRole, piUsername')
    .limit(5);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample users:');
    console.log(JSON.stringify(data, null, 2));
  }
}

checkUsers();
