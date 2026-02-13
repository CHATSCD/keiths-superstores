'use client';

import React, { useEffect, useState } from 'react';
import { Plus, X, AlertCircle, UserCheck, UserX, Loader2 } from 'lucide-react';
import { SchedulingShell } from '@/components/scheduling/SchedulingShell';
import { usersApi } from '@/lib/apiClient';
import { User } from '@/types/scheduling';
import { useAuth } from '@/context/AuthContext';

const ROLES = ['employee', 'manager', 'admin'] as const;
const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700',
  manager: 'bg-blue-100 text-blue-700',
  employee: 'bg-gray-100 text-gray-700',
};

export default function UsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' as const });

  useEffect(() => {
    usersApi.list()
      .then((d) => setUsers((d.users as unknown as User[]) || []))
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try {
      const res = await usersApi.create(form);
      setUsers((prev) => [...prev, res.user as unknown as User]);
      setShowCreate(false);
      setForm({ name: '', email: '', password: '', role: 'employee' });
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); }
  }

  async function handleToggleActive(user: User) {
    try {
      if (user.active) {
        await usersApi.deactivate(user.id);
      } else {
        await usersApi.update(user.id, { active: true });
      }
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, active: !user.active } : u));
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); }
  }

  if (loading) return (
    <SchedulingShell>
      <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
    </SchedulingShell>
  );

  return (
    <SchedulingShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Team Members</h1>
          {me?.role === 'admin' && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg">
              <Plus className="h-4 w-4" /> Add User
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id}
              className={`bg-white border rounded-xl p-4 flex items-center gap-3 ${!u.active ? 'opacity-60' : ''}`}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-blue-700 font-bold text-sm">{u.name.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{u.name}</p>
                <p className="text-xs text-gray-500 truncate">{u.email}</p>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                  {u.role}
                </span>
              </div>
              {me?.role === 'admin' && u.id !== me.id && (
                <button onClick={() => handleToggleActive(u)}
                  className={`p-2 rounded-lg ${u.active ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' : 'hover:bg-green-50 text-gray-400 hover:text-green-500'}`}>
                  {u.active ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create User Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold">Add Team Member</h2>
              <button onClick={() => setShowCreate(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
              {[
                { label: 'Full Name', key: 'name', type: 'text', placeholder: 'John Smith' },
                { label: 'Email', key: 'email', type: 'email', placeholder: 'john@keiths.com' },
                { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} placeholder={placeholder} required
                    value={form[key as keyof typeof form]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as typeof form.role })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                </select>
              </div>
              <button type="submit"
                className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800">
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </SchedulingShell>
  );
}
