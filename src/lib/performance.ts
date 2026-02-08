import {
  Employee,
  InventoryItem,
  ProductionEntry,
  WasteEntry,
  EmployeePerformance,
  WeeklyCount,
  OrderSuggestion,
} from '@/types';
import { CATEGORIES } from '@/data/inventory';

export function calculateEmployeePerformance(
  employee: Employee,
  productionEntries: ProductionEntry[],
  wasteEntries: WasteEntry[],
  inventory: InventoryItem[],
  weeklyCounts: WeeklyCount[]
): EmployeePerformance {
  const empProduction = productionEntries.filter((e) => e.employeeId === employee.id);
  const empWaste = wasteEntries.filter((e) => e.employeeId === employee.id);

  // Total cooked
  let totalCooked = 0;
  const cookedByCategory: Record<string, number> = {};

  for (const entry of empProduction) {
    for (const item of entry.items) {
      totalCooked += item.quantity;
      const invItem = inventory.find((i) => i.id === item.itemId);
      if (invItem) {
        cookedByCategory[invItem.category] = (cookedByCategory[invItem.category] || 0) + item.quantity;
      }
    }
  }

  // Total wasted
  let totalWasted = 0;
  const wastedByCategory: Record<string, number> = {};

  for (const entry of empWaste) {
    for (const item of entry.items) {
      totalWasted += item.quantity;
      const invItem = inventory.find((i) => i.id === item.itemId);
      if (invItem) {
        wastedByCategory[invItem.category] = (wastedByCategory[invItem.category] || 0) + item.quantity;
      }
    }
  }

  // Production Score: (Actual / Par) * 100
  const totalParLevel = inventory.reduce((sum, item) => sum + item.parLevel, 0);
  const productionScore = totalParLevel > 0 ? Math.round((totalCooked / totalParLevel) * 100) : 0;

  // Sell-Through Rate: (Sold / Cooked) * 100
  const totalSold = totalCooked - totalWasted;
  const sellThroughRate = totalCooked > 0 ? Math.round((totalSold / totalCooked) * 100) : 0;

  // Category Coverage
  const categoriesCooked = Object.keys(cookedByCategory).length;
  const categoryCoverage = categoriesCooked;

  // Waste percentage
  const wastePercentage = totalCooked > 0 ? Math.round((totalWasted / totalCooked) * 100) : 0;

  // Determine status and issues
  const issues: string[] = [];
  let status: 'good' | 'undercooking' | 'overcooking' = 'good';

  if (productionScore < 80) {
    status = 'undercooking';
    // Find which categories are undercooked
    for (const cat of CATEGORIES) {
      const catItems = inventory.filter((i) => i.category === cat);
      const catPar = catItems.reduce((s, i) => s + i.parLevel, 0);
      const catCooked = cookedByCategory[cat] || 0;
      if (catPar > 0 && catCooked / catPar < 0.5) {
        issues.push(`Not cooking enough ${cat}`);
      }
    }
  } else if (productionScore > 120) {
    status = 'overcooking';
  }

  // High waste categories
  for (const cat of CATEGORIES) {
    const catCooked = cookedByCategory[cat] || 0;
    const catWasted = wastedByCategory[cat] || 0;
    if (catCooked > 0 && catWasted / catCooked > 0.3) {
      issues.push(`Too much waste in ${cat}`);
      if (status === 'good') status = 'overcooking';
    }
  }

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    productionScore,
    sellThroughRate,
    categoryCoverage,
    totalCooked,
    totalWasted,
    wastePercentage,
    status,
    issues,
  };
}

export function calculateOrderSuggestions(
  inventory: InventoryItem[],
  weeklyCounts: WeeklyCount[],
  wasteEntries: WasteEntry[]
): OrderSuggestion[] {
  // Sort weekly counts by date
  const sorted = [...weeklyCounts].sort(
    (a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime()
  );

  const thisWeek = sorted[0];
  const lastWeek = sorted[1];

  if (!thisWeek) return [];

  const suggestions: OrderSuggestion[] = [];

  for (const invItem of inventory) {
    const thisWeekItem = thisWeek.items.find((i) => i.itemId === invItem.id);
    const lastWeekItem = lastWeek?.items.find((i) => i.itemId === invItem.id);

    const thisWeekSold = thisWeekItem?.sold || 0;
    const lastWeekSold = lastWeekItem?.sold || 0;
    const thisWeekWasted = thisWeekItem?.wasted || 0;

    const percentChange =
      lastWeekSold > 0 ? Math.round(((thisWeekSold - lastWeekSold) / lastWeekSold) * 100) : 0;

    const wasteRate = thisWeekSold + thisWeekWasted > 0
      ? Math.round((thisWeekWasted / (thisWeekSold + thisWeekWasted)) * 100)
      : 0;

    let trend: 'hot' | 'cold' | 'stable' = 'stable';
    let suggestion = 'Maintain current order';
    let priority: 'high' | 'medium' | 'low' = 'low';
    let suggestedOrder = invItem.parLevel;

    if (percentChange >= 15) {
      trend = 'hot';
      suggestion = `Sales up ${percentChange}% — order more`;
      suggestedOrder = Math.ceil(invItem.parLevel * (1 + percentChange / 100));
      priority = percentChange >= 30 ? 'high' : 'medium';
    } else if (percentChange <= -15) {
      trend = 'cold';
      suggestion = `Sales down ${Math.abs(percentChange)}% — order less`;
      suggestedOrder = Math.max(1, Math.floor(invItem.parLevel * (1 + percentChange / 100)));
      priority = percentChange <= -30 ? 'high' : 'medium';
    }

    // High waste override
    if (wasteRate > 25) {
      suggestion += `. High waste (${wasteRate}%) — reduce par`;
      suggestedOrder = Math.max(1, suggestedOrder - Math.ceil(suggestedOrder * wasteRate / 200));
      if (priority === 'low') priority = 'medium';
    }

    suggestions.push({
      itemId: invItem.id,
      itemName: invItem.name,
      category: invItem.category,
      lastWeekSold,
      thisWeekSold,
      percentChange,
      wasteRate,
      trend,
      suggestion,
      suggestedOrder,
      priority,
    });
  }

  // Sort by priority then by absolute percent change
  return suggestions.sort((a, b) => {
    const pOrder = { high: 0, medium: 1, low: 2 };
    if (pOrder[a.priority] !== pOrder[b.priority]) {
      return pOrder[a.priority] - pOrder[b.priority];
    }
    return Math.abs(b.percentChange) - Math.abs(a.percentChange);
  });
}
