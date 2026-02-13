import { NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { withAuth, apiOk } from '@/lib/apiMiddleware';

// GET /api/analytics?range=7|30|90
export const GET = withAuth(async (req, auth) => {
  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get('range') || '7', 10);
  const storeId = auth.storeId;

  const [
    weeklyWaste,
    weeklyProd,
    topWasters,
    employeeMetrics,
    shiftStatusBreakdown,
    dailyTotals,
  ] = await Promise.all([
    // Total waste this period
    query<{ total: string }>(
      `SELECT COALESCE(SUM(s.waste_total), 0) AS total
       FROM shifts s
       WHERE s.store_id = $1 AND s.date >= NOW() - INTERVAL '${days} days'`,
      [storeId]
    ),
    // Total production this period
    query<{ total: string }>(
      `SELECT COALESCE(SUM(s.production_total), 0) AS total
       FROM shifts s
       WHERE s.store_id = $1 AND s.date >= NOW() - INTERVAL '${days} days'`,
      [storeId]
    ),
    // Top waste items
    query(
      `SELECT wl.item_name, COALESCE(SUM(wl.quantity), 0) AS total_qty, COALESCE(SUM(wl.cost), 0) AS total_cost
       FROM waste_logs wl
       JOIN shifts s ON s.id = wl.shift_id
       WHERE s.store_id = $1 AND s.date >= NOW() - INTERVAL '${days} days'
       GROUP BY wl.item_name ORDER BY total_qty DESC LIMIT 10`,
      [storeId]
    ),
    // Employee performance metrics
    query(
      `SELECT em.*
       FROM employee_metrics em
       WHERE em.store_id = $1 ORDER BY em.efficiency_score DESC`,
      [storeId]
    ),
    // Shift status breakdown
    query(
      `SELECT status, COUNT(*) AS count
       FROM shifts WHERE store_id = $1 AND date >= NOW() - INTERVAL '${days} days'
       GROUP BY status`,
      [storeId]
    ),
    // Daily waste/production totals
    query(
      `SELECT date,
         COALESCE(SUM(waste_total), 0) AS waste,
         COALESCE(SUM(production_total), 0) AS production
       FROM shifts
       WHERE store_id = $1 AND date >= NOW() - INTERVAL '${days} days'
       GROUP BY date ORDER BY date`,
      [storeId]
    ),
  ]);

  const totalWaste = parseFloat((weeklyWaste[0] as { total: string })?.total || '0');
  const totalProd = parseFloat((weeklyProd[0] as { total: string })?.total || '0');
  const wasteRatio = totalProd > 0 ? ((totalWaste / totalProd) * 100).toFixed(1) : '0';

  // AI shift suggestion: flag employees with waste_ratio > store average
  const avgWasteRatio = employeeMetrics.length > 0
    ? (employeeMetrics as Array<{ waste_ratio: number }>).reduce((s, e) => s + (e.waste_ratio || 0), 0) / employeeMetrics.length
    : 0;

  const riskyEmployees = (employeeMetrics as Array<{ name: string; waste_ratio: number; total_shifts: number }>)
    .filter((e) => e.waste_ratio > avgWasteRatio * 1.5 && e.total_shifts >= 3)
    .map((e) => ({ name: e.name, wasteRatio: e.waste_ratio }));

  return apiOk({
    period: { days },
    totals: { waste: totalWaste, production: totalProd, wasteRatio },
    topWasters,
    employeeMetrics,
    shiftStatusBreakdown,
    dailyTotals,
    aiInsights: {
      riskyEmployees,
      avgWasteRatio: avgWasteRatio.toFixed(1),
      recommendation: riskyEmployees.length > 0
        ? `${riskyEmployees.length} employee(s) have waste above 1.5× store average. Consider additional training.`
        : 'All employees performing within acceptable waste thresholds.',
    },
  });
}, 'admin', 'manager');
