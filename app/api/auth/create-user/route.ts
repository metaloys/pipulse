import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  try {
    const { piUid, piUsername } = await request.json();

    if (!piUid || !piUsername) {
      return NextResponse.json(
        { error: 'Missing piUid or piUsername' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Check if user exists by id
    const { data: existingById } = await supabase
      .from('User')
      .select('*')
      .eq('id', piUid)
      .maybeSingle();

    if (existingById) {
      return NextResponse.json({ user: existingById }, { status: 200 });
    }

    // Check if user exists by username
    const { data: existingByUsername } = await supabase
      .from('User')
      .select('*')
      .eq('piUsername', piUsername)
      .maybeSingle();

    if (existingByUsername) {
      return NextResponse.json({ user: existingByUsername }, { status: 200 });
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('User')
      .insert([{
        id: piUid,
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

    if (error) {
      console.error('Error creating user:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: newUser }, { status: 200 });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
