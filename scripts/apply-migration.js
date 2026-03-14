import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🔄 Applying parentTaskId migration...');

    // Check if column exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'Task')
      .eq('column_name', 'parentTaskId');

    if (checkError) {
      console.log('❌ Error checking columns:', checkError);
    } else if (columns && columns.length > 0) {
      console.log('✅ parentTaskId column already exists');
      return;
    }

    // Execute migration SQL directly
    const migrationSQL = `
      ALTER TABLE "Task" ADD COLUMN "parentTaskId" TEXT;
      ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      CREATE INDEX "Task_parentTaskId_idx" ON "Task"("parentTaskId");
    `;

    const { error } = await supabase.rpc('exec', { sql: migrationSQL });

    if (error) {
      console.log('⚠️  Direct SQL execution skipped (method not available)');
      console.log('   This is expected - use Supabase dashboard or prisma migrate deploy');
    } else {
      console.log('✅ Migration applied successfully');
    }
  } catch (error) {
    console.error('❌ Migration error:', error.message);
  }
}

applyMigration();
