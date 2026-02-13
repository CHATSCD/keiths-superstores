import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAuth, apiOk, apiError, parseBody } from '@/lib/apiMiddleware';

// GET /api/swap-requests
export const GET = withAuth(async (req, auth) => {
  const q = auth.role === 'employee'
    ? `SELECT sr.*, s.date, s.start_time, s.end_time, u.name AS from_name, tu.name AS to_name
       FROM swap_requests sr
       JOIN shifts s ON s.id = sr.shift_id
       JOIN users u ON u.id = sr.from_user_id
       LEFT JOIN users tu ON tu.id = sr.to_user_id
       WHERE sr.from_user_id = $1 OR sr.to_user_id = $1
       ORDER BY sr.created_at DESC`
    : `SELECT sr.*, s.date, s.start_time, s.end_time, u.name AS from_name, tu.name AS to_name
       FROM swap_requests sr
       JOIN shifts s ON s.id = sr.shift_id
       JOIN users u ON u.id = sr.from_user_id
       LEFT JOIN users tu ON tu.id = sr.to_user_id
       WHERE s.store_id = $1
       ORDER BY sr.created_at DESC`;

  const param = auth.role === 'employee' ? auth.userId : auth.storeId;
  const requests = await query(q, [param]);
  return apiOk({ requests });
}, 'admin', 'manager', 'employee');

// POST /api/swap-requests
export const POST = withAuth(async (req, auth) => {
  const body = await parseBody<{ shiftId: string; toUserId?: string; message?: string }>(req);
  if (!body?.shiftId) return apiError('shiftId required');

  const shift = await queryOne<{ assigned_user_id: string }>(
    'SELECT assigned_user_id FROM shifts WHERE id = $1', [body.shiftId]
  );
  if (!shift) return apiError('Shift not found', 404);
  if (shift.assigned_user_id !== auth.userId) return apiError('You can only request swaps for your own shifts');

  const sr = await queryOne(
    `INSERT INTO swap_requests (shift_id, from_user_id, to_user_id, message)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [body.shiftId, auth.userId, body.toUserId || null, body.message || null]
  );

  // Notify managers
  const managers = await query<{ id: string }>(
    "SELECT id FROM users WHERE store_id = $1 AND role IN ('admin','manager')",
    [auth.storeId]
  );
  for (const mgr of managers) {
    await query(
      `INSERT INTO notifications (user_id, type, title, message, shift_id)
       VALUES ($1, 'swap_requested', 'Swap Requested', $2, $3)`,
      [mgr.id, `${auth.name} requested a shift swap.`, body.shiftId]
    );
  }

  return apiOk({ request: sr }, 201);
}, 'admin', 'manager', 'employee');

// PATCH /api/swap-requests — approve or deny
export const PATCH = withAuth(async (req, auth) => {
  const body = await parseBody<{ id: string; action: 'approve' | 'deny' }>(req);
  if (!body?.id || !body?.action) return apiError('id, action required');

  const sr = await queryOne<{ id: string; shift_id: string; from_user_id: string; to_user_id: string | null }>(
    'SELECT * FROM swap_requests WHERE id = $1', [body.id]
  );
  if (!sr) return apiError('Request not found', 404);

  if (body.action === 'approve' && sr.to_user_id) {
    // Reassign shift
    await queryOne(
      'UPDATE shifts SET assigned_user_id = $1, updated_at = NOW() WHERE id = $2',
      [sr.to_user_id, sr.shift_id]
    );
  }

  await queryOne(
    'UPDATE swap_requests SET status = $1, reviewed_by = $2, updated_at = NOW() WHERE id = $3',
    [body.action === 'approve' ? 'approved' : 'denied', auth.userId, body.id]
  );

  // Notify requester
  await query(
    `INSERT INTO notifications (user_id, type, title, message, shift_id)
     VALUES ($1, $2, $3, $4, $5)`,
    [
      sr.from_user_id,
      body.action === 'approve' ? 'swap_approved' : 'swap_denied',
      body.action === 'approve' ? 'Swap Approved' : 'Swap Denied',
      body.action === 'approve' ? 'Your swap request was approved.' : 'Your swap request was denied.',
      sr.shift_id,
    ]
  );

  return apiOk({ success: true });
}, 'admin', 'manager');
