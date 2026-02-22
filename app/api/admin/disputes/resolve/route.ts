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
    const { disputeId, decision, notes } = await request.json();

    if (!disputeId || !decision || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('disputes')
      .update({
        status: 'resolved',
        admin_decision: decision,
        admin_notes: notes,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', disputeId);

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Dispute resolved' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Dispute resolution error:', error);
    return NextResponse.json(
      { error: 'Failed to resolve dispute' },
      { status: 500 }
    );
  }
}
