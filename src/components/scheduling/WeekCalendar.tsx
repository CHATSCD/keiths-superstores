'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Shift, SHIFT_STATUS_DOT } from '@/types/scheduling';

interface Props {
  shifts: Shift[];
  onDaySelect: (dateStr: string) => void;
  selectedDate: string;
}

function getWeekDates(anchorDate: Date): Date[] {
  const d = new Date(anchorDate);
  const day = d.getDay(); // 0=Sun
  d.setDate(d.getDate() - day);
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d);
    dd.setDate(d.getDate() + i);
    return dd;
  });
}

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function WeekCalendar({ shifts, onDaySelect, selectedDate }: Props) {
  const [anchor, setAnchor] = useState<Date>(new Date());
  const week = getWeekDates(anchor);

  const shiftsByDate = shifts.reduce<Record<string, Shift[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  function prev() {
    const d = new Date(anchor);
    d.setDate(d.getDate() - 7);
    setAnchor(d);
  }
  function next() {
    const d = new Date(anchor);
    d.setDate(d.getDate() + 7);
    setAnchor(d);
  }

  const monthLabel = week[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Month header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <button onClick={prev} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">{monthLabel}</span>
        <button onClick={next} className="p-1 hover:bg-gray-100 rounded-lg">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day columns */}
      <div className="grid grid-cols-7">
        {week.map((d, i) => {
          const ds = toDateStr(d);
          const dayShifts = shiftsByDate[ds] || [];
          const isSelected = ds === selectedDate;
          const isToday = ds === toDateStr(new Date());

          return (
            <button
              key={ds}
              onClick={() => onDaySelect(ds)}
              className={`flex flex-col items-center py-3 gap-1 transition-colors ${
                isSelected ? 'bg-blue-600 text-white' : isToday ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <span className="text-[10px] font-medium uppercase">{DAYS[i]}</span>
              <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full ${
                isSelected ? 'bg-white text-blue-600' : ''
              }`}>
                {d.getDate()}
              </span>
              {/* Shift dots */}
              <div className="flex gap-0.5 flex-wrap justify-center max-w-[32px]">
                {dayShifts.slice(0, 3).map((s) => (
                  <span key={s.id} className={`w-1.5 h-1.5 rounded-full ${
                    isSelected ? 'bg-white/70' : SHIFT_STATUS_DOT[s.status]
                  }`} />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
