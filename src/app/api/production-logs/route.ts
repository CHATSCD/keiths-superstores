import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { withAuth, apiOk, apiError, parseBody } from '@/lib/apiMiddleware';

// GET /api/production-logs?shiftId=...
export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const shiftId = searchParams.get('shiftId');
  if (!shiftId) return apiError('shiftId required');

  const logs = await query(
    `SELECT pl.*, u.name AS logged_by_name
     FROM production_logs pl
     LEFT JOIN users u ON u.id = pl.logged_by
     WHERE pl.shift_id = $1 ORDER BY pl.created_at`,
    [shiftId]
  );
  return apiOk({ logs });
}, 'admin', 'manager', 'employee');

// POST /api/production-logs
export const POST = withAuth(async (req, auth) => {
  const body = await parseBody<{
    shiftId: string; itemName: string; quantityProduced: number; cost?: number;
  }>(req);
  if (!body?.shiftId || !body?.itemName || body.quantityProduced == null) {
    return apiError('shiftId, itemName, quantityProduced required');
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
    `INSERT INTO production_logs (shift_id, item_name, quantity_produced, cost, logged_by)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [body.shiftId, body.itemName, body.quantityProduced, body.cost || 0, auth.userId]
  );

  // Update shift production_total
  await queryOne(
    'UPDATE shifts SET production_total = (SELECT COALESCE(SUM(quantity_produced),0) FROM production_logs WHERE shift_id=$1), updated_at=NOW() WHERE id=$1',
    [body.shiftId]
  );

  return apiOk({ log }, 201);
}, 'admin', 'manager', 'employee');
