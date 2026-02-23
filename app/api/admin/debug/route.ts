import { NextRequest, NextResponse } from 'next/server';

/**
 * DEBUG ENDPOINT: GET /api/admin/debug
 * This endpoint is ONLY for diagnosing environment variable and Supabase connectivity issues.
 * It shows what environment variables are visible at runtime.
 */
export async function GET(request: NextRequest) {
  try {
    const envVars = {
      SUPABASE_URL: process.env.SUPABASE_URL ? `✅ SET (${process.env.SUPABASE_URL.length} chars)` : '❌ MISSING',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? `✅ SET (${process.env.SUPABASE_SERVICE_ROLE_KEY.length} chars)` : '❌ MISSING',
      PI_API_KEY: process.env.PI_API_KEY ? `✅ SET (${process.env.PI_API_KEY.length} chars)` : '❌ MISSING',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ? `✅ SET (${process.env.ADMIN_PASSWORD.length} chars)` : '❌ MISSING',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? `✅ SET (${process.env.NEXT_PUBLIC_SUPABASE_URL.length} chars)` : '❌ MISSING',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? `✅ SET (${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length} chars)` : '❌ MISSING',
      NEXT_PUBLIC_PI_APP_ID: process.env.NEXT_PUBLIC_PI_APP_ID ? `✅ SET (${process.env.NEXT_PUBLIC_PI_APP_ID.length} chars)` : '❌ MISSING',
    };

    // Try to create a Supabase client
    let supabaseStatus = '❌ Not attempted';
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!url || !key) {
        supabaseStatus = '❌ Missing credentials';
      } else {
        const client = createClient(url, key);
        supabaseStatus = '✅ Client created successfully';
      }
    } catch (err) {
      supabaseStatus = `❌ Error: ${err instanceof Error ? err.message : 'Unknown error'}`;
    }

    return NextResponse.json(
      {
        status: 'debug',
        timestamp: new Date().toISOString(),
        environmentVariables: envVars,
        supabaseClientStatus: supabaseStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[DEBUG] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Debug endpoint error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
