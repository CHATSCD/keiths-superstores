import { NextRequest } from 'next/server';
import { queryOne } from '@/lib/db';
import { withAuth, apiOk, apiError, parseBody } from '@/lib/apiMiddleware';
import { hashPassword } from '@/lib/auth';

// GET /api/users/:id
export const GET = withAuth(async (req, auth, ctx) => {
  const id = ctx?.params?.id;
  // Employees can only view themselves
  if (auth.role === 'employee' && id !== auth.userId) return apiError('Forbidden', 403);
  const user = await queryOne(
    'SELECT id, name, email, role, store_id, active, created_at FROM users WHERE id = $1',
    [id]
  );
  if (!user) return apiError('User not found', 404);
  return apiOk({ user });
}, 'admin', 'manager', 'employee');

// PUT /api/users/:id
export const PUT = withAuth(async (req, auth, ctx) => {
  const id = ctx?.params?.id;
  if (auth.role === 'employee' && id !== auth.userId) return apiError('Forbidden', 403);

  const body = await parseBody<{
    name?: string; email?: string; password?: string; role?: string; active?: boolean;
  }>(req);
  if (!body) return apiError('Invalid body');

  const sets: string[] = [];
  const vals: unknown[] = [];

  if (body.name) { vals.push(body.name); sets.push(`name = $${vals.length}`); }
  if (body.email) { vals.push(body.email.toLowerCase().trim()); sets.push(`email = $${vals.length}`); }
  if (body.password) {
    const hash = await hashPassword(body.password);
    vals.push(hash); sets.push(`password_hash = $${vals.length}`);
  }
  // Only admin can change role or active status
  if (auth.role === 'admin') {
    if (body.role) { vals.push(body.role); sets.push(`role = $${vals.length}`); }
    if (body.active !== undefined) { vals.push(body.active); sets.push(`active = $${vals.length}`); }
  }

  if (!sets.length) return apiError('No valid fields to update');
  vals.push(id);

  const user = await queryOne(
    `UPDATE users SET ${sets.join(', ')} WHERE id = $${vals.length} RETURNING id, name, email, role, store_id, active`,
    vals
  );
  return apiOk({ user });
}, 'admin', 'manager', 'employee');

// DELETE /api/users/:id — admin only (soft delete via active=false)
export const DELETE = withAuth(async (req, auth, ctx) => {
  const id = ctx?.params?.id;
  if (id === auth.userId) return apiError('Cannot deactivate yourself');
  await queryOne('UPDATE users SET active = FALSE WHERE id = $1', [id]);
  return apiOk({ success: true });
}, 'admin');
