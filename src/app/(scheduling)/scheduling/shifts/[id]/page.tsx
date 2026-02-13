'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Clock, MapPin, User, Trash2, ClipboardList, Plus, Lock,
  AlertCircle, Loader2,
} from 'lucide-react';
import { SchedulingShell } from '@/components/scheduling/SchedulingShell';
import { useAuth } from '@/context/AuthContext';
import { shiftsApi, wasteApi, productionApi, swapApi } from '@/lib/apiClient';
import { Shift, WasteLog, ProductionLog } from '@/types/scheduling';

const WASTE_REASONS = ['Expired', 'Overproduced', 'Damaged', 'Dropped', 'Quality issue', 'Other'];

function fmt(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${m.toString().padStart(2, '0')} ${period}`;
}

export default function ShiftDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [shift, setShift] = useState<Shift | null>(null);
  const [wasteLogs, setWasteLogs] = useState<WasteLog[]>([]);
  const [prodLogs, setProdLogs] = useState<ProductionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [wForm, setWForm] = useState({ itemName: '', quantity: '', reason: '', cost: '' });
  const [pForm, setPForm] = useState({ itemName: '', quantityProduced: '', cost: '' });
  const [tab, setTab] = useState<'overview' | 'waste' | 'production'>('overview');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await shiftsApi.get(id);
        setShift(data.shift as unknown as Shift);
        setWasteLogs((data.wasteLogs as unknown as WasteLog[]) || []);
        setProdLogs((data.productionLogs as unknown as ProductionLog[]) || []);
      } catch { setError('Shift not found'); }
      setLoading(false);
    }
    load();
  }, [id]);

  async function handleWasteSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!wForm.itemName || !wForm.quantity) return;
    setSubmitting(true);
    try {
      const res = await wasteApi.add({
        shiftId: id, itemName: wForm.itemName,
        quantity: parseFloat(wForm.quantity), reason: wForm.reason || undefined,
        cost: wForm.cost ? parseFloat(wForm.cost) : undefined,
      });
      setWasteLogs((prev) => [...prev, res.log as unknown as WasteLog]);
      setShift((s) => s ? { ...s, wasteTotal: s.wasteTotal + parseFloat(wForm.quantity) } : s);
      setWForm({ itemName: '', quantity: '', reason: '', cost: '' });
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    setSubmitting(false);
  }

  async function handleProdSubmit(e: React.FormEvent) {
    e.preventDefault(); setError('');
    if (!pForm.itemName || !pForm.quantityProduced) return;
    setSubmitting(true);
    try {
      const res = await productionApi.add({
        shiftId: id, itemName: pForm.itemName,
        quantityProduced: parseFloat(pForm.quantityProduced),
        cost: pForm.cost ? parseFloat(pForm.cost) : undefined,
      });
      setProdLogs((prev) => [...prev, res.log as unknown as ProductionLog]);
      setShift((s) => s ? { ...s, productionTotal: s.productionTotal + parseFloat(pForm.quantityProduced) } : s);
      setPForm({ itemName: '', quantityProduced: '', cost: '' });
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    setSubmitting(false);
  }

  async function handleApprove(action: 'approve' | 'deny') {
    setSubmitting(true); setError('');
    try {
      const res = await shiftsApi.approve(id, action);
      setShift(res.shift as unknown as Shift);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    setSubmitting(false);
  }

  async function handleClock(action: 'in' | 'out') {
    setSubmitting(true); setError('');
    try {
      const res = await shiftsApi.clock(id, action);
      setShift(res.shift as unknown as Shift);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    setSubmitting(false);
  }

  async function handleLock() {
    setSubmitting(true); setError('');
    try {
      const res = await shiftsApi.lock(id);
      setShift(res.shift as unknown as Shift);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    setSubmitting(false);
  }

  async function handleSwapRequest() {
    setSubmitting(true); setError('');
    try {
      await swapApi.create({ shiftId: id, message: 'Requesting shift swap' });
      setError('Swap request sent to manager.');
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Error'); }
    setSubmitting(false);
  }

  if (loading) return (
    <SchedulingShell>
      <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>
    </SchedulingShell>
  );

  if (!shift) return (
    <SchedulingShell>
      <div className="text-center py-20 text-gray-500">Shift not found</div>
    </SchedulingShell>
  );

  const isLocked = shift.status === 'locked';
  const isMyShift = shift.assignedUserId === user?.id;
  const canLog = !isLocked && (isMyShift || user?.role !== 'employee');
  const wasteRatio = shift.productionTotal > 0
    ? ((shift.wasteTotal / shift.productionTotal) * 100).toFixed(1)
    : null;

  return (
    <SchedulingShell>
      <div className="space-y-4">
        {/* Back */}
        <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Shift header card */}
        <div className="bg-white rounded-xl border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold px-2 py-1 rounded-full ${
              shift.status === 'locked' ? 'bg-gray-800 text-white' :
              shift.status === 'approved' ? 'bg-green-100 text-green-800' :
              shift.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
              shift.status === 'completed' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-700'
            }`}>
              {shift.status.toUpperCase()}
            </span>
            {isLocked && <Lock className="h-4 w-4 text-gray-600" />}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-semibold">
                {new Date(shift.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' '}&bull;{' '}{fmt(String(shift.startTime))} – {fmt(String(shift.endTime))}
              </span>
            </div>
            {shift.station && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{shift.station}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">{shift.assignedName || 'Unassigned'}</span>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 bg-gray-50 rounded-lg p-3">
            <div className="text-center">
              <p className="text-xs text-gray-500">Produced</p>
              <p className="text-base font-bold text-green-700">{shift.productionTotal}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Waste</p>
              <p className="text-base font-bold text-red-600">{shift.wasteTotal}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Ratio</p>
              <p className={`text-base font-bold ${wasteRatio && parseFloat(wasteRatio) > 20 ? 'text-red-600' : 'text-gray-700'}`}>
                {wasteRatio ?? '—'}%
              </p>
            </div>
          </div>

          {/* Clock in/out */}
          {shift.clockIn && (
            <p className="text-xs text-gray-500">
              Clocked in: {new Date(shift.clockIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              {shift.clockOut && ` · Out: ${new Date(shift.clockOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
            </p>
          )}

          {/* Action buttons */}
          {!isLocked && (
            <div className="flex gap-2 pt-1">
              {shift.status === 'pending' && (user?.role === 'admin' || user?.role === 'manager') && (
                <>
                  <button onClick={() => handleApprove('approve')} disabled={submitting}
                    className="flex-1 bg-green-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-green-700 disabled:opacity-60">
                    Approve
                  </button>
                  <button onClick={() => handleApprove('deny')} disabled={submitting}
                    className="flex-1 bg-red-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-red-700 disabled:opacity-60">
                    Deny
                  </button>
                </>
              )}
              {shift.status === 'approved' && isMyShift && !shift.clockIn && (
                <button onClick={() => handleClock('in')} disabled={submitting}
                  className="flex-1 bg-green-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-green-700 disabled:opacity-60">
                  Clock In
                </button>
              )}
              {shift.status === 'approved' && isMyShift && !!shift.clockIn && !shift.clockOut && (
                <button onClick={() => handleClock('out')} disabled={submitting}
                  className="flex-1 bg-orange-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-orange-700 disabled:opacity-60">
                  Clock Out
                </button>
              )}
              {shift.status === 'completed' && user?.role === 'admin' && (
                <button onClick={handleLock} disabled={submitting}
                  className="flex-1 bg-gray-700 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-60">
                  <Lock className="h-3 w-3 inline mr-1" />Lock Shift
                </button>
              )}
              {isMyShift && shift.status === 'approved' && (
                <button onClick={handleSwapRequest} disabled={submitting}
                  className="flex-1 border border-gray-300 text-gray-700 text-xs font-semibold py-2 rounded-lg hover:bg-gray-50">
                  Request Swap
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex bg-white border rounded-xl overflow-hidden">
          {[['overview','Overview'],['waste','Waste'],['production','Production']].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t as typeof tab)}
              className={`flex-1 py-2.5 text-xs font-semibold transition-colors ${
                tab === t ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {/* Waste tab */}
        {tab === 'waste' && (
          <div className="space-y-3">
            {canLog && (
              <form onSubmit={handleWasteSubmit} className="bg-white rounded-xl border p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <Trash2 className="h-4 w-4 text-red-500" /> Log Waste
                </h3>
                <input className="input w-full" placeholder="Item name" value={wForm.itemName}
                  onChange={(e) => setWForm({ ...wForm, itemName: e.target.value })} required />
                <div className="grid grid-cols-2 gap-3">
                  <input className="input" type="number" min="0" step="0.1" placeholder="Qty"
                    value={wForm.quantity} onChange={(e) => setWForm({ ...wForm, quantity: e.target.value })} required />
                  <input className="input" type="number" min="0" step="0.01" placeholder="Cost $"
                    value={wForm.cost} onChange={(e) => setWForm({ ...wForm, cost: e.target.value })} />
                </div>
                <select className="input w-full" value={wForm.reason}
                  onChange={(e) => setWForm({ ...wForm, reason: e.target.value })}>
                  <option value="">Select reason…</option>
                  {WASTE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <button type="submit" disabled={submitting}
                  className="w-full bg-red-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-60">
                  <Plus className="h-4 w-4 inline mr-1" />Add Waste Entry
                </button>
              </form>
            )}

            {wasteLogs.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No waste logged yet</p>
            ) : (
              <div className="bg-white rounded-xl border divide-y">
                {wasteLogs.map((w) => (
                  <div key={w.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{w.itemName}</p>
                      <p className="text-xs text-gray-500">{w.reason || 'No reason'} · by {w.loggedByName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-red-600">{w.quantity} units</p>
                      {w.cost > 0 && <p className="text-xs text-gray-400">${w.cost.toFixed(2)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Production tab */}
        {tab === 'production' && (
          <div className="space-y-3">
            {canLog && (
              <form onSubmit={handleProdSubmit} className="bg-white rounded-xl border p-4 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 text-green-600" /> Log Production
                </h3>
                <input className="input w-full" placeholder="Item name" value={pForm.itemName}
                  onChange={(e) => setPForm({ ...pForm, itemName: e.target.value })} required />
                <div className="grid grid-cols-2 gap-3">
                  <input className="input" type="number" min="0" step="0.1" placeholder="Qty"
                    value={pForm.quantityProduced}
                    onChange={(e) => setPForm({ ...pForm, quantityProduced: e.target.value })} required />
                  <input className="input" type="number" min="0" step="0.01" placeholder="Cost $"
                    value={pForm.cost} onChange={(e) => setPForm({ ...pForm, cost: e.target.value })} />
                </div>
                <button type="submit" disabled={submitting}
                  className="w-full bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-60">
                  <Plus className="h-4 w-4 inline mr-1" />Add Production Entry
                </button>
              </form>
            )}

            {prodLogs.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No production logged yet</p>
            ) : (
              <div className="bg-white rounded-xl border divide-y">
                {prodLogs.map((p) => (
                  <div key={p.id} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{p.itemName}</p>
                      <p className="text-xs text-gray-500">by {p.loggedByName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">{p.quantityProduced} units</p>
                      {p.cost > 0 && <p className="text-xs text-gray-400">${p.cost.toFixed(2)}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Overview tab */}
        {tab === 'overview' && (
          <div className="space-y-3">
            {shift.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-yellow-700 mb-1">Shift Notes</p>
                <p className="text-sm text-yellow-900">{shift.notes}</p>
              </div>
            )}
            {shift.eventFlag && (
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-xs font-semibold text-purple-700">Special Event</p>
                {shift.eventNote && <p className="text-sm text-purple-900 mt-1">{shift.eventNote}</p>}
              </div>
            )}
            <div className="bg-white border rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Summary</p>
              <div className="grid grid-cols-2 gap-y-2 text-sm">
                <span className="text-gray-500">Date</span>
                <span className="font-medium">{shift.date}</span>
                <span className="text-gray-500">Time</span>
                <span className="font-medium">{fmt(String(shift.startTime))} – {fmt(String(shift.endTime))}</span>
                <span className="text-gray-500">Station</span>
                <span className="font-medium">{shift.station || '—'}</span>
                <span className="text-gray-500">Assigned to</span>
                <span className="font-medium">{shift.assignedName || 'Unassigned'}</span>
                <span className="text-gray-500">Production</span>
                <span className="font-medium text-green-700">{shift.productionTotal} units</span>
                <span className="text-gray-500">Waste</span>
                <span className="font-medium text-red-600">{shift.wasteTotal} units</span>
                <span className="text-gray-500">Waste %</span>
                <span className={`font-medium ${wasteRatio && parseFloat(wasteRatio) > 20 ? 'text-red-600' : 'text-gray-700'}`}>
                  {wasteRatio ?? '—'}%
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </SchedulingShell>
  );
}
