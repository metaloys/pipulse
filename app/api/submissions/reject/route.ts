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
    const { submissionId, reason } = await request.json();

    if (!submissionId) {
      return NextResponse.json(
        { error: 'Missing submissionId' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    // Update submission status to REJECTED with reason
    const { data: submissionData, error: submissionError } = await supabase
      .from('Submission')
      .update({
        status: 'REJECTED',
        rejectionReason: reason || null,
        reviewedAt: now,
        updatedAt: now,
      })
      .eq('id', submissionId)
      .select()
      .single();

    if (submissionError || !submissionData) {
      return NextResponse.json(
        { error: 'Failed to reject submission' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Submission rejected successfully',
        submission: submissionData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Submission rejection error:', error);
    return NextResponse.json(
      { error: 'Failed to reject submission', details: String(error) },
      { status: 500 }
    );
  }
}
