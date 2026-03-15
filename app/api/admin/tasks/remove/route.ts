import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase configuration');
  }

  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  try {
    const { taskId } = await request.json();

    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    // Delete the task
    const { error } = await supabase
      .from('Task')
      .delete()
      .eq('id', taskId);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Task removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Task removal error:', error);
    return NextResponse.json(
      { error: 'Failed to remove task' },
      { status: 500 }
    );
  }
}
