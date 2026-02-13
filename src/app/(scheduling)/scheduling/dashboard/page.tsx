'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingDown, TrendingUp, Users, CalendarCheck, AlertTriangle, BarChart2, Loader2,
} from 'lucide-react';
import { SchedulingShell } from '@/components/scheduling/SchedulingShell';
import { useAuth } from '@/context/AuthContext';
import { analyticsApi, shiftsApi } from '@/lib/apiClient';
import { AnalyticsSummary, Shift } from '@/types/scheduling';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [range, setRange] = useState<7 | 30 | 90>(7);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [analyticsData, shiftsData] = await Promise.all([
          user?.role !== 'employee' ? analyticsApi.summary(range) : Promise.resolve(null),
          shiftsApi.list({ date: today }),
        ]);
        if (analyticsData) setAnalytics(analyticsData as AnalyticsSummary);
        setTodayShifts((shiftsData.shifts as unknown as Shift[]) || []);
      } catch { /* auth error handled by shell */ }
      setLoading(false);
    }
    load();
  }, [range, user]);

  if (loading) {
    return (
      <SchedulingShell>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </SchedulingShell>
    );
  }

  const pendingCount = todayShifts.filter((s) => s.status === 'pending').length;
  const unassignedCount = todayShifts.filter((s) => s.status === 'unassigned').length;

  return (
    <SchedulingShell>
      <div className="space-y-5">
        <div>
          <h1 className="text-lg font-bold text-gray-900">
            Good {getTimeOfDay()}, {user?.name.split(' ')[0]}
          </h1>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Alert banners */}
        {pendingCount > 0 && (
          <div
            onClick={() => router.push('/scheduling/schedule')}
            className="flex items-center gap-3 bg-yellow-50 border border-yellow-300 rounded-xl px-4 py-3 cursor-pointer hover:bg-yellow-100 transition-colors"
          >
            <AlertTriangle className="h-5 w-5 text-yellow-600 shrink-0" />
            <p className="text-sm font-medium text-yellow-800">
              {pendingCount} shift{pendingCount !== 1 ? 's' : ''} awaiting approval
            </p>
          </div>
        )}

        {/* Quick stats for admin/manager */}
        {analytics && (
          <>
            {/* Range selector */}
            <div className="flex gap-2">
              {([7, 30, 90] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    range === r ? 'bg-blue-700 text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {r}d
                </button>
              ))}
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard
                label="Total Waste"
                value={analytics.totals.waste.toFixed(0)}
                sub="units"
                icon={TrendingDown}
                color="bg-red-100 text-red-700"
              />
              <StatCard
                label="Production"
                value={analytics.totals.production.toFixed(0)}
                sub="units"
                icon={TrendingUp}
                color="bg-green-100 text-green-700"
              />
              <StatCard
                label="Waste Rate"
                value={`${analytics.totals.wasteRatio}%`}
                sub="of production"
                icon={BarChart2}
                color="bg-orange-100 text-orange-700"
              />
              <StatCard
                label="Today Open"
                value={String(unassignedCount)}
                sub="unassigned shifts"
                icon={CalendarCheck}
                color="bg-blue-100 text-blue-700"
              />
            </div>

            {/* Daily trend chart */}
            {analytics.dailyTotals.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <h2 className="text-sm font-semibold mb-3">Daily Waste vs Production</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={analytics.dailyTotals.map((d) => ({
                    date: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    Waste: parseFloat(String(d.waste)),
                    Production: parseFloat(String(d.production)),
                  }))}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} width={30} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Production" stroke="#16a34a" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Waste" stroke="#dc2626" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Top wasters */}
            {analytics.topWasters.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <h2 className="text-sm font-semibold mb-3">Top Waste Items</h2>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={analytics.topWasters.slice(0, 6).map((w) => ({
                    name: w.item_name,
                    Waste: parseFloat(String(w.total_qty)),
                  }))}>
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                    <YAxis tick={{ fontSize: 10 }} width={30} />
                    <Tooltip />
                    <Bar dataKey="Waste" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* AI Insights */}
            {analytics.aiInsights && (
              <div className={`rounded-xl border p-4 ${
                analytics.aiInsights.riskyEmployees.length > 0
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              }`}>
                <p className="text-xs font-semibold text-gray-700 mb-1">AI Shift Insight</p>
                <p className="text-sm text-gray-800">{analytics.aiInsights.recommendation}</p>
                {analytics.aiInsights.riskyEmployees.length > 0 && (
                  <ul className="mt-2 space-y-0.5">
                    {analytics.aiInsights.riskyEmployees.map((e) => (
                      <li key={e.name} className="text-xs text-red-700">
                        {e.name} — {e.wasteRatio}% waste ratio
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Leaderboard */}
            {analytics.employeeMetrics.length > 0 && (
              <div className="bg-white rounded-xl border p-4">
                <h2 className="text-sm font-semibold mb-3">
                  <Users className="h-4 w-4 inline mr-1.5 text-gray-500" />
                  Employee Leaderboard
                </h2>
                <div className="space-y-2">
                  {(analytics.employeeMetrics as unknown as Array<{
                    user_id: string; name: string; total_shifts: number;
                    waste_ratio: number; efficiency_score: number;
                  }>).slice(0, 8).map((em, idx) => (
                    <div key={em.user_id} className="flex items-center gap-3">
                      <span className="text-xs font-bold w-5 text-gray-400">#{idx + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{em.name}</p>
                        <p className="text-[10px] text-gray-500">{em.total_shifts} shifts</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-bold ${em.waste_ratio > 20 ? 'text-red-600' : 'text-green-600'}`}>
                          {em.waste_ratio}% waste
                        </p>
                        <p className="text-[10px] text-gray-400">eff. {em.efficiency_score}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Employee view — today's shifts */}
        {user?.role === 'employee' && (
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-2">Today&apos;s Shifts</h2>
            {todayShifts.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No shifts scheduled for today</p>
            ) : (
              <div className="space-y-3">
                {todayShifts.map((s) => (
                  <div key={s.id} className="bg-white border rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{String(s.startTime).slice(0,5)} – {String(s.endTime).slice(0,5)}</p>
                      <p className="text-xs text-gray-500">{s.station || 'No station'} · {s.status}</p>
                    </div>
                    <button
                      onClick={() => router.push(`/scheduling/shifts/${s.id}`)}
                      className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </SchedulingShell>
  );
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub: string; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-2 ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-[10px] text-gray-400">{sub}</p>
    </div>
  );
}

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}
