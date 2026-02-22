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

    const { data: disputes, error } = await supabase
      .from('disputes')
      .select(`
        id,
        task_id,
        complainant_id,
        respondent_id,
        complaint_type,
        reason,
        status,
        created_at,
        resolved_at,
        admin_decision,
        admin_notes,
        task:tasks(title),
        complainant:users!disputes_complainant_id_fkey(pi_username),
        respondent:users!disputes_respondent_id_fkey(pi_username)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const mapped = (disputes || []).map((d: any) => ({
      id: d.id,
      task_id: d.task_id,
      task_title: d.task?.title,
      complainant_id: d.complainant_id,
      complainant_username: d.complainant?.pi_username,
      respondent_id: d.respondent_id,
      respondent_username: d.respondent?.pi_username,
      complaint_type: d.complaint_type,
      reason: d.reason,
      status: d.status,
      created_at: d.created_at,
      resolved_at: d.resolved_at,
      admin_decision: d.admin_decision,
      admin_notes: d.admin_notes,
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error('Disputes fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load disputes' },
      { status: 500 }
    );
  }
}
