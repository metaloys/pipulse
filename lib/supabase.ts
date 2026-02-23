import { createClient } from '@supabase/supabase-js';

/**
 * SMART SUPABASE CLIENT INITIALIZATION
 * 
 * This client automatically uses the appropriate credentials based on context:
 * - Client-side (browser): Uses NEXT_PUBLIC keys (anon key with RLS)
 * - Server-side (API routes): Uses service role key (bypasses RLS for admin operations)
 * 
 * IMPORTANT: This ensures API routes have proper admin access while
 * client components maintain security through RLS policies.
 */

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  // Server-side context: Use service role key (bypasses RLS)
  if (typeof window === 'undefined') {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceKey) {
      throw new Error(
        'Missing SUPABASE_SERVICE_ROLE_KEY environment variable for server-side operations'
      );
    }
    console.log('🔐 Using server-side Supabase client (service role key)');
    return createClient(supabaseUrl, supabaseServiceKey);
  }

  // Client-side context: Use anon key (RLS enforced)
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  console.log('🌐 Using client-side Supabase client (anon key with RLS)');
  return createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = getSupabaseClient();
