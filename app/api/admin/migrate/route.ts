import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Security check - verify admin password
    const body = await request.json();
    if (!body.adminPassword || body.adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    console.log('🔄 Executing migration: add parentTaskId column...');

    // Step 1: Check if column already exists
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'Task')
      .eq('column_name', 'parentTaskId');

    if (!checkError && columns && columns.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Column parentTaskId already exists',
      });
    }

    // Step 2: Try direct SQL execution using raw query
    // Note: Supabase doesn't expose raw SQL execution directly, so we'll use a workaround
    
    // Try to insert a dummy task with null parentTaskId to trigger error and see if column exists
    const { error: insertError } = await supabase
      .from('Task')
      .insert({
        title: 'test-migration-check',
        description: 'test',
        category: 'app-testing',
        instructions: 'test',
        proofType: 'TEXT',
        piReward: 1,
        slotsAvailable: 1,
        slotsRemaining: 1,
        taskStatus: 'AVAILABLE',
        employerId: '00000000-0000-0000-0000-000000000000',
        parentTaskId: null, // Test if column exists
        deadline: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError && insertError.message.includes('parentTaskId')) {
      // Column doesn't exist - this is expected
      console.log('⚠️  Column parentTaskId does not exist yet');
      console.log('   This needs to be added manually via Supabase SQL editor');
      console.log('   SQL: ALTER TABLE "Task" ADD COLUMN "parentTaskId" TEXT;');
      
      return NextResponse.json({
        success: false,
        error: 'Column parentTaskId does not exist in database',
        instruction: 'Please execute the following SQL in Supabase SQL editor:',
        sql: `
          ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "parentTaskId" TEXT;
          ALTER TABLE "Task" ADD CONSTRAINT "Task_parentTaskId_fkey" FOREIGN KEY ("parentTaskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          CREATE INDEX IF NOT EXISTS "Task_parentTaskId_idx" ON "Task"("parentTaskId");
        `,
      }, { status: 400 });
    }

    if (insertError && insertError.code !== 'PGRST204') {
      throw insertError;
    }

    // Column exists! Delete the test record if it was created
    const { data: testRecord } = await supabase
      .from('Task')
      .select('id')
      .eq('title', 'test-migration-check')
      .maybeSingle();

    if (testRecord) {
      await supabase
        .from('Task')
        .delete()
        .eq('id', testRecord.id);
    }

    return NextResponse.json({
      success: true,
      message: 'parentTaskId column exists and is ready to use',
    });
  } catch (error) {
    console.error('❌ Migration check failed:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        instruction: 'Execute this SQL in Supabase dashboard: ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "parentTaskId" TEXT;',
      },
      { status: 500 }
    );
  }
}
