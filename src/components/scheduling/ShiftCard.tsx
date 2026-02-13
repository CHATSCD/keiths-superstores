'use client';

import React from 'react';
import { Clock, MapPin, User, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Shift, SHIFT_STATUS_COLORS, SHIFT_STATUS_DOT } from '@/types/scheduling';
import { useAuth } from '@/context/AuthContext';

interface Props {
  shift: Shift;
  onClaim?: (id: string) => void;
  onApprove?: (id: string, action: 'approve' | 'deny') => void;
  onLock?: (id: string) => void;
  onClock?: (id: string, action: 'in' | 'out') => void;
  onClick?: (shift: Shift) => void;
  loading?: boolean;
}

function fmt(t: string) {
  const [h, m] = t.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${period}`;
}

export function ShiftCard({ shift, onClaim, onApprove, onLock, onClock, onClick, loading }: Props) {
  const { user } = useAuth();
  if (!user) return null;

  const isMyShift = shift.assignedUserId === user.id;
  const canClaim = shift.status === 'unassigned' && user.role === 'employee' && !isMyShift;
  const canApprove = shift.status === 'pending' && (user.role === 'admin' || user.role === 'manager');
  const canLock = shift.status === 'completed' && user.role === 'admin';
  const canClockIn = shift.status === 'approved' && isMyShift && !shift.clockIn;
  const canClockOut = shift.status === 'approved' && isMyShift && !!shift.clockIn && !shift.clockOut;

  const wasteRatio = shift.productionTotal > 0
    ? ((shift.wasteTotal / shift.productionTotal) * 100).toFixed(0)
    : null;
  const highWaste = wasteRatio !== null && parseInt(wasteRatio) > 20;

  return (
    <div
      className={`bg-white border rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${
        highWaste ? 'border-red-300' : 'border-gray-200'
      }`}
      onClick={() => onClick?.(shift)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${SHIFT_STATUS_DOT[shift.status]}`} />
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${SHIFT_STATUS_COLORS[shift.status]}`}>
            {shift.status.charAt(0).toUpperCase() + shift.status.slice(1)}
          </span>
          {shift.eventFlag && (
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
              Event
            </span>
          )}
        </div>
        {shift.status === 'locked' && <Lock className="h-4 w-4 text-gray-600" />}
        {highWaste && <AlertCircle className="h-4 w-4 text-red-500" />}
      </div>

      {/* Time */}
      <div className="flex items-center gap-1.5 mb-1.5">
        <Clock className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="text-sm font-semibold text-gray-900">
          {fmt(shift.startTime)} – {fmt(shift.endTime)}
        </span>
      </div>

      {/* Station */}
      {shift.station && (
        <div className="flex items-center gap-1.5 mb-1.5">
          <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
          <span className="text-sm text-gray-600">{shift.station}</span>
        </div>
      )}

      {/* Assigned */}
      <div className="flex items-center gap-1.5 mb-3">
        <User className="h-4 w-4 text-gray-400 shrink-0" />
        <span className="text-sm text-gray-600">
          {shift.assignedName || <span className="text-gray-400 italic">Unassigned</span>}
        </span>
      </div>

      {/* Stats */}
      {(shift.wasteTotal > 0 || shift.productionTotal > 0) && (
        <div className="flex gap-3 bg-gray-50 rounded-lg px-3 py-2 mb-3 text-xs">
          <div>
            <span className="text-gray-500">Produced</span>
            <span className="font-bold text-green-700 ml-1">{shift.productionTotal}</span>
          </div>
          <div>
            <span className="text-gray-500">Waste</span>
            <span className={`font-bold ml-1 ${highWaste ? 'text-red-600' : 'text-gray-700'}`}>
              {shift.wasteTotal} {wasteRatio !== null ? `(${wasteRatio}%)` : ''}
            </span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
        {canClaim && (
          <button
            onClick={() => onClaim?.(shift.id)}
            disabled={loading}
            className="flex-1 bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            Claim Shift
          </button>
        )}
        {canApprove && (
          <>
            <button
              onClick={() => onApprove?.(shift.id, 'approve')}
              disabled={loading}
              className="flex-1 bg-green-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
            >
              Approve
            </button>
            <button
              onClick={() => onApprove?.(shift.id, 'deny')}
              disabled={loading}
              className="flex-1 bg-red-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
            >
              Deny
            </button>
          </>
        )}
        {canClockIn && (
          <button
            onClick={() => onClock?.(shift.id, 'in')}
            disabled={loading}
            className="flex-1 bg-green-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
          >
            Clock In
          </button>
        )}
        {canClockOut && (
          <button
            onClick={() => onClock?.(shift.id, 'out')}
            disabled={loading}
            className="flex-1 bg-orange-600 text-white text-xs font-semibold py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60"
          >
            Clock Out
          </button>
        )}
        {canLock && (
          <button
            onClick={() => onLock?.(shift.id)}
            disabled={loading}
            className="flex-1 bg-gray-700 text-white text-xs font-semibold py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-60"
          >
            <Lock className="h-3 w-3 inline mr-1" />Lock
          </button>
        )}
      </div>
    </div>
  );
}
