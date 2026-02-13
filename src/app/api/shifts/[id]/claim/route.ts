import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { withAuth, apiOk, apiError } from '@/lib/apiMiddleware';

// POST /api/shifts/:id/claim
export const POST = withAuth(async (req: NextRequest, auth, ctx) => {
  const id = ctx?.params?.id;

  const shift = await queryOne<{
    id: string; status: string; store_id: string; start_time: string;
    end_time: string; date: string; approval_required: boolean; role_required: string;
    assigned_user_id: string | null;
  }>('SELECT * FROM shifts WHERE id = $1', [id]);

  if (!shift) return apiError('Shift not found', 404);
  if (shift.store_id !== auth.storeId) return apiError('Forbidden', 403);
  if (shift.status !== 'unassigned') return apiError('Shift is not available to claim');

  // Role match check
  if (shift.role_required && shift.role_required.toLowerCase() !== auth.role.toLowerCase() && auth.role !== 'admin') {
    return apiError(`This shift requires role: ${shift.role_required}`);
  }

  // Overlap check
  const overlap = await queryOne(
    `SELECT id FROM shifts
     WHERE assigned_user_id = $1
       AND date = $2
       AND status NOT IN ('locked','completed')
       AND id != $3
       AND start_time < $5::time
       AND end_time > $4::time`,
    [auth.userId, shift.date, id, shift.start_time, shift.end_time]
  );
  if (overlap) return apiError('You already have a shift that overlaps with this time slot');

  const newStatus = shift.approval_required ? 'pending' : 'approved';
  const updated = await queryOne(
    `UPDATE shifts SET
       claimed_by = $1,
       assigned_user_id = CASE WHEN $2 = 'approved' THEN $1 ELSE assigned_user_id END,
       status = $2,
       updated_at = NOW()
     WHERE id = $3 RETURNING *`,
    [auth.userId, newStatus, id]
  );

  // Notify managers/admins
  const managers = await query<{ id: string }>(
    "SELECT id FROM users WHERE store_id = $1 AND role IN ('admin','manager')",
    [auth.storeId]
  );
  for (const mgr of managers) {
    await query(
      `INSERT INTO notifications (user_id, type, title, message, shift_id)
       VALUES ($1, 'shift_claimed', 'Shift Claimed', $2, $3)`,
      [mgr.id, `${auth.name} claimed a shift on ${shift.date}`, id]
    );
  }

  return apiOk({ shift: updated, status: newStatus });
}, 'admin', 'manager', 'employee');
