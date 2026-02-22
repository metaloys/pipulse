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
      .from('tasks')
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
        created_at,
        is_featured,
        employer:users!tasks_employer_id_fkey(pi_username)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (tasks || []).map((t: any) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      pi_reward: t.pi_reward,
      slots_available: t.slots_available,
      slots_remaining: t.slots_remaining,
      task_status: t.task_status,
      deadline: t.deadline,
      employer_id: t.employer_id,
      employer_username: t.employer?.pi_username,
      created_at: t.created_at,
      is_featured: t.is_featured || false,
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error('Tasks fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load tasks' },
      { status: 500 }
    );
  }
}
