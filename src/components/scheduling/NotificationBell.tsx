'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X } from 'lucide-react';
import { notificationsApi } from '@/lib/apiClient';
import { Notification } from '@/types/scheduling';

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const data = await notificationsApi.list() as { notifications: Notification[]; unreadCount: number };
      setNotifications(data.notifications);
      setUnread(data.unreadCount);
    } catch { /* not authenticated yet */ }
  }

  useEffect(() => { load(); const t = setInterval(load, 30000); return () => clearInterval(t); }, []);

  async function openPanel() {
    setOpen(true);
    if (unread > 0) {
      await notificationsApi.markAllRead();
      setUnread(0);
      setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
    }
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={openPanel} className="relative p-1.5 hover:bg-white/10 rounded-lg">
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <button onClick={() => setOpen(false)}><X className="h-4 w-4 text-gray-400" /></button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y">
            {notifications.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-8">No notifications</p>
            )}
            {notifications.map((n) => (
              <div key={n.id} className={`px-4 py-3 ${n.read ? 'bg-white' : 'bg-blue-50'}`}>
                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                {n.message && <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>}
                <p className="text-[10px] text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
