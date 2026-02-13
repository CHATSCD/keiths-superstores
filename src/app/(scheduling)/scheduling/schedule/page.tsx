'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Loader2, X, AlertCircle } from 'lucide-react';
import { SchedulingShell } from '@/components/scheduling/SchedulingShell';
import { WeekCalendar } from '@/components/scheduling/WeekCalendar';
import { ShiftCard } from '@/components/scheduling/ShiftCard';
import { useAuth } from '@/context/AuthContext';
import { shiftsApi } from '@/lib/apiClient';
import { Shift } from '@/types/scheduling';

function todayStr() { return new Date().toISOString().slice(0, 10); }

export default function SchedulePage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    date: todayStr(), startTime: '09:00', endTime: '17:00',
    station: '', roleRequired: '', notes: '', eventFlag: false,
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load 4-week window
      const start = new Date();
      start.setDate(start.getDate() - 7);
      const data = await shiftsApi.list({ weekStart: start.toISOString().slice(0, 10) });
      setShifts((data.shifts as unknown as Shift[]) || []);
    } catch { /* handled */ }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const dayShifts = shifts.filter((s) => s.date === selectedDate);

  async function handleClaim(id: string) {
    setActionLoading(true); setError('');
    try {
      const res = await shiftsApi.claim(id);
      setShifts((prev) => prev.map((s) => s.id === id ? { ...s, ...res.shift as Partial<Shift> } : s));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    setActionLoading(false);
  }

  async function handleApprove(id: string, action: 'approve' | 'deny') {
    setActionLoading(true); setError('');
    try {
      const res = await shiftsApi.approve(id, action);
      setShifts((prev) => prev.map((s) => s.id === id ? { ...s, ...res.shift as Partial<Shift> } : s));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    setActionLoading(false);
  }

  async function handleClock(id: string, action: 'in' | 'out') {
    setActionLoading(true); setError('');
    try {
      const res = await shiftsApi.clock(id, action);
      setShifts((prev) => prev.map((s) => s.id === id ? { ...s, ...res.shift as Partial<Shift> } : s));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    setActionLoading(false);
  }

  async function handleLock(id: string) {
    setActionLoading(true); setError('');
    try {
      const res = await shiftsApi.lock(id);
      setShifts((prev) => prev.map((s) => s.id === id ? { ...s, ...res.shift as Partial<Shift> } : s));
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    setActionLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault(); setError('');
    try {
      const res = await shiftsApi.create({
        date: form.date, startTime: form.startTime, endTime: form.endTime,
        station: form.station || undefined, roleRequired: form.roleRequired || undefined,
        notes: form.notes || undefined, eventFlag: form.eventFlag,
      });
      setShifts((prev) => [...prev, res.shift as unknown as Shift]);
      setShowCreate(false);
      setSelectedDate(form.date);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
  }

  return (
    <SchedulingShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">Schedule</h1>
          {(user?.role === 'admin' || user?.role === 'manager') && (
            <button
              onClick={() => { setShowCreate(true); setForm((f) => ({ ...f, date: selectedDate })); }}
              className="flex items-center gap-1.5 bg-blue-700 text-white text-sm font-semibold px-3 py-2 rounded-lg"
            >
              <Plus className="h-4 w-4" /> Add Shift
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <WeekCalendar shifts={shifts} selectedDate={selectedDate} onDaySelect={setSelectedDate} />

        <div>
          <h2 className="text-sm font-semibold text-gray-600 mb-2">
            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            <span className="ml-2 text-gray-400">({dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''})</span>
          </h2>

          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>
          ) : dayShifts.length === 0 ? (
            <div className="text-center py-10 text-gray-400 bg-white border rounded-xl">
              <p className="text-sm">No shifts scheduled</p>
              {(user?.role === 'admin' || user?.role === 'manager') && (
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-3 text-blue-600 text-sm font-semibold hover:underline"
                >
                  + Create shift
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {dayShifts.map((s) => (
                <ShiftCard
                  key={s.id}
                  shift={s}
                  loading={actionLoading}
                  onClaim={handleClaim}
                  onApprove={handleApprove}
                  onClock={handleClock}
                  onLock={handleLock}
                  onClick={(sh) => window.location.href = `/scheduling/shifts/${sh.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Shift Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <h2 className="font-bold text-gray-900">Create Shift</h2>
              <button onClick={() => setShowCreate(false)}>
                <X className="h-5 w-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

              <Field label="Date">
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required className="input" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Start Time">
                  <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    required className="input" />
                </Field>
                <Field label="End Time">
                  <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    required className="input" />
                </Field>
              </div>
              <Field label="Station">
                <input type="text" value={form.station} onChange={(e) => setForm({ ...form, station: e.target.value })}
                  className="input" placeholder="e.g. Deli, Bakery…" />
              </Field>
              <Field label="Role Required">
                <select value={form.roleRequired} onChange={(e) => setForm({ ...form, roleRequired: e.target.value })}
                  className="input">
                  <option value="">Any</option>
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                </select>
              </Field>
              <Field label="Notes">
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="input min-h-[80px] resize-none" placeholder="Optional notes…" />
              </Field>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.eventFlag} onChange={(e) => setForm({ ...form, eventFlag: e.target.checked })}
                  className="w-4 h-4 accent-blue-600" />
                <span className="text-sm text-gray-700">Mark as special event / holiday</span>
              </label>

              <button type="submit"
                className="w-full bg-blue-700 text-white py-3 rounded-xl font-semibold hover:bg-blue-800 transition-colors">
                Create Shift
              </button>
            </form>
          </div>
        </div>
      )}
    </SchedulingShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
