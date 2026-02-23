import { NextRequest, NextResponse } from 'next/server';
import {
  serverGetAllPlatformSettings,
  serverUpdatePlatformSetting,
} from '@/lib/database-server';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change_me';

/**
 * GET /api/admin/settings
 * Fetch all platform settings
 * Requires: x-admin-password header
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin password
    const adminPassword = request.headers.get('x-admin-password');
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await serverGetAllPlatformSettings();

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error in GET /api/admin/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/settings
 * Update platform settings
 * Requires: x-admin-password header
 * Body: { key: string, value: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin password
    const adminPassword = request.headers.get('x-admin-password');
    if (!adminPassword || adminPassword !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { key, value } = body;

    if (!key || !value) {
      return NextResponse.json(
        { error: 'Missing key or value' },
        { status: 400 }
      );
    }

    const success = await serverUpdatePlatformSetting(key, value);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update setting' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Setting ${key} updated`,
    });
  } catch (error) {
    console.error('Error in POST /api/admin/settings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
