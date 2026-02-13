// Typed API client for the scheduling system

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('keiths_auth_token') || '';
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${getToken()}`,
  };
}

async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'API error');
  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<{ user: unknown; token: string }>('/api/auth/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  logout: () => apiFetch('/api/auth/logout', { method: 'POST' }),
  me: () => apiFetch<{ user: unknown }>('/api/auth/me'),
};

// ── Shifts ────────────────────────────────────────────────────────────────────
export const shiftsApi = {
  list: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch<{ shifts: unknown[] }>(`/api/shifts${qs ? `?${qs}` : ''}`);
  },
  get: (id: string) => apiFetch<{ shift: unknown; wasteLogs: unknown[]; productionLogs: unknown[] }>(`/api/shifts/${id}`),
  create: (body: unknown) => apiFetch<{ shift: unknown }>('/api/shifts', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: unknown) => apiFetch<{ shift: unknown }>(`/api/shifts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => apiFetch(`/api/shifts/${id}`, { method: 'DELETE' }),
  claim: (id: string) => apiFetch<{ shift: unknown; status: string }>(`/api/shifts/${id}/claim`, { method: 'POST' }),
  approve: (id: string, action: 'approve' | 'deny') =>
    apiFetch<{ shift: unknown }>(`/api/shifts/${id}/approve`, { method: 'POST', body: JSON.stringify({ action }) }),
  lock: (id: string) => apiFetch<{ shift: unknown }>(`/api/shifts/${id}/lock`, { method: 'POST' }),
  clock: (id: string, action: 'in' | 'out') =>
    apiFetch<{ shift: unknown }>(`/api/shifts/${id}/clock`, { method: 'POST', body: JSON.stringify({ action }) }),
};

// ── Waste Logs ────────────────────────────────────────────────────────────────
export const wasteApi = {
  list: (shiftId: string) => apiFetch<{ logs: unknown[] }>(`/api/waste-logs?shiftId=${shiftId}`),
  add: (body: unknown) => apiFetch<{ log: unknown }>('/api/waste-logs', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Production Logs ───────────────────────────────────────────────────────────
export const productionApi = {
  list: (shiftId: string) => apiFetch<{ logs: unknown[] }>(`/api/production-logs?shiftId=${shiftId}`),
  add: (body: unknown) => apiFetch<{ log: unknown }>('/api/production-logs', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: () => apiFetch<{ users: unknown[] }>('/api/users'),
  get: (id: string) => apiFetch<{ user: unknown }>(`/api/users/${id}`),
  create: (body: unknown) => apiFetch<{ user: unknown }>('/api/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: unknown) => apiFetch<{ user: unknown }>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deactivate: (id: string) => apiFetch(`/api/users/${id}`, { method: 'DELETE' }),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => apiFetch<{ notifications: unknown[]; unreadCount: number }>('/api/notifications'),
  markAllRead: () => apiFetch('/api/notifications', { method: 'PATCH' }),
};

// ── Analytics ─────────────────────────────────────────────────────────────────
export const analyticsApi = {
  summary: (range: 7 | 30 | 90 = 7) => apiFetch<unknown>(`/api/analytics?range=${range}`),
};

// ── Swap Requests ─────────────────────────────────────────────────────────────
export const swapApi = {
  list: () => apiFetch<{ requests: unknown[] }>('/api/swap-requests'),
  create: (body: unknown) => apiFetch<{ request: unknown }>('/api/swap-requests', { method: 'POST', body: JSON.stringify(body) }),
  review: (id: string, action: 'approve' | 'deny') =>
    apiFetch('/api/swap-requests', { method: 'PATCH', body: JSON.stringify({ id, action }) }),
};
