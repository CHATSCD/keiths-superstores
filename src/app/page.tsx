'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  Trash2,
  Printer,
  Settings,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent } from '@/components/ui/card';
import {
  getProductionEntriesByDate,
  getWasteEntriesByDate,
  getProductionEntries,
  getWasteEntries,
  getTodayStr,
} from '@/lib/storage';
import { seedIfEmpty } from '@/lib/seed';
import { ProductionEntry, WasteEntry } from '@/types';

export default function HomePage() {
  const router = useRouter();
  const [todayProd, setTodayProd] = useState(0);
  const [todayWaste, setTodayWaste] = useState(0);
  const [recentReports, setRecentReports] = useState<(ProductionEntry | WasteEntry)[]>([]);

  useEffect(() => {
    seedIfEmpty();
    const today = getTodayStr();
    const prodEntries = getProductionEntriesByDate(today);
    const wasteEntries = getWasteEntriesByDate(today);

    setTodayProd(prodEntries.reduce((sum, e) => sum + e.items.reduce((s, i) => s + i.quantity, 0), 0));
    setTodayWaste(wasteEntries.reduce((sum, e) => sum + e.items.reduce((s, i) => s + i.quantity, 0), 0));

    // Recent reports (last 5 across production + waste)
    const allProd = getProductionEntries().map((e) => ({ ...e, _type: 'production' as const }));
    const allWaste = getWasteEntries().map((e) => ({ ...e, _type: 'waste' as const }));
    const combined = [...allProd, ...allWaste]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setRecentReports(combined);
  }, []);

  const wasteRate = todayProd + todayWaste > 0
    ? Math.round((todayWaste / (todayProd + todayWaste)) * 100)
    : 0;

  const actions = [
    {
      label: 'Production Entry',
      icon: ClipboardList,
      color: 'bg-green-100 text-green-700',
      href: '/production',
    },
    {
      label: 'Waste Entry',
      icon: Trash2,
      color: 'bg-red-100 text-red-700',
      href: '/waste',
    },
    {
      label: 'Print Forms',
      icon: Printer,
      color: 'bg-blue-100 text-blue-700',
      href: '/print',
    },
    {
      label: 'Store Items',
      icon: Settings,
      color: 'bg-purple-100 text-purple-700',
      href: '/store-items',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Today's Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-1">
                <ClipboardList className="h-5 w-5 text-green-700" />
              </div>
              <p className="text-xl font-bold">{todayProd}</p>
              <p className="text-[10px] text-muted-foreground">Production</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-1">
                <Trash2 className="h-5 w-5 text-red-700" />
              </div>
              <p className="text-xl font-bold">{todayWaste}</p>
              <p className="text-[10px] text-muted-foreground">Waste</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-1">
                <TrendingUp className="h-5 w-5 text-yellow-700" />
              </div>
              <p className="text-xl font-bold">{wasteRate}%</p>
              <p className="text-[10px] text-muted-foreground">Waste Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-2">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {actions.map((action) => (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="bg-white rounded-xl border p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow active:scale-[0.98]"
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        {recentReports.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-muted-foreground mb-2">Recent Reports</h2>
            <Card>
              <CardContent className="p-0 divide-y">
                {recentReports.map((report) => {
                  const isProd = 'source' in report && !('reason' in (report.items[0] || {}));
                  const totalUnits = report.items.reduce((s, i) => s + i.quantity, 0);
                  const date = new Date(report.createdAt);
                  return (
                    <div key={report.id} className="flex items-center justify-between px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isProd ? 'bg-green-100' : 'bg-red-100'}`}>
                          {isProd ? (
                            <ClipboardList className="h-4 w-4 text-green-700" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-red-700" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{report.employeeName}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {report.shift} &middot; {totalUnits} units &middot;{' '}
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
