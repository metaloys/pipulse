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

    // Fetch transactions with sender and receiver usernames
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        id,
        sender_id,
        receiver_id,
        amount,
        pipulse_fee,
        transaction_status,
        pi_blockchain_txid,
        created_at,
        sender:users!transactions_sender_id_fkey(pi_username),
        receiver:users!transactions_receiver_id_fkey(pi_username)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Map the response to flatten user data
    const mapped = (transactions || []).map((t: any) => ({
      id: t.id,
      sender_id: t.sender_id,
      receiver_id: t.receiver_id,
      amount: t.amount,
      pipulse_fee: t.pipulse_fee,
      transaction_status: t.transaction_status,
      pi_blockchain_txid: t.pi_blockchain_txid,
      created_at: t.created_at,
      sender_username: t.sender?.pi_username || undefined,
      receiver_username: t.receiver?.pi_username || undefined,
    }));

    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to load transactions' },
      { status: 500 }
    );
  }
}
