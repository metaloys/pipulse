/**
 * Notification Bell Component
 * Shows unread notification count and dropdown menu
 * 
 * Features:
 * - Real-time unread count
 * - Dropdown list of recent notifications
 * - Mark as read functionality
 * - Link to full notification center
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  getUnreadNotificationCount,
  getUnreadNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeToNotifications,
} from '@/lib/database';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  related_task_id?: string;
  related_submission_id?: string;
}

export function NotificationBell({ userId }: { userId: string }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  // Load unread count and notifications
  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      try {
        const count = await getUnreadNotificationCount(userId);
        setUnreadCount(count);

        const unreadNotifs = await getUnreadNotifications(userId, 10);
        setNotifications(unreadNotifs);
      } catch (error) {
        console.error('Error loading notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Subscribe to real-time updates
    const subscription = subscribeToNotifications(userId, (newNotif) => {
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [userId]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'submission_approved':
        return '✅';
      case 'submission_rejected':
        return '❌';
      case 'revision_requested':
        return '🔄';
      case 'payment_received':
        return '💰';
      case 'dispute_resolved':
        return '⚖️';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="ghost"
        size="icon"
        className="relative"
      >
        <Bell className="h-5 w-5" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-slate-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="px-4 py-8 text-center text-slate-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500">
                No notifications yet
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`px-4 py-3 border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer ${
                    !notif.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </span>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">
                        {notif.title}
                      </p>
                      <p className="text-slate-600 text-sm line-clamp-2 mt-1">
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-2">
                        {new Date(notif.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    {!notif.is_read && (
                      <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
            <a
              href="/notifications"
              className="text-sm font-medium text-blue-600 hover:text-blue-700 block text-center"
            >
              View all notifications →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
