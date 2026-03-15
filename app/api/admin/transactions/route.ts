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

    // Fetch transactions
    const { data: transactions, error } = await supabase
      .from('Transaction')
      .select(`
        id,
        sender_id,
        receiver_id,
        amount,
        pipulse_fee,
        transaction_type,
        transaction_status,
        pi_blockchain_txid,
        timestamp,
        created_at,
        task_id
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data: transactions || [] }, { status: 200 });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load transactions', data: [] },
      { status: 500 }
    );
  }
}
