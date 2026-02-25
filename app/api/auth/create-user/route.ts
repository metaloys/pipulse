import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }

    const supabase = createClient(url, key);
    const { piUid, piUsername } = await request.json();

    if (!piUid || !piUsername) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from('User')
      .select('*')
      .or(`id.eq.${piUid},piUsername.eq.${piUsername}`)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ user: existing }, { status: 200 });
    }

    const { data: newUser, error: insertError } = await supabase
      .from('User')
      .insert([{
  id: piUid,
  piUid: piUid,
  piUsername: piUsername,
  userRole: 'worker',
  level: 'NEWCOMER',
  currentStreak: 0,
  longestStreak: 0,
  totalEarnings: 0,
  totalTasksCompleted: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}])
      .select()
      .maybeSingle();

    if (insertError) {
      return NextResponse.json(
        { error: insertError.message, code: insertError.code },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: newUser }, { status: 200 });

  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
