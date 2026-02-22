/**
 * User Role & Mode API
 * 
 * Endpoints:
 * GET /api/user/mode - Get current user mode
 * PUT /api/user/mode - Update user mode preference
 * GET /api/user/can-access-employer - Check employer access
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  updateUserRolePreference,
  getUserCurrentMode,
  canUserAccessEmployerMode,
} from '@/lib/database';

export async function GET(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 401 }
      );
    }

    // Get current user mode
    if (pathname.includes('/mode')) {
      const mode = await getUserCurrentMode(userId);
      return NextResponse.json({ mode });
    }

    // Check employer access
    if (pathname.includes('/can-access-employer')) {
      const canAccess = await canUserAccessEmployerMode(userId);
      return NextResponse.json({ canAccessEmployer: canAccess });
    }

    return NextResponse.json(
      { error: 'Unknown endpoint' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in user GET API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 401 }
      );
    }

    // Update user mode preference
    if (pathname.includes('/mode')) {
      const body = await req.json();
      const { defaultRole, employerModeEnabled } = body;

      if (!defaultRole) {
        return NextResponse.json(
          { error: 'Missing defaultRole' },
          { status: 400 }
        );
      }

      const success = await updateUserRolePreference(userId, {
        defaultRole,
        employerModeEnabled: employerModeEnabled ?? false,
      });

      if (!success) {
        return NextResponse.json(
          { error: 'Failed to update role preference' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        message: 'Role preference updated',
        defaultRole,
        employerModeEnabled,
      });
    }

    return NextResponse.json(
      { error: 'Unknown endpoint' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error in user PUT API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
