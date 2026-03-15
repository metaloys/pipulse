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
      .from('Submission')
      .select(`
        id,
        task_id,
        worker_id,
        submission_status,
        submission_type,
        proof_content,
        submitted_at,
        reviewed_at,
        rejection_reason,
        employer_notes
      `)
      .order('submitted_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: submissions || [] }, { status: 200 });
  } catch (error) {
    console.error('Submissions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load submissions', data: [] },
      { status: 500 }
    );
  }
}
