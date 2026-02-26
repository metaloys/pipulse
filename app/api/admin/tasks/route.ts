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

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    const { data: tasks, error } = await supabase
      .from('Task')
      .select(`
        id,
        title,
        description,
        pi_reward,
        slots_available,
        slots_remaining,
        task_status,
        deadline,
        employer_id,
        category,
        created_at,
        updated_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: tasks || [] }, { status: 200 });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load tasks', data: [] },
      { status: 500 }
    );
  }
}
