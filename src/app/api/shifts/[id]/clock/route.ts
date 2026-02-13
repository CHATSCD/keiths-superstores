import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { withAuth, apiOk, apiError, parseBody } from '@/lib/apiMiddleware';

// POST /api/shifts/:id/clock  { action: 'in' | 'out' }
export const POST = withAuth(async (req: NextRequest, auth, ctx) => {
  const id = ctx?.params?.id;
  const body = await parseBody<{ action: 'in' | 'out' }>(req);
  if (!body?.action) return apiError('action required (in|out)');

  const shift = await queryOne<{
    id: string; status: string; assigned_user_id: string;
    clock_in: string | null; clock_out: string | null;
  }>('SELECT * FROM shifts WHERE id = $1', [id]);

  if (!shift) return apiError('Shift not found', 404);
  if (shift.assigned_user_id !== auth.userId && auth.role === 'employee') {
    return apiError('Forbidden — this is not your shift', 403);
  }
  if (shift.status === 'locked') return apiError('Shift is locked');

  if (body.action === 'in') {
    if (shift.clock_in) return apiError('Already clocked in');
    if (shift.status !== 'approved') return apiError('Shift must be approved before clocking in');
    await queryOne('UPDATE shifts SET clock_in = NOW(), updated_at = NOW() WHERE id = $1', [id]);
  } else {
    if (!shift.clock_in) return apiError('Must clock in first');
    if (shift.clock_out) return apiError('Already clocked out');
    await queryOne(
      "UPDATE shifts SET clock_out = NOW(), status = 'completed', updated_at = NOW() WHERE id = $1",
      [id]
    );
    // Notify admins
    const admins = await query<{ id: string }>(
      "SELECT id FROM users WHERE store_id = $1 AND role = 'admin'",
      [auth.storeId]
    );
    for (const admin of admins) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, shift_id)
         VALUES ($1, 'shift_completed', 'Shift Completed', $2, $3)`,
        [admin.id, `${auth.name} completed their shift.`, id]
      );
    }
  }

  const updated = await queryOne('SELECT * FROM shifts WHERE id = $1', [id]);
  return apiOk({ shift: updated });
}, 'admin', 'manager', 'employee');
