import { NextRequest } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { withAuth, apiOk, apiError, parseBody } from '@/lib/apiMiddleware';
import { hashPassword } from '@/lib/auth';

// GET /api/users
export const GET = withAuth(async (req, auth) => {
  const users = await query(
    `SELECT id, name, email, role, store_id, active, created_at
     FROM users WHERE store_id = $1 ORDER BY name`,
    [auth.storeId]
  );
  return apiOk({ users });
}, 'admin', 'manager');

// POST /api/users — admin only
export const POST = withAuth(async (req, auth) => {
  const body = await parseBody<{
    name: string; email: string; password: string;
    role: 'admin' | 'manager' | 'employee'; storeId?: string;
  }>(req);
  if (!body?.name || !body?.email || !body?.password || !body?.role) {
    return apiError('name, email, password, role required');
  }

  const existing = await queryOne('SELECT id FROM users WHERE email = $1', [body.email]);
  if (existing) return apiError('Email already in use', 409);

  const hash = await hashPassword(body.password);
  const user = await queryOne(
    `INSERT INTO users (name, email, password_hash, role, store_id)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, store_id, created_at`,
    [body.name, body.email.toLowerCase().trim(), hash, body.role, body.storeId || auth.storeId]
  );

  return apiOk({ user }, 201);
}, 'admin');
