import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/payments/approve
 * 
 * Server-side payment approval using Pi Network API
 * This endpoint is called when a payment is ready for server approval
 * 
 * The Pi Network requires approval to happen server-side with the PI_API_KEY
 * which cannot be exposed in the browser frontend.
 * 
 * Request body: { paymentId: string }
 * Response: { success: boolean, message?: string, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { paymentId } = body;

    // Validate input
    if (!paymentId) {
      return NextResponse.json(
        { success: false, error: 'Missing paymentId' },
        { status: 400 }
      );
    }

    // Get the PI_API_KEY from environment variables
    const apiKey = process.env.PI_API_KEY;
    if (!apiKey) {
      console.error('❌ PI_API_KEY not configured in environment variables');
      return NextResponse.json(
        { success: false, error: 'Server misconfiguration: API key not set' },
        { status: 500 }
      );
    }

    // Call Pi Network API server-side to approve the payment
    console.log(`🔐 Approving payment server-side: ${paymentId}`);
    const piResponse = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        // POST to approve endpoint typically has no body or empty object
        body: JSON.stringify({}),
      }
    );

    // Handle Pi Network API response
    if (!piResponse.ok) {
      const errorData = await piResponse.json().catch(() => ({}));
      console.error(`❌ Pi Network API error (${piResponse.status}):`, errorData);
      
      return NextResponse.json(
        {
          success: false,
          error: `Pi Network API error: ${piResponse.status}`,
          details: errorData,
        },
        { status: piResponse.status }
      );
    }

    const approvalData = await piResponse.json();
    console.log(`✅ Payment approved successfully: ${paymentId}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Payment approved successfully',
        data: approvalData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error in approve endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
