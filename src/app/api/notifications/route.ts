import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAuth, apiOk, apiError } from '@/lib/apiMiddleware';

// GET /api/notifications
export const GET = withAuth(async (req, auth) => {
  const notifications = await query(
    `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
    [auth.userId]
  );
  const unreadCount = (notifications as Array<{ read: boolean }>).filter((n) => !n.read).length;
  return apiOk({ notifications, unreadCount });
}, 'admin', 'manager', 'employee');

// PATCH /api/notifications — mark all read
export const PATCH = withAuth(async (req, auth) => {
  await query(
    'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
    [auth.userId]
  );
  return apiOk({ success: true });
}, 'admin', 'manager', 'employee');
