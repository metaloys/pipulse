import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { SwitchRoleSchema, validateRequest } from '@/lib/validators';

/**
 * Switch user role between WORKER and EMPLOYER
 * POST /api/auth/switch-role
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('📥 Switch role request:', { userId: body.userId });

    // Validate input
    const validation = validateRequest(SwitchRoleSchema, body);
    if (!validation.success) {
      console.error('❌ Validation error:', validation.error);
      return NextResponse.json({ error: 'Invalid input: ' + validation.error }, { status: 400 });
    }

    const { userId, newRole } = validation.data;

    // Fetch user and verify exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      console.error('❌ User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update role
    console.log(`🔄 Switching role for user ${userId}:`, { from: user.userRole, to: newRole });
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { userRole: newRole },
    });

    console.log('✅ Role switched successfully:', {
      userId: updatedUser.id,
      newRole: updatedUser.userRole,
    });

    return NextResponse.json({ 
      success: true,
      user: updatedUser,
    }, { status: 200 });

  } catch (error) {
    console.error('❌ Error switching role:', error);
    return NextResponse.json(
      { error: 'Failed to switch role', details: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}
