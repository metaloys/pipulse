/**
 * Notifications API
 * 
 * Endpoints:
 * GET /api/notifications - Get user's notifications
 * GET /api/notifications/unread - Get unread count
 * PUT /api/notifications/:id/read - Mark as read
 * PUT /api/notifications/mark-all-read - Mark all as read
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getNotifications,
  getUnreadNotificationCount,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '@/lib/database';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (unreadOnly) {
      const notifications = await getUnreadNotifications(userId, limit);
      return NextResponse.json({ notifications });
    }

    const notifications = await getNotifications(userId, limit, offset);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/notifications/unread
 * Get unread notification count
 */
export async function getUnreadCount(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing user ID' },
        { status: 401 }
      );
    }

    const count = await getUnreadNotificationCount(userId);
    return NextResponse.json({ unreadCount: count });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
