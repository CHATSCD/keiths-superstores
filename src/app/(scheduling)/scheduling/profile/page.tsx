'use client';

import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Shield, Mail, User, Save } from 'lucide-react';
import { SchedulingShell } from '@/components/scheduling/SchedulingShell';
import { useAuth } from '@/context/AuthContext';
import { usersApi, swapApi, notificationsApi, shiftsApi } from '@/lib/apiClient';
import { Shift, SwapRequest } from '@/types/scheduling';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [myShifts, setMyShifts] = useState<Shift[]>([]);
  const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const start = new Date();
        start.setDate(start.getDate() - 30);
        const [shiftsData, swapsData] = await Promise.all([
          shiftsApi.list({ weekStart: start.toISOString().slice(0, 10) }),
          swapApi.list(),
        ]);
        const all = (shiftsData.shifts as unknown as Shift[]) || [];
        setMyShifts(all.filter((s) => s.assignedUserId === user?.id));
        setSwapRequests((swapsData.requests as unknown as SwapRequest[]) || []);
      } catch { /* handled */ }
      setLoading(false);
    }
    load();
  }, [user]);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess('');
    if (pwForm.next !== pwForm.confirm) { setError('Passwords do not match'); return; }
    if (pwForm.next.length < 6) { setError('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await usersApi.update(user!.id, { password: pwForm.next });
      setSuccess('Password updated successfully');
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Error'); }
    setSavingPw(false);
  }

  const totalShifts = myShifts.length;
  const totalWaste = myShifts.reduce((s, sh) => s + (sh.wasteTotal || 0), 0);
  const totalProd = myShifts.reduce((s, sh) => s + (sh.productionTotal || 0), 0);
  const wasteRatio = totalProd > 0 ? ((totalWaste / totalProd) * 100).toFixed(1) : '0';

  if (loading) return (
    <SchedulingShell>
      <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
    </SchedulingShell>
  );

  return (
    <SchedulingShell>
      <div className="space-y-5">
        <h1 className="text-lg font-bold text-gray-900">My Profile</h1>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <p className="text-sm text-green-700">{success}</p>
          </div>
        )}

        {/* User card */}
        <div className="bg-white rounded-xl border p-5 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <span className="text-blue-700 font-black text-2xl">{user?.name.charAt(0).toUpperCase()}</span>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900">{user?.name}</p>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Mail className="h-3.5 w-3.5" />{user?.email}
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
              <Shield className="h-3.5 w-3.5" />
              <span className="capitalize">{user?.role}</span>
            </div>
          </div>
        </div>

        {/* My stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Shifts', value: String(totalShifts), color: 'text-blue-700' },
            { label: 'Prod.', value: String(totalProd), color: 'text-green-700' },
            { label: 'Waste %', value: `${wasteRatio}%`, color: parseFloat(wasteRatio) > 20 ? 'text-red-600' : 'text-gray-700' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-xl border p-4 text-center">
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-500">{label}</p>
            </div>
          ))}
        </div>

        {/* Swap requests */}
        {swapRequests.length > 0 && (
          <div className="bg-white rounded-xl border p-4">
            <h2 className="text-sm font-semibold mb-3">My Swap Requests</h2>
            <div className="space-y-2">
              {swapRequests.slice(0, 5).map((sr) => (
                <div key={sr.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 truncate">Shift swap</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    sr.status === 'approved' ? 'bg-green-100 text-green-700' :
                    sr.status === 'denied' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>{sr.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Change password */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-sm font-semibold mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-3">
            {[
              { label: 'New Password', key: 'next' },
              { label: 'Confirm Password', key: 'confirm' },
            ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                <input type="password" required minLength={6}
                  value={pwForm[key as keyof typeof pwForm]}
                  onChange={(e) => setPwForm({ ...pwForm, [key]: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="••••••••" />
              </div>
            ))}
            <button type="submit" disabled={savingPw}
              className="w-full flex items-center justify-center gap-2 bg-blue-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-60">
              <Save className="h-4 w-4" />
              {savingPw ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Sign out */}
        <button onClick={logout}
          className="w-full border border-red-300 text-red-600 py-3 rounded-xl text-sm font-semibold hover:bg-red-50 transition-colors">
          Sign Out
        </button>
      </div>
    </SchedulingShell>
  );
}
