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

    const { data: submissions, error } = await supabase
      .from('task_submissions')
      .select(`
        id,
        task_id,
        worker_id,
        status,
        proof_content,
        created_at,
        reviewed_at,
        reviewer_notes,
        task:tasks(title),
        worker:users!task_submissions_worker_id_fkey(pi_username)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (submissions || []).map((s: any) => ({
      id: s.id,
      task_id: s.task_id,
      task_title: s.task?.title,
      worker_id: s.worker_id,
      worker_username: s.worker?.pi_username,
      status: s.status,
      proof_content: s.proof_content,
      created_at: s.created_at,
      reviewed_at: s.reviewed_at,
      reviewer_notes: s.reviewer_notes,
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error('Submissions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load submissions' },
      { status: 500 }
    );
  }
}
