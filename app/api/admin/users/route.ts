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

    const { data: users, error } = await supabase
      .from('users')
      .select('id, piUsername, piWalletAddress, totalEarnings, totalTasksCompleted, role, status, createdAt')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(users || [], { status: 200 });
  } catch (error) {
    console.error('Users fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load users' },
      { status: 500 }
    );
  }
}
