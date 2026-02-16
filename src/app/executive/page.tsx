'use client';

import React, { useState, useEffect } from 'react';
import Script from 'next/script';
import { DollarSign, TrendingDown, TrendingUp, AlertTriangle, Award, FileDown, Zap, BarChart2, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  getWasteEntries, getProductionEntries, getInventory,
  getEmployees, saveInventory, getTodayStr,
} from '@/lib/storage';
import {
  buildExecutiveSummary, generateSmartAlerts, runWhatIf,
  buildStoreScorecard, buildROIReport, getYearOverYearComparison,
} from '@/lib/analytics';
import {
  ExecutiveSummary, SmartAlert, WhatIfResult, StoreScore, ROIReport,
} from '@/types';

type Tab = 'money' | 'alerts' | 'whatif' | 'scorecard' | 'roi';
type Range = '7' | '30' | '90';

export default function ExecutivePage() {
  const [tab, setTab] = useState<Tab>('money');
  const [range, setRange] = useState<Range>('30');
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [alerts, setAlerts] = useState<SmartAlert[]>([]);
  const [scorecard, setScorecard] = useState<StoreScore[]>([]);
  const [roi, setROI] = useState<ROIReport | null>(null);
  const [yoy, setYoY] = useState<{ thisYearCost: number; lastYearCost: number; change: number } | null>(null);

  // What-If state
  const [whatIfItemId, setWhatIfItemId] = useState('');
  const [whatIfPct, setWhatIfPct] = useState(10);
  const [whatIfResult, setWhatIfResult] = useState<WhatIfResult | null>(null);

  // Cost-per-unit editing
  const [editingCosts, setEditingCosts] = useState(false);
  const [costDraft, setCostDraft] = useState<Record<string, string>>({});

  const inventory = getInventory();
  const wasteEntries = getWasteEntries();
  const productionEntries = getProductionEntries();
  const employees = getEmployees();

  useEffect(() => {
    reload();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  function reload() {
    const inv = getInventory();
    const waste = getWasteEntries();
    const prod = getProductionEntries();
    const emps = getEmployees();

    setSummary(buildExecutiveSummary(waste, prod, inv, parseInt(range)));
    setAlerts(generateSmartAlerts(waste, prod, inv, emps));
    setScorecard(buildStoreScorecard(inv));
    setROI(buildROIReport(waste, prod, inv));
    setYoY(getYearOverYearComparison(waste, inv));
  }

  function runSimulation() {
    if (!whatIfItemId) return;
    const result = runWhatIf(whatIfItemId, whatIfPct, wasteEntries, productionEntries, inventory);
    setWhatIfResult(result);
  }

  function saveCosts() {
    const inv = getInventory();
    const updated = inv.map((item) => {
      const val = parseFloat(costDraft[item.id]);
      return { ...item, costPerUnit: isNaN(val) ? item.costPerUnit : val };
    });
    saveInventory(updated);
    setEditingCosts(false);
    reload();
  }

  function startEditCosts() {
    const draft: Record<string, string> = {};
    inventory.forEach((i) => { draft[i.id] = i.costPerUnit ? String(i.costPerUnit) : '1.25'; });
    setCostDraft(draft);
    setEditingCosts(true);
  }

  async function downloadROIPDF() {
    const el = document.getElementById('roi-print-section');
    if (!el) return;
    
    const html2pdf = (window as any).html2pdf;
    if (!html2pdf) return;
    await html2pdf().set({
      margin: 0.5,
      filename: `roi-report-${getTodayStr()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    }).from(el).save();
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'money', label: 'Money', icon: <DollarSign className="h-4 w-4" /> },
    { id: 'alerts', label: `Alerts${alerts.length ? ` (${alerts.length})` : ''}`, icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'whatif', label: 'What-If', icon: <Zap className="h-4 w-4" /> },
    { id: 'scorecard', label: 'Scorecard', icon: <Award className="h-4 w-4" /> },
    { id: 'roi', label: 'ROI', icon: <BarChart2 className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="lazyOnload" />
      <Header />
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Executive View</h2>
          <button onClick={reload} className="text-gray-400 hover:text-gray-600">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                tab === t.id ? 'bg-blue-700 text-white' : 'bg-white text-gray-600 border'
              }`}
            >
              {t.icon}{t.label}
            </button>
          ))}
        </div>

        {/* ── MONEY DASHBOARD ── */}
        {tab === 'money' && (
          <div className="space-y-4">
            {/* Date range */}
            <div className="flex gap-2">
              {(['7', '30', '90'] as Range[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border ${range === r ? 'bg-blue-700 text-white border-blue-700' : 'bg-white text-gray-600'}`}
                >
                  {r === '7' ? 'This Week' : r === '30' ? 'This Month' : 'Quarter'}
                </button>
              ))}
            </div>

            {summary ? (
              <>
                {/* Top money cards */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-2 border-red-200 bg-red-50">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-red-600 font-semibold">Waste Cost</p>
                      <p className="text-2xl font-black text-red-700">${summary.totalWasteCost.toLocaleString()}</p>
                      <p className="text-[10px] text-red-500">last {range} days</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-green-200 bg-green-50">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-green-600 font-semibold">Produced Value</p>
                      <p className="text-2xl font-black text-green-700">${summary.totalProducedCost.toLocaleString()}</p>
                      <p className="text-[10px] text-green-500">last {range} days</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-orange-200 bg-orange-50">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-orange-600 font-semibold">Waste %</p>
                      <p className="text-2xl font-black text-orange-700">{summary.wastePercent}%</p>
                      <p className="text-[10px] text-orange-500">of production value</p>
                    </CardContent>
                  </Card>
                  <Card className="border-2 border-blue-200 bg-blue-50">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-blue-600 font-semibold">If Waste −10%</p>
                      <p className="text-2xl font-black text-blue-700">${summary.savingsAt10Pct.toLocaleString()}</p>
                      <p className="text-[10px] text-blue-500">saved in {range} days</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Savings projections */}
                <Card className="border-2 border-purple-200 bg-purple-50">
                  <CardContent className="p-3 space-y-1">
                    <p className="text-xs font-bold text-purple-800">Savings Projections</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-700">Reduce waste 10%</span>
                      <span className="font-bold text-purple-900">${summary.savingsAt10Pct.toLocaleString()} saved</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-700">Reduce waste 20%</span>
                      <span className="font-bold text-purple-900">${summary.savingsAt20Pct.toLocaleString()} saved</span>
                    </div>
                    {yoy && (
                      <div className="mt-2 pt-2 border-t border-purple-200">
                        <p className="text-xs font-bold text-purple-800">Year-Over-Year</p>
                        <div className="flex justify-between text-xs mt-1">
                          <span>This year waste cost</span>
                          <span className="font-bold">${yoy.thisYearCost.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span>Last year waste cost</span>
                          <span className="font-bold">${yoy.lastYearCost.toLocaleString()}</span>
                        </div>
                        <div className={`flex justify-between text-xs font-bold mt-1 ${yoy.change > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          <span>Year-over-year change</span>
                          <span>{yoy.change > 0 ? '+' : ''}{yoy.change}%</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Top 10 waste items */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Top 10 Money-Wasting Items</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {summary.topWasteItems.length === 0 ? (
                      <p className="text-xs text-gray-400 p-3">No waste data in this range</p>
                    ) : (
                      <div className="divide-y">
                        {summary.topWasteItems.map((item, idx) => (
                          <div key={item.itemId} className="flex items-center justify-between px-3 py-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-black w-5 ${idx === 0 ? 'text-red-600' : idx === 1 ? 'text-orange-500' : 'text-gray-400'}`}>
                                #{idx + 1}
                              </span>
                              <div>
                                <p className="text-sm font-medium">{item.itemName}</p>
                                <p className="text-[10px] text-gray-400">{item.category} · {item.totalWasted} units wasted</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-red-600">${item.totalCost.toFixed(2)}</p>
                              <p className="text-[10px] text-gray-400">${item.costPerUnit.toFixed(2)}/unit</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Item cost editor */}
                <Card className="border border-dashed">
                  <CardContent className="p-3">
                    {!editingCosts ? (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold">Item Cost Setup</p>
                          <p className="text-[10px] text-gray-500">Set actual cost per unit for accurate $ totals</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={startEditCosts}>Edit Costs</Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <p className="text-xs font-bold">Set Cost Per Unit ($)</p>
                        <div className="max-h-60 overflow-y-auto space-y-1.5">
                          {inventory.map((item) => (
                            <div key={item.id} className="flex items-center gap-2">
                              <span className="text-xs flex-1 truncate">{item.name}</span>
                              <span className="text-[10px] text-gray-400 w-20 truncate">{item.category}</span>
                              <input
                                type="number"
                                value={costDraft[item.id] || ''}
                                onChange={(e) => setCostDraft({ ...costDraft, [item.id]: e.target.value })}
                                className="w-16 border rounded px-1.5 py-0.5 text-xs text-right"
                                step="0.01"
                                min="0"
                                placeholder="1.25"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" onClick={saveCosts} className="flex-1 bg-green-600 hover:bg-green-700">Save</Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingCosts(false)} className="flex-1">Cancel</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">Loading data...</p>
            )}
          </div>
        )}

        {/* ── SMART ALERTS ── */}
        {tab === 'alerts' && (
          <div className="space-y-3">
            {alerts.length === 0 ? (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4 text-center">
                  <p className="text-green-700 font-semibold">No active alerts</p>
                  <p className="text-xs text-green-600 mt-1">Looking good — all patterns are within normal range</p>
                </CardContent>
              </Card>
            ) : (
              alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`border-l-4 ${
                    alert.severity === 'critical' ? 'border-l-red-500 bg-red-50' :
                    alert.severity === 'warning' ? 'border-l-yellow-500 bg-yellow-50' :
                    'border-l-blue-500 bg-blue-50'
                  }`}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${
                        alert.severity === 'critical' ? 'text-red-600' :
                        alert.severity === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold">{alert.title}</p>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                            alert.severity === 'critical' ? 'bg-red-200 text-red-700' :
                            alert.severity === 'warning' ? 'bg-yellow-200 text-yellow-700' :
                            'bg-blue-200 text-blue-700'
                          }`}>{alert.severity}</span>
                        </div>
                        <p className="text-xs text-gray-700 mt-0.5">{alert.detail}</p>
                        {alert.estimatedLoss && (
                          <p className="text-xs font-bold text-red-600 mt-1">
                            Estimated loss: ${alert.estimatedLoss.toLocaleString()}
                          </p>
                        )}
                        <span className="text-[10px] text-gray-400 capitalize">{alert.category}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}

            {/* Printable Manager Action Sheet */}
            <Card className="border-dashed">
              <CardContent className="p-3">
                <p className="text-xs font-semibold mb-1">Manager Action Sheet</p>
                <p className="text-[10px] text-gray-500 mb-2">Print a summary of all active alerts for your weekly manager review</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.print()}
                >
                  <FileDown className="h-4 w-4 mr-2" /> Print Action Sheet
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── WHAT-IF SIMULATOR ── */}
        {tab === 'whatif' && (
          <div className="space-y-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-blue-900">What-If Simulator</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  Test production decisions before they cost money. See projected waste reduction and sales risk.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Select Item</label>
                  <select
                    value={whatIfItemId}
                    onChange={(e) => { setWhatIfItemId(e.target.value); setWhatIfResult(null); }}
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="">Choose an item...</option>
                    {inventory.map((item) => (
                      <option key={item.id} value={item.id}>{item.name} ({item.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-600 block mb-1">
                    Reduce production by: <span className="text-blue-700 font-bold">{whatIfPct}%</span>
                  </label>
                  <input
                    type="range"
                    min={5} max={50} step={5}
                    value={whatIfPct}
                    onChange={(e) => { setWhatIfPct(parseInt(e.target.value)); setWhatIfResult(null); }}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400">
                    <span>5%</span><span>25%</span><span>50%</span>
                  </div>
                </div>

                <Button
                  onClick={runSimulation}
                  disabled={!whatIfItemId}
                  className="w-full bg-blue-700 hover:bg-blue-800"
                >
                  <Zap className="h-4 w-4 mr-2" /> Run Simulation
                </Button>
              </CardContent>
            </Card>

            {whatIfResult && (
              <Card className="border-2 border-blue-300">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{whatIfResult.itemName} — Simulation Results</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-gray-500">Current avg waste/shift</p>
                      <p className="text-xl font-black">{whatIfResult.currentAvgWaste}</p>
                      <p className="text-[10px] text-gray-400">units</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-2 text-center">
                      <p className="text-[10px] text-green-600">Projected waste/shift</p>
                      <p className="text-xl font-black text-green-700">{whatIfResult.projectedWaste}</p>
                      <p className="text-[10px] text-green-500">units</p>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm font-bold text-green-800">
                      Estimated savings: ${whatIfResult.estimatedSavings.toLocaleString()}/month
                    </p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Reducing waste by {whatIfResult.wasteReduction} units/shift
                    </p>
                  </div>

                  <div className={`border rounded-lg p-3 ${
                    whatIfResult.salesRisk === 'high' ? 'bg-red-50 border-red-200' :
                    whatIfResult.salesRisk === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <p className={`text-xs font-bold ${
                      whatIfResult.salesRisk === 'high' ? 'text-red-700' :
                      whatIfResult.salesRisk === 'medium' ? 'text-yellow-700' : 'text-green-700'
                    }`}>
                      Sales Risk: {whatIfResult.salesRisk.toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-700 mt-0.5">{whatIfResult.salesRiskNote}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── STORE SCORECARD ── */}
        {tab === 'scorecard' && (
          <div className="space-y-3">
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="p-3">
                <p className="text-xs font-bold text-yellow-900">Store Rankings</p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  Only stores with data on this device are shown. Lower waste % = better rank.
                </p>
              </CardContent>
            </Card>

            {scorecard.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-gray-500">No multi-store data available on this device.</p>
                  <p className="text-xs text-gray-400 mt-1">Log in from different store accounts to build the leaderboard.</p>
                </CardContent>
              </Card>
            ) : (
              scorecard.map((store) => (
                <Card key={store.storeId} className={`${
                  store.badge === 'gold' ? 'border-2 border-yellow-400 bg-yellow-50' :
                  store.badge === 'silver' ? 'border-2 border-gray-300 bg-gray-50' :
                  store.badge === 'bronze' ? 'border-2 border-amber-600 bg-amber-50' : ''
                }`}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`text-xl font-black ${
                          store.badge === 'gold' ? 'text-yellow-500' :
                          store.badge === 'silver' ? 'text-gray-400' :
                          store.badge === 'bronze' ? 'text-amber-600' : 'text-gray-400'
                        }`}>
                          {store.badge === 'gold' ? '🥇' : store.badge === 'silver' ? '🥈' : store.badge === 'bronze' ? '🥉' : `#${store.rank}`}
                        </span>
                        <div>
                          <p className="text-sm font-bold">{store.storeName}</p>
                          <p className="text-[10px] text-gray-400">{store.totalEntries} entries recorded</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${store.wastePercent < 10 ? 'text-green-600' : store.wastePercent < 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {store.wastePercent}%
                        </p>
                        <p className="text-[10px] text-gray-400">waste rate</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-white rounded p-1.5 text-center">
                        <p className="font-bold text-green-700">{store.sellThrough}%</p>
                        <p className="text-gray-400">sell-through</p>
                      </div>
                      <div className="bg-white rounded p-1.5 text-center">
                        <p className="font-bold text-red-600">${store.totalWasteCost.toLocaleString()}</p>
                        <p className="text-gray-400">waste cost</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* ── ROI REPORT ── */}
        {tab === 'roi' && roi && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold">Monthly ROI Report — {roi.month}</h3>
              <Button onClick={downloadROIPDF} variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-1" /> PDF
              </Button>
            </div>

            <div id="roi-print-section" className="space-y-4">
              {/* Month comparison */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-red-600">Waste Cost This Month</p>
                    <p className="text-2xl font-black text-red-700">${roi.totalWasteCostThisMonth.toLocaleString()}</p>
                  </CardContent>
                </Card>
                <Card className="bg-gray-50 border-gray-200">
                  <CardContent className="p-3 text-center">
                    <p className="text-[10px] text-gray-600">Waste Cost Last Month</p>
                    <p className="text-2xl font-black text-gray-700">${roi.totalWasteCostLastMonth.toLocaleString()}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className={`border-2 ${roi.percentChange < 0 ? 'border-green-400 bg-green-50' : 'border-red-400 bg-red-50'}`}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className={`text-lg font-black ${roi.percentChange < 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {roi.percentChange > 0 ? '+' : ''}{roi.percentChange}% vs last month
                    </p>
                    {roi.estimatedSaved > 0 && (
                      <p className="text-sm text-green-700 font-semibold">
                        ~${roi.estimatedSaved.toLocaleString()} saved this month
                      </p>
                    )}
                  </div>
                  {roi.percentChange < 0
                    ? <TrendingDown className="h-8 w-8 text-green-600" />
                    : <TrendingUp className="h-8 w-8 text-red-600" />
                  }
                </CardContent>
              </Card>

              {roi.topImprovements.length > 0 && (
                <Card className="bg-green-50 border-green-200">
                  <CardContent className="p-3">
                    <p className="text-xs font-bold text-green-800 mb-2">Top Improvements</p>
                    {roi.topImprovements.map((s, i) => (
                      <p key={i} className="text-xs text-green-700">✓ {s}</p>
                    ))}
                  </CardContent>
                </Card>
              )}

              {roi.topConcerns.length > 0 && (
                <Card className="bg-red-50 border-red-200">
                  <CardContent className="p-3">
                    <p className="text-xs font-bold text-red-800 mb-2">Areas of Concern</p>
                    {roi.topConcerns.map((s, i) => (
                      <p key={i} className="text-xs text-red-700">⚠ {s}</p>
                    ))}
                  </CardContent>
                </Card>
              )}

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-3">
                  <p className="text-xs font-bold text-blue-800 mb-2">Recommended Next Actions</p>
                  {roi.recommendations.map((s, i) => (
                    <p key={i} className="text-xs text-blue-700 mb-1">→ {s}</p>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
