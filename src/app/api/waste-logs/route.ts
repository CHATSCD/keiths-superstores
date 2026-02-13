import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { withAuth, apiOk, apiError, parseBody } from '@/lib/apiMiddleware';

// GET /api/waste-logs?shiftId=...
export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const shiftId = searchParams.get('shiftId');
  if (!shiftId) return apiError('shiftId required');

  const logs = await query(
    `SELECT wl.*, u.name AS logged_by_name
     FROM waste_logs wl
     LEFT JOIN users u ON u.id = wl.logged_by
     WHERE wl.shift_id = $1 ORDER BY wl.created_at`,
    [shiftId]
  );
  return apiOk({ logs });
}, 'admin', 'manager', 'employee');

// POST /api/waste-logs
export const POST = withAuth(async (req, auth) => {
  const body = await parseBody<{
    shiftId: string; itemName: string; quantity: number;
    reason?: string; cost?: number;
  }>(req);
  if (!body?.shiftId || !body?.itemName || body.quantity == null) {
    return apiError('shiftId, itemName, quantity required');
  }

  const shift = await queryOne<{ id: string; status: string; assigned_user_id: string }>(
    'SELECT id, status, assigned_user_id FROM shifts WHERE id = $1', [body.shiftId]
  );
  if (!shift) return apiError('Shift not found', 404);
  if (shift.status === 'locked') return apiError('Shift is locked');
  if (shift.assigned_user_id !== auth.userId && auth.role === 'employee') {
    return apiError('Forbidden', 403);
  }

  const log = await queryOne(
    `INSERT INTO waste_logs (shift_id, item_name, quantity, reason, cost, logged_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [body.shiftId, body.itemName, body.quantity, body.reason || null, body.cost || 0, auth.userId]
  );

  // Update shift waste_total
  await queryOne(
    'UPDATE shifts SET waste_total = (SELECT COALESCE(SUM(quantity),0) FROM waste_logs WHERE shift_id=$1), updated_at=NOW() WHERE id=$1',
    [body.shiftId]
  );

  return apiOk({ log }, 201);
}, 'admin', 'manager', 'employee');
