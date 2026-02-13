import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { withAuth, apiOk, apiError, parseBody } from '@/lib/apiMiddleware';

// POST /api/shifts/:id/approve  { action: 'approve' | 'deny' }
export const POST = withAuth(async (req: NextRequest, auth, ctx) => {
  const id = ctx?.params?.id;
  const body = await parseBody<{ action: 'approve' | 'deny' }>(req);
  if (!body?.action) return apiError('action required (approve|deny)');

  const shift = await queryOne<{
    id: string; status: string; claimed_by: string; store_id: string;
  }>('SELECT * FROM shifts WHERE id = $1', [id]);

  if (!shift) return apiError('Shift not found', 404);
  if (shift.store_id !== auth.storeId && auth.role !== 'admin') return apiError('Forbidden', 403);
  if (shift.status !== 'pending') return apiError('Shift is not pending approval');

  if (body.action === 'approve') {
    await queryOne(
      `UPDATE shifts SET
         status = 'approved',
         assigned_user_id = claimed_by,
         approved_by = $1,
         updated_at = NOW()
       WHERE id = $2`,
      [auth.userId, id]
    );
    if (shift.claimed_by) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, shift_id)
         VALUES ($1, 'shift_approved', 'Shift Approved', 'Your shift claim was approved.', $2)`,
        [shift.claimed_by, id]
      );
    }
  } else {
    await queryOne(
      `UPDATE shifts SET
         status = 'unassigned',
         claimed_by = NULL,
         updated_at = NOW()
       WHERE id = $1`,
      [id]
    );
    if (shift.claimed_by) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, shift_id)
         VALUES ($1, 'shift_denied', 'Shift Denied', 'Your shift claim was denied.', $2)`,
        [shift.claimed_by, id]
      );
    }
  }

  const updated = await queryOne('SELECT * FROM shifts WHERE id = $1', [id]);
  return apiOk({ shift: updated });
}, 'admin', 'manager');
