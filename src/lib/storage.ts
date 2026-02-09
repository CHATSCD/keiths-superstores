'use client';

import { Employee, InventoryItem, ProductionEntry, WasteEntry, WeeklyCount, BubbleConfig } from '@/types';
import { DEFAULT_INVENTORY } from '@/data/inventory';

const KEYS = {
  employees: 'keiths-employees',
  inventory: 'keiths-inventory-items',
  production: 'keiths-production-entries',
  waste: 'keiths-waste-entries',
  weeklyCounts: 'keiths-weekly-counts',
  enabledItems: 'keiths-enabled-items',
  bubbleConfig: 'keiths-bubble-config',
  locationName: 'keiths-location-name',
} as const;

function getItem<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

// Employees
export function getEmployees(): Employee[] {
  return getItem<Employee[]>(KEYS.employees, []);
}

export function saveEmployees(employees: Employee[]): void {
  setItem(KEYS.employees, employees);
}

export function addEmployee(employee: Employee): void {
  const employees = getEmployees();
  employees.push(employee);
  saveEmployees(employees);
}

export function removeEmployee(id: string): void {
  const employees = getEmployees().filter((e) => e.id !== id);
  saveEmployees(employees);
}

// Inventory
export function getInventory(): InventoryItem[] {
  const items = getItem<InventoryItem[]>(KEYS.inventory, []);
  if (items.length === 0) {
    setItem(KEYS.inventory, DEFAULT_INVENTORY);
    return DEFAULT_INVENTORY;
  }
  return items;
}

export function saveInventory(items: InventoryItem[]): void {
  setItem(KEYS.inventory, items);
}

export function updateInventoryItem(item: InventoryItem): void {
  const items = getInventory();
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    items[idx] = item;
    saveInventory(items);
  }
}

export function addCustomItem(item: InventoryItem): void {
  const items = getInventory();
  items.push(item);
  saveInventory(items);
}

export function deleteCustomItem(id: string): void {
  const items = getInventory().filter((i) => i.id !== id);
  saveInventory(items);
  // Also remove from enabled items
  const enabled = getEnabledItemIds();
  const updated = enabled.filter((eid) => eid !== id);
  setItem(KEYS.enabledItems, updated);
}

// Enabled Items (store item toggles)
export function getEnabledItemIds(): string[] {
  const stored = getItem<string[] | null>(KEYS.enabledItems, null);
  if (stored === null) {
    // Default: all items enabled
    const allIds = getInventory().map((i) => i.id);
    setItem(KEYS.enabledItems, allIds);
    return allIds;
  }
  return stored;
}

export function setEnabledItemIds(ids: string[]): void {
  setItem(KEYS.enabledItems, ids);
}

export function toggleItemEnabled(itemId: string): void {
  const enabled = getEnabledItemIds();
  if (enabled.includes(itemId)) {
    setItem(KEYS.enabledItems, enabled.filter((id) => id !== itemId));
  } else {
    setItem(KEYS.enabledItems, [...enabled, itemId]);
  }
}

export function getEnabledItems(): InventoryItem[] {
  const all = getInventory();
  const enabledIds = getEnabledItemIds();
  return all.filter((item) => enabledIds.includes(item.id));
}

// Bubble Config
export function getBubbleConfig(): BubbleConfig {
  return getItem<BubbleConfig>(KEYS.bubbleConfig, { increment: 1, maxQuantity: 30 });
}

export function saveBubbleConfig(config: BubbleConfig): void {
  setItem(KEYS.bubbleConfig, config);
}

// Production Entries
export function getProductionEntries(): ProductionEntry[] {
  return getItem<ProductionEntry[]>(KEYS.production, []);
}

export function saveProductionEntry(entry: ProductionEntry): void {
  const entries = getProductionEntries();
  entries.push(entry);
  setItem(KEYS.production, entries);
}

export function getProductionEntriesByDate(date: string): ProductionEntry[] {
  return getProductionEntries().filter((e) => e.date === date);
}

export function deleteProductionEntry(id: string): void {
  const entries = getProductionEntries().filter((e) => e.id !== id);
  setItem(KEYS.production, entries);
}

export function updateProductionEntry(updated: ProductionEntry): void {
  const entries = getProductionEntries();
  const idx = entries.findIndex((e) => e.id === updated.id);
  if (idx >= 0) {
    entries[idx] = updated;
    setItem(KEYS.production, entries);
  }
}

// Waste Entries
export function getWasteEntries(): WasteEntry[] {
  return getItem<WasteEntry[]>(KEYS.waste, []);
}

export function saveWasteEntry(entry: WasteEntry): void {
  const entries = getWasteEntries();
  entries.push(entry);
  setItem(KEYS.waste, entries);
}

export function getWasteEntriesByDate(date: string): WasteEntry[] {
  return getWasteEntries().filter((e) => e.date === date);
}

export function deleteWasteEntry(id: string): void {
  const entries = getWasteEntries().filter((e) => e.id !== id);
  setItem(KEYS.waste, entries);
}

export function updateWasteEntry(updated: WasteEntry): void {
  const entries = getWasteEntries();
  const idx = entries.findIndex((e) => e.id === updated.id);
  if (idx >= 0) {
    entries[idx] = updated;
    setItem(KEYS.waste, entries);
  }
}

// Weekly Counts
export function getWeeklyCounts(): WeeklyCount[] {
  return getItem<WeeklyCount[]>(KEYS.weeklyCounts, []);
}

export function saveWeeklyCount(count: WeeklyCount): void {
  const counts = getWeeklyCounts();
  const idx = counts.findIndex((c) => c.id === count.id);
  if (idx >= 0) {
    counts[idx] = count;
  } else {
    counts.push(count);
  }
  setItem(KEYS.weeklyCounts, counts);
}

// Location Name
export function getLocationName(): string {
  return getItem<string>(KEYS.locationName, '');
}

export function saveLocationName(name: string): void {
  setItem(KEYS.locationName, name);
}

// Export / Import
export interface BackupData {
  version: 1;
  exportedAt: string;
  employees: Employee[];
  inventory: InventoryItem[];
  production: ProductionEntry[];
  waste: WasteEntry[];
  weeklyCounts: WeeklyCount[];
  enabledItems?: string[];
  bubbleConfig?: BubbleConfig;
  locationName?: string;
}

export function exportAllData(): BackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    employees: getEmployees(),
    inventory: getInventory(),
    production: getProductionEntries(),
    waste: getWasteEntries(),
    weeklyCounts: getWeeklyCounts(),
    enabledItems: getEnabledItemIds(),
    bubbleConfig: getBubbleConfig(),
    locationName: getLocationName(),
  };
}

export function importAllData(data: BackupData): { success: boolean; error?: string } {
  try {
    if (!data || data.version !== 1) {
      return { success: false, error: 'Invalid backup file format' };
    }
    if (data.employees) saveEmployees(data.employees);
    if (data.inventory) saveInventory(data.inventory);
    if (data.production) setItem(KEYS.production, data.production);
    if (data.waste) setItem(KEYS.waste, data.waste);
    if (data.weeklyCounts) setItem(KEYS.weeklyCounts, data.weeklyCounts);
    if (data.enabledItems) setItem(KEYS.enabledItems, data.enabledItems);
    if (data.bubbleConfig) setItem(KEYS.bubbleConfig, data.bubbleConfig);
    if (data.locationName !== undefined) saveLocationName(data.locationName);
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Import failed' };
  }
}

export function clearAllData(): void {
  Object.values(KEYS).forEach((key) => {
    if (typeof window !== 'undefined') localStorage.removeItem(key);
  });
}

// Utility
export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
