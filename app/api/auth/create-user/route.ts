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
      return NextResponse.json({ error: 'Missing piUid or piUsername' }, { status: 400 });
    }

    // Check by id
    const { data: byId } = await supabase
      .from('User')
      .select('*')
      .eq('id', piUid)
      .maybeSingle();

    if (byId) {
      return NextResponse.json({ user: byId }, { status: 200 });
    }

    // Check by piUsername
    const { data: byUsername } = await supabase
      .from('User')
      .select('*')
      .eq('piUsername', piUsername)
      .maybeSingle();

    if (byUsername) {
      return NextResponse.json({ user: byUsername }, { status: 200 });
    }

    // Create new user - include ALL required columns
    const { data: newUser, error: insertError } = await supabase
      .from('User')
      .insert([{
        id: piUid,
        piUid: piUid,
        piUsername: piUsername,
        userRole: 'worker',
        level: 'Newcomer',
        currentStreak: 0,
        longestStreak: 0,
        totalEarnings: 0,
        totalTasksCompleted: 0,
      }])
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('Insert error:', JSON.stringify(insertError));
      return NextResponse.json(
        { error: insertError.message, details: insertError },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: newUser }, { status: 200 });

  } catch (error) {
    console.error('Unexpected error:', String(error));
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
