import { NextRequest } from 'next/server';
import { queryOne, query } from '@/lib/db';
import { withAuth, apiOk, apiError, parseBody } from '@/lib/apiMiddleware';

type Ctx = { params: { id: string } };

// GET /api/shifts/:id
export const GET = withAuth(async (req: NextRequest, auth, ctx?: { params: Record<string, string> }) => {
  const id = ctx?.params?.id;
  const shift = await queryOne(
    `SELECT s.*, u.name AS assigned_name, u.email AS assigned_email,
       wl.id AS wl_id
     FROM shifts s
     LEFT JOIN users u ON u.id = s.assigned_user_id
     WHERE s.id = $1 AND s.store_id = $2`,
    [id, auth.storeId]
  );
  if (!shift) return apiError('Shift not found', 404);

  const wasteLogs = await query(
    'SELECT wl.*, u.name AS logged_by_name FROM waste_logs wl LEFT JOIN users u ON u.id = wl.logged_by WHERE wl.shift_id = $1 ORDER BY wl.created_at',
    [id]
  );
  const productionLogs = await query(
    'SELECT pl.*, u.name AS logged_by_name FROM production_logs pl LEFT JOIN users u ON u.id = pl.logged_by WHERE pl.shift_id = $1 ORDER BY pl.created_at',
    [id]
  );

  return apiOk({ shift, wasteLogs, productionLogs });
}, 'admin', 'manager', 'employee');

// PUT /api/shifts/:id
export const PUT = withAuth(async (req: NextRequest, auth, ctx?: { params: Record<string, string> }) => {
  const id = ctx?.params?.id;
  const existing = await queryOne<{ status: string; store_id: string }>(
    'SELECT status, store_id FROM shifts WHERE id = $1', [id]
  );
  if (!existing) return apiError('Shift not found', 404);
  if (existing.store_id !== auth.storeId && auth.role !== 'admin') return apiError('Forbidden', 403);
  if (existing.status === 'locked') return apiError('Shift is locked', 409);

  const body = await parseBody<Record<string, unknown>>(req);
  if (!body) return apiError('Invalid body');

  const allowed = ['date','start_time','end_time','role_required','station','notes','event_flag','event_note'];
  const sets: string[] = [];
  const vals: unknown[] = [];
  for (const key of allowed) {
    if (key in body) {
      vals.push(body[key]);
      sets.push(`${key} = $${vals.length}`);
    }
  }
  if (!sets.length) return apiError('No valid fields to update');

  vals.push(id);
  const shift = await queryOne(
    `UPDATE shifts SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${vals.length} RETURNING *`,
    vals
  );
  return apiOk({ shift });
}, 'admin', 'manager');

// DELETE /api/shifts/:id
export const DELETE = withAuth(async (req: NextRequest, auth, ctx?: { params: Record<string, string> }) => {
  const id = ctx?.params?.id;
  const existing = await queryOne<{ status: string; store_id: string }>(
    'SELECT status, store_id FROM shifts WHERE id = $1', [id]
  );
  if (!existing) return apiError('Shift not found', 404);
  if (existing.status === 'locked') return apiError('Cannot delete locked shift', 409);

  await query('DELETE FROM shifts WHERE id = $1', [id]);
  return apiOk({ success: true });
}, 'admin');
