import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import { withAuth, apiOk, apiError } from '@/lib/apiMiddleware';

// POST /api/shifts/:id/lock  — admin only, locks completed shift
export const POST = withAuth(async (req: NextRequest, auth, ctx) => {
  const id = ctx?.params?.id;
  const shift = await queryOne<{ status: string; store_id: string }>(
    'SELECT status, store_id FROM shifts WHERE id = $1', [id]
  );
  if (!shift) return apiError('Shift not found', 404);
  if (shift.status === 'locked') return apiError('Shift is already locked');
  if (shift.status !== 'completed') return apiError('Only completed shifts can be locked');

  const updated = await queryOne(
    'UPDATE shifts SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    ['locked', id]
  );
  return apiOk({ shift: updated });
}, 'admin');
