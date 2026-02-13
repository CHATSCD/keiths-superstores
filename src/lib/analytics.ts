'use client';

import {
  ProductionEntry, WasteEntry, InventoryItem, Employee,
  SmartAlert, AlertSeverity, ExecutiveSummary, WasteMoneyEntry,
  WhatIfResult, StoreScore, ROIReport,
} from '@/types';
import { STORE_LOCATIONS, getStoreById } from '@/data/stores';

const DEFAULT_COST = 1.25; // $ per unit if costPerUnit not set

// ─── Helpers ─────────────────────────────────────────────────────────────────
function costOf(item: InventoryItem) {
  return item.costPerUnit && item.costPerUnit > 0 ? item.costPerUnit : DEFAULT_COST;
}

function dateRange(daysBack: number): { start: Date; end: Date } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - daysBack);
  return { start, end };
}

function inRange(dateStr: string, start: Date, end: Date): boolean {
  const d = new Date(dateStr);
  return d >= start && d <= end;
}

function isoWeek(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return monday.toISOString().split('T')[0];
}

export function getSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'fall';
  return 'winter';
}

// ─── Executive Summary ────────────────────────────────────────────────────────
export function buildExecutiveSummary(
  wasteEntries: WasteEntry[],
  productionEntries: ProductionEntry[],
  inventory: InventoryItem[],
  daysBack = 30
): ExecutiveSummary {
  const { start, end } = dateRange(daysBack);
  const inv = Object.fromEntries(inventory.map((i) => [i.id, i]));

  const filteredWaste = wasteEntries.filter((e) => inRange(e.date, start, end));
  const filteredProd = productionEntries.filter((e) => inRange(e.date, start, end));

  // Waste $ by item
  const wasteByItem: Record<string, { qty: number; cost: number; item: InventoryItem }> = {};
  for (const entry of filteredWaste) {
    for (const line of entry.items) {
      const invItem = inv[line.itemId];
      if (!invItem) continue;
      const c = costOf(invItem);
      if (!wasteByItem[line.itemId]) {
        wasteByItem[line.itemId] = { qty: 0, cost: 0, item: invItem };
      }
      wasteByItem[line.itemId].qty += line.quantity;
      wasteByItem[line.itemId].cost += line.quantity * c;
    }
  }

  // Produced $ by item
  let totalProducedCost = 0;
  for (const entry of filteredProd) {
    for (const line of entry.items) {
      const invItem = inv[line.itemId];
      if (!invItem) continue;
      totalProducedCost += line.quantity * costOf(invItem);
    }
  }

  const totalWasteCost = Object.values(wasteByItem).reduce((s, v) => s + v.cost, 0);
  const wastePercent = totalProducedCost > 0
    ? Math.round((totalWasteCost / totalProducedCost) * 100)
    : 0;

  const topWasteItems: WasteMoneyEntry[] = Object.values(wasteByItem)
    .map(({ qty, cost, item }) => ({
      itemId: item.id,
      itemName: item.name,
      category: item.category,
      totalWasted: qty,
      costPerUnit: costOf(item),
      totalCost: cost,
      wastePercent: totalProducedCost > 0 ? Math.round((cost / totalProducedCost) * 100) : 0,
    }))
    .sort((a, b) => b.totalCost - a.totalCost)
    .slice(0, 10);

  // Weekly trend (last 8 weeks)
  const weeklyMap: Record<string, { wasteCost: number; producedCost: number }> = {};
  for (const entry of wasteEntries) {
    const w = isoWeek(entry.date);
    if (!weeklyMap[w]) weeklyMap[w] = { wasteCost: 0, producedCost: 0 };
    for (const line of entry.items) {
      const invItem = inv[line.itemId];
      if (invItem) weeklyMap[w].wasteCost += line.quantity * costOf(invItem);
    }
  }
  for (const entry of productionEntries) {
    const w = isoWeek(entry.date);
    if (!weeklyMap[w]) weeklyMap[w] = { wasteCost: 0, producedCost: 0 };
    for (const line of entry.items) {
      const invItem = inv[line.itemId];
      if (invItem) weeklyMap[w].producedCost += line.quantity * costOf(invItem);
    }
  }

  const weeklyTrend = Object.entries(weeklyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-8)
    .map(([week, v]) => ({ week, ...v }));

  return {
    totalWasteCost,
    totalProducedCost,
    wastePercent,
    topWasteItems,
    savingsAt10Pct: Math.round(totalWasteCost * 0.1),
    savingsAt20Pct: Math.round(totalWasteCost * 0.2),
    weeklyTrend,
  };
}

// ─── Smart Alerts ─────────────────────────────────────────────────────────────
export function generateSmartAlerts(
  wasteEntries: WasteEntry[],
  productionEntries: ProductionEntry[],
  inventory: InventoryItem[],
  employees: Employee[]
): SmartAlert[] {
  const alerts: SmartAlert[] = [];
  const inv = Object.fromEntries(inventory.map((i) => [i.id, i]));
  const id = () => `alert-${Math.random().toString(36).slice(2, 8)}`;

  // Sort by date desc
  const sortedWaste = [...wasteEntries].sort((a, b) => b.date.localeCompare(a.date));
  const sortedProd = [...productionEntries].sort((a, b) => b.date.localeCompare(a.date));

  // 1. Item wasted 3 consecutive shifts
  const wasteByItemShift: Record<string, string[]> = {};
  for (const entry of sortedWaste) {
    for (const line of entry.items) {
      if (line.quantity > 0) {
        if (!wasteByItemShift[line.itemId]) wasteByItemShift[line.itemId] = [];
        wasteByItemShift[line.itemId].push(`${entry.date}-${entry.shift}`);
      }
    }
  }
  for (const [itemId, shifts] of Object.entries(wasteByItemShift)) {
    const unique = [...new Set(shifts)].slice(0, 5);
    if (unique.length >= 3) {
      const invItem = inv[itemId];
      if (invItem) {
        alerts.push({
          id: id(),
          severity: 'warning',
          title: 'Repeated Waste Pattern',
          detail: `${invItem.name} has been wasted in ${unique.length} recent shifts. Check cook quantity or shelf life.`,
          category: 'waste',
          itemName: invItem.name,
          estimatedLoss: Math.round(unique.length * 3 * costOf(invItem)),
        });
      }
    }
  }

  // 2. Employee waste % exceeds store average
  const storeWasteTotal = sortedWaste.reduce((s, e) => s + e.items.reduce((ss, i) => ss + i.quantity, 0), 0);
  const storeProdTotal = sortedProd.reduce((s, e) => s + e.items.reduce((ss, i) => ss + i.quantity, 0), 0);
  const storeAvgWaste = storeProdTotal > 0 ? (storeWasteTotal / storeProdTotal) * 100 : 0;

  for (const emp of employees) {
    const empProd = sortedProd.filter((e) => e.employeeId === emp.id);
    const empWaste = sortedWaste.filter((e) => e.employeeId === emp.id);
    const empProdTotal = empProd.reduce((s, e) => s + e.items.reduce((ss, i) => ss + i.quantity, 0), 0);
    const empWasteTotal = empWaste.reduce((s, e) => s + e.items.reduce((ss, i) => ss + i.quantity, 0), 0);
    if (empProdTotal < 10) continue;
    const empWastePct = (empWasteTotal / empProdTotal) * 100;
    if (empWastePct > storeAvgWaste * 1.5 && empWastePct > 15) {
      alerts.push({
        id: id(),
        severity: 'critical',
        title: 'Employee Waste Above Average',
        detail: `${emp.name}'s waste rate (${Math.round(empWastePct)}%) is ${Math.round(empWastePct - storeAvgWaste)}% above store average. Review training or scheduling.`,
        category: 'employee',
        employeeName: emp.name,
      });
    }
  }

  // 3. Underproduction + sales drop signal
  const recent14 = sortedProd.filter((e) => {
    const d = new Date(e.date);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 14);
    return d >= cutoff;
  });
  const shiftsWithSales = recent14.filter((e) => (e.totalSales ?? 0) > 0 || (e.deliSales ?? 0) > 0);
  if (shiftsWithSales.length >= 4) {
    const avgSales = shiftsWithSales.reduce((s, e) => s + (e.totalSales || (e.deliSales || 0) + (e.brandedDeliSales || 0)), 0) / shiftsWithSales.length;
    const avgProd = shiftsWithSales.reduce((s, e) => s + e.items.reduce((ss, i) => ss + i.quantity, 0), 0) / shiftsWithSales.length;
    const lowProdShifts = shiftsWithSales.filter((e) => {
      const qty = e.items.reduce((s, i) => s + i.quantity, 0);
      const sales = e.totalSales || (e.deliSales || 0) + (e.brandedDeliSales || 0);
      return qty < avgProd * 0.75 && sales < avgSales * 0.85;
    });
    if (lowProdShifts.length >= 2) {
      const lostSales = Math.round((avgSales - (lowProdShifts.reduce((s, e) => s + (e.totalSales || 0), 0) / lowProdShifts.length)) * lowProdShifts.length);
      alerts.push({
        id: id(),
        severity: 'critical',
        title: 'Undercooking → Lost Sales Detected',
        detail: `${lowProdShifts.length} shifts with low production also had below-average sales. Estimated lost revenue: ~$${lostSales}.`,
        category: 'production',
        estimatedLoss: lostSales,
      });
    }
  }

  // 4. Inventory consistently below par
  for (const item of inventory) {
    if ((item.parLevel || 0) === 0) continue;
    const recentProd = sortedProd.slice(0, 20);
    const itemQty = recentProd.reduce((s, e) => {
      const found = e.items.find((i) => i.itemId === item.id);
      return s + (found?.quantity || 0);
    }, 0);
    const avgPerEntry = recentProd.length > 0 ? itemQty / recentProd.length : 0;
    if (recentProd.length >= 5 && avgPerEntry < item.parLevel * 0.5) {
      alerts.push({
        id: id(),
        severity: 'warning',
        title: 'Consistently Below Par',
        detail: `${item.name} averages ${Math.round(avgPerEntry)} units per shift vs par of ${item.parLevel}. Adjust par level or increase production.`,
        category: 'inventory',
        itemName: item.name,
      });
    }
  }

  // 5. Loss Prevention: waste logged but no matching production
  const last7Days = new Date();
  last7Days.setDate(last7Days.getDate() - 7);
  const recentWaste = sortedWaste.filter((e) => new Date(e.date) >= last7Days);
  const recentProdByDate: Record<string, Set<string>> = {};
  for (const entry of sortedProd.filter((e) => new Date(e.date) >= last7Days)) {
    if (!recentProdByDate[entry.date]) recentProdByDate[entry.date] = new Set();
    entry.items.forEach((i) => recentProdByDate[entry.date].add(i.itemId));
  }

  const noMatchWaste: Record<string, number> = {};
  for (const entry of recentWaste) {
    for (const line of entry.items) {
      const producedOnDay = recentProdByDate[entry.date];
      if (!producedOnDay || !producedOnDay.has(line.itemId)) {
        noMatchWaste[line.itemId] = (noMatchWaste[line.itemId] || 0) + line.quantity;
      }
    }
  }
  for (const [itemId, qty] of Object.entries(noMatchWaste)) {
    if (qty >= 3) {
      const invItem = inv[itemId];
      if (invItem) {
        alerts.push({
          id: id(),
          severity: 'critical',
          title: 'Waste Without Production — Flag',
          detail: `${qty} units of ${invItem.name} logged as wasted but no matching production found. Verify records.`,
          category: 'loss-prevention',
          itemName: invItem.name,
          estimatedLoss: Math.round(qty * costOf(invItem)),
        });
      }
    }
  }

  // 6. Repeated damaged/dropped by same employee
  const droppedByEmp: Record<string, number> = {};
  for (const entry of recentWaste) {
    for (const line of entry.items as { reason?: string; quantity: number }[]) {
      if (line.reason === 'dropped' || line.reason === 'damaged') {
        droppedByEmp[entry.employeeId] = (droppedByEmp[entry.employeeId] || 0) + line.quantity;
      }
    }
  }
  for (const [empId, qty] of Object.entries(droppedByEmp)) {
    if (qty >= 5) {
      const emp = employees.find((e) => e.id === empId);
      if (emp) {
        alerts.push({
          id: id(),
          severity: 'warning',
          title: 'Repeated Damaged/Dropped Pattern',
          detail: `${emp.name} has logged ${qty} units as dropped or damaged in the last 7 days. Review handling procedures.`,
          category: 'loss-prevention',
          employeeName: emp.name,
        });
      }
    }
  }

  // Sort: critical first
  return alerts.sort((a, b) => {
    const order: Record<AlertSeverity, number> = { critical: 0, warning: 1, info: 2 };
    return order[a.severity] - order[b.severity];
  });
}

// ─── What-If Simulator ────────────────────────────────────────────────────────
export function runWhatIf(
  itemId: string,
  reductionPct: number,
  wasteEntries: WasteEntry[],
  productionEntries: ProductionEntry[],
  inventory: InventoryItem[]
): WhatIfResult | null {
  const item = inventory.find((i) => i.id === itemId);
  if (!item) return null;

  const { start, end } = dateRange(90);
  const relevant = wasteEntries.filter((e) => inRange(e.date, start, end));

  let totalWasted = 0;
  let totalProduced = 0;
  for (const entry of relevant) {
    const line = entry.items.find((i) => i.itemId === itemId);
    if (line) totalWasted += line.quantity;
  }
  for (const entry of productionEntries.filter((e) => inRange(e.date, start, end))) {
    const line = entry.items.find((i) => i.itemId === itemId);
    if (line) totalProduced += line.quantity;
  }

  const avgWastePerShift = relevant.length > 0 ? totalWasted / Math.max(1, relevant.length) : 0;
  const projectedWaste = avgWastePerShift * (1 - reductionPct / 100);
  const wasteReduction = avgWastePerShift - projectedWaste;
  const estimatedSavings = Math.round(wasteReduction * costOf(item) * 30);

  const wasteRate = totalProduced > 0 ? totalWasted / totalProduced : 0;
  let salesRisk: 'low' | 'medium' | 'high' = 'low';
  let salesRiskNote = 'Historical data suggests this reduction is safe.';

  if (reductionPct > 30 && wasteRate < 0.1) {
    salesRisk = 'high';
    salesRiskNote = 'This item has low waste already — reducing further risks stock-outs.';
  } else if (reductionPct > 20 && wasteRate < 0.2) {
    salesRisk = 'medium';
    salesRiskNote = 'Moderate risk — monitor daily for the first two weeks.';
  }

  return {
    itemName: item.name,
    currentAvgWaste: Math.round(avgWastePerShift * 10) / 10,
    projectedWaste: Math.round(projectedWaste * 10) / 10,
    wasteReduction: Math.round(wasteReduction * 10) / 10,
    estimatedSavings,
    salesRisk,
    salesRiskNote,
  };
}

// ─── Store Scorecard ──────────────────────────────────────────────────────────
export function buildStoreScorecard(inventory: InventoryItem[]): StoreScore[] {
  if (typeof window === 'undefined') return [];

  const scores: StoreScore[] = [];

  for (const store of STORE_LOCATIONS) {
    const prefix = `keiths-${store.id}-`;
    // Check if store has any production data
    const prodKey = `${prefix}production-entries`;
    const wasteKey = `${prefix}waste-entries`;
    const rawProd = localStorage.getItem(prodKey);
    const rawWaste = localStorage.getItem(wasteKey);
    if (!rawProd && !rawWaste) continue;

    const prod: ProductionEntry[] = rawProd ? JSON.parse(rawProd) : [];
    const waste: WasteEntry[] = rawWaste ? JSON.parse(rawWaste) : [];
    if (prod.length === 0 && waste.length === 0) continue;

    const totalProduced = prod.reduce((s, e) => s + e.items.reduce((ss, i) => ss + i.quantity, 0), 0);
    const totalWasted = waste.reduce((s, e) => s + e.items.reduce((ss, i) => ss + i.quantity, 0), 0);
    const wastePercent = totalProduced > 0 ? Math.round((totalWasted / totalProduced) * 100) : 0;
    const sellThrough = 100 - wastePercent;

    let totalWasteCost = 0;
    for (const entry of waste) {
      for (const line of entry.items) {
        const invItem = inventory.find((i) => i.id === line.itemId);
        totalWasteCost += line.quantity * (invItem ? costOf(invItem) : DEFAULT_COST);
      }
    }

    scores.push({
      storeId: store.id,
      storeName: store.name,
      wastePercent,
      sellThrough,
      totalEntries: prod.length + waste.length,
      totalWasteCost: Math.round(totalWasteCost),
      rank: 0,
    });
  }

  // Rank by wastePercent ascending (lower = better)
  scores.sort((a, b) => a.wastePercent - b.wastePercent);
  scores.forEach((s, i) => {
    s.rank = i + 1;
    if (i === 0) s.badge = 'gold';
    else if (i === 1) s.badge = 'silver';
    else if (i === 2) s.badge = 'bronze';
  });

  return scores;
}

// ─── ROI Report ───────────────────────────────────────────────────────────────
export function buildROIReport(
  wasteEntries: WasteEntry[],
  productionEntries: ProductionEntry[],
  inventory: InventoryItem[]
): ROIReport {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const inv = Object.fromEntries(inventory.map((i) => [i.id, i]));

  function wasteCostInRange(start: Date, end: Date) {
    return wasteEntries
      .filter((e) => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      })
      .reduce((total, entry) => {
        return total + entry.items.reduce((s, line) => {
          const invItem = inv[line.itemId];
          return s + line.quantity * (invItem ? costOf(invItem) : DEFAULT_COST);
        }, 0);
      }, 0);
  }

  const thisMonthCost = Math.round(wasteCostInRange(thisMonthStart, now));
  const lastMonthCost = Math.round(wasteCostInRange(lastMonthStart, lastMonthEnd));
  const percentChange = lastMonthCost > 0
    ? Math.round(((thisMonthCost - lastMonthCost) / lastMonthCost) * 100)
    : 0;
  const estimatedSaved = lastMonthCost > thisMonthCost ? lastMonthCost - thisMonthCost : 0;

  // Top improvements (items where waste cost fell most)
  const thisMonthByItem: Record<string, number> = {};
  const lastMonthByItem: Record<string, number> = {};
  for (const entry of wasteEntries) {
    const d = new Date(entry.date);
    for (const line of entry.items) {
      const cost = line.quantity * (inv[line.itemId] ? costOf(inv[line.itemId]) : DEFAULT_COST);
      if (d >= thisMonthStart && d <= now) thisMonthByItem[line.itemId] = (thisMonthByItem[line.itemId] || 0) + cost;
      if (d >= lastMonthStart && d <= lastMonthEnd) lastMonthByItem[line.itemId] = (lastMonthByItem[line.itemId] || 0) + cost;
    }
  }

  const improvements: { name: string; delta: number }[] = [];
  const concerns: { name: string; delta: number }[] = [];

  for (const itemId of Object.keys({ ...thisMonthByItem, ...lastMonthByItem })) {
    const invItem = inv[itemId];
    if (!invItem) continue;
    const delta = (thisMonthByItem[itemId] || 0) - (lastMonthByItem[itemId] || 0);
    if (delta < -2) improvements.push({ name: invItem.name, delta });
    if (delta > 5) concerns.push({ name: invItem.name, delta });
  }

  improvements.sort((a, b) => a.delta - b.delta);
  concerns.sort((a, b) => b.delta - a.delta);

  const recommendations: string[] = [];
  if (percentChange > 10) recommendations.push('Waste cost is rising — review recent employee scheduling changes');
  if (concerns.length > 0) recommendations.push(`Focus on reducing ${concerns[0].name} waste — highest increase this month`);
  if (percentChange < -10) recommendations.push('Great progress this month — share what\'s working with other stores');
  if (improvements.length > 0) recommendations.push(`${improvements[0].name} waste improved most — identify what changed and replicate it`);
  if (recommendations.length === 0) recommendations.push('Continue current practices — track production-to-sales ratio weekly');

  const month = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return {
    month,
    totalWasteCostThisMonth: thisMonthCost,
    totalWasteCostLastMonth: lastMonthCost,
    percentChange,
    estimatedSaved,
    topImprovements: improvements.slice(0, 3).map((i) => `${i.name}: saved ~$${Math.abs(Math.round(i.delta))}`),
    topConcerns: concerns.slice(0, 3).map((i) => `${i.name}: +$${Math.round(i.delta)} waste cost`),
    recommendations,
  };
}

// ─── Shift Difficulty Weight ──────────────────────────────────────────────────
export function shiftDifficultyMultiplier(entry: ProductionEntry): number {
  let weight = 1.0;
  // Day of week: weekend = harder
  const d = new Date(entry.date).getDay();
  if (d === 0 || d === 6) weight += 0.15;
  // Event / promo day
  if (entry.eventFlag) weight += 0.25;
  // Night shift
  if (entry.shift === 'Night') weight += 0.1;
  return weight;
}

export function adjustedProductionScore(
  rawScore: number,
  entries: ProductionEntry[]
): { adjusted: number; context: string } {
  if (entries.length === 0) return { adjusted: rawScore, context: '' };
  const avgMultiplier = entries.reduce((s, e) => s + shiftDifficultyMultiplier(e), 0) / entries.length;
  const adjusted = Math.round(rawScore / avgMultiplier);
  const pct = Math.round((avgMultiplier - 1) * 100);
  const context = pct > 0
    ? `Scored on shifts averaging ${pct}% above baseline difficulty`
    : '';
  return { adjusted, context };
}

// ─── Seasonal Intelligence ────────────────────────────────────────────────────
export function getSeasonalParAdjustment(item: InventoryItem): number {
  const season = getSeason();
  if (!item.seasonalTags || item.seasonalTags.length === 0) return 1.0;
  if (item.seasonalTags.includes(season)) return 1.2; // 20% boost in-season
  return 0.9; // 10% reduction off-season
}

export function getYearOverYearComparison(
  wasteEntries: WasteEntry[],
  inventory: InventoryItem[]
): { thisYearCost: number; lastYearCost: number; change: number } {
  const now = new Date();
  const thisYearStart = new Date(now.getFullYear(), 0, 1);
  const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
  const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31);
  const inv = Object.fromEntries(inventory.map((i) => [i.id, i]));

  function cost(entries: WasteEntry[]) {
    return Math.round(entries.reduce((total, entry) => {
      return total + entry.items.reduce((s, line) => {
        const invItem = inv[line.itemId];
        return s + line.quantity * (invItem ? costOf(invItem) : DEFAULT_COST);
      }, 0);
    }, 0));
  }

  const thisYear = cost(wasteEntries.filter((e) => new Date(e.date) >= thisYearStart));
  const lastYear = cost(wasteEntries.filter((e) => {
    const d = new Date(e.date);
    return d >= lastYearStart && d <= lastYearEnd;
  }));

  const change = lastYear > 0 ? Math.round(((thisYear - lastYear) / lastYear) * 100) : 0;
  return { thisYearCost: thisYear, lastYearCost: lastYear, change };
}
