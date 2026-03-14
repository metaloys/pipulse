import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      console.error('❌ Missing env vars:', { url: !!url, key: !!key });
      return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
    }

    const supabase = createClient(url, key);
    const { piUid, piUsername } = await request.json();

    if (!piUid || !piUsername) {
      console.error('❌ Missing fields:', { piUid, piUsername });
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    console.log('🔍 Checking for existing user:', { piUid, piUsername });

    // Check if user exists by piUid first
    const { data: existingByUid, error: checkError } = await supabase
      .from('User')
      .select('*')
      .eq('piUid', piUid)
      .maybeSingle();

    if (checkError) {
      console.error('⚠️  Error checking existing user:', checkError.message);
    }

    if (existingByUid) {
      console.log('✅ User already exists by piUid:', piUid);
      return NextResponse.json({ user: existingByUid }, { status: 200 });
    }

    // Check by piUsername as fallback
    const { data: existingByUsername } = await supabase
      .from('User')
      .select('*')
      .eq('piUsername', piUsername)
      .maybeSingle();

    if (existingByUsername) {
      console.log('✅ User already exists by piUsername:', piUsername);
      return NextResponse.json({ user: existingByUsername }, { status: 200 });
    }

    console.log('➕ Creating new user:', { piUid, piUsername });

    const { data: newUser, error: insertError } = await supabase
      .from('User')
      .insert([{
        piUid: piUid,
        piUsername: piUsername,
        userRole: 'WORKER',
        level: 'NEWCOMER',
        status: 'ACTIVE',
      }])
      .select()
      .maybeSingle();

    if (insertError) {
      console.error('❌ Insert error:', {
        message: insertError.message,
        code: insertError.code,
        details: insertError.details,
        hint: insertError.hint,
      });
      return NextResponse.json(
        { 
          error: insertError.message, 
          code: insertError.code,
          details: insertError.details,
        },
        { status: 500 }
      );
    }

    console.log('✅ User created successfully:', newUser?.id);
    return NextResponse.json({ user: newUser }, { status: 200 });

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

