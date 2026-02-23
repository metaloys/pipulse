import { NextRequest, NextResponse } from 'next/server';
import { serverFixNegativeSlots } from '@/lib/database-server';

/**
 * POST /api/admin/cleanup/fix-slots
 * 
 * Admin-only endpoint to fix any negative slots in the database
 * This cleans up existing data where slots went negative due to the bug
 * 
 * Sets:
 * - slots_remaining = 0
 * - task_status = 'full'
 * 
 * Requires admin password in Authorization header
 */
export async function POST(request: NextRequest) {
  try {
    // Admin password verification
    const adminPassword = request.headers.get('x-admin-password');
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedPassword || adminPassword !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - invalid admin password' },
        { status: 401 }
      );
    }

    console.log('🔧 Admin cleanup endpoint: fixing negative slots...');
    const result = await serverFixNegativeSlots();

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('❌ Cleanup endpoint error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
