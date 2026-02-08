'use client';

import { Employee, ProductionEntry, WasteEntry, WeeklyCount } from '@/types';
import { DEFAULT_INVENTORY } from '@/data/inventory';
import {
  getEmployees,
  saveEmployees,
  getProductionEntries,
  getWasteEntries,
  getWeeklyCounts,
  saveWeeklyCount,
  generateId,
  getTodayStr,
} from './storage';

const SEED_KEY = 'keiths-seeded';

function findItemId(name: string): string {
  const item = DEFAULT_INVENTORY.find((i) => i.name === name);
  return item?.id || '';
}

export function seedIfEmpty(): void {
  if (typeof window === 'undefined') return;
  if (localStorage.getItem(SEED_KEY)) return;

  // Only seed if there are no employees yet
  if (getEmployees().length > 0) {
    localStorage.setItem(SEED_KEY, '1');
    return;
  }

  const today = getTodayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // --- Employees ---
  const employees: Employee[] = [
    { id: 'emp-1', name: 'Maria Garcia', role: 'cook', active: true, createdAt: new Date().toISOString() },
    { id: 'emp-2', name: 'James Wilson', role: 'cook', active: true, createdAt: new Date().toISOString() },
    { id: 'emp-3', name: 'DeShawn Brown', role: 'cook', active: true, createdAt: new Date().toISOString() },
    { id: 'emp-4', name: 'Sarah Mitchell', role: 'manager', active: true, createdAt: new Date().toISOString() },
    { id: 'emp-5', name: 'Tyler Reed', role: 'cashier', active: true, createdAt: new Date().toISOString() },
  ];
  saveEmployees(employees);

  // --- Production Entries ---
  const productionEntries: ProductionEntry[] = [
    {
      id: generateId(),
      date: today,
      shift: 'AM',
      employeeId: 'emp-1',
      employeeName: 'Maria Garcia',
      items: [
        { itemId: findItemId('Bacon'), itemName: 'Bacon', quantity: 28 },
        { itemId: findItemId('Sausage Links'), itemName: 'Sausage Links', quantity: 20 },
        { itemId: findItemId('Biscuit Sandwich'), itemName: 'Biscuit Sandwich', quantity: 15 },
        { itemId: findItemId('Hash Browns'), itemName: 'Hash Browns', quantity: 22 },
        { itemId: findItemId('Kolache'), itemName: 'Kolache', quantity: 24 },
        { itemId: findItemId('Scrambled Eggs'), itemName: 'Scrambled Eggs', quantity: 18 },
        { itemId: findItemId('Cinnamon Rolls'), itemName: 'Cinnamon Rolls', quantity: 12 },
        { itemId: findItemId('Donuts Glazed'), itemName: 'Donuts Glazed', quantity: 24 },
        { itemId: findItemId('Coffee'), itemName: 'Coffee', quantity: 5 },
      ],
      createdAt: new Date().toISOString(),
      source: 'manual',
    },
    {
      id: generateId(),
      date: today,
      shift: 'PM',
      employeeId: 'emp-2',
      employeeName: 'James Wilson',
      items: [
        { itemId: findItemId('Hamburger'), itemName: 'Hamburger', quantity: 12 },
        { itemId: findItemId('Cheeseburger'), itemName: 'Cheeseburger', quantity: 14 },
        { itemId: findItemId('Chicken Tenders'), itemName: 'Chicken Tenders', quantity: 20 },
        { itemId: findItemId('French Fries'), itemName: 'French Fries', quantity: 25 },
        { itemId: findItemId('Chicken Wings'), itemName: 'Chicken Wings', quantity: 30 },
        { itemId: findItemId('Corn Dog'), itemName: 'Corn Dog', quantity: 15 },
        { itemId: findItemId('Pizza Slice'), itemName: 'Pizza Slice', quantity: 20 },
        { itemId: findItemId('Onion Rings'), itemName: 'Onion Rings', quantity: 18 },
      ],
      createdAt: new Date().toISOString(),
      source: 'manual',
    },
    {
      id: generateId(),
      date: today,
      shift: 'Night',
      employeeId: 'emp-3',
      employeeName: 'DeShawn Brown',
      items: [
        { itemId: findItemId('Hot Dog'), itemName: 'Hot Dog', quantity: 18 },
        { itemId: findItemId('Taquitos'), itemName: 'Taquitos', quantity: 20 },
        { itemId: findItemId('Tornados'), itemName: 'Tornados', quantity: 22 },
        { itemId: findItemId('Nachos'), itemName: 'Nachos', quantity: 10 },
        { itemId: findItemId('Egg Rolls'), itemName: 'Egg Rolls', quantity: 15 },
      ],
      createdAt: new Date().toISOString(),
      source: 'manual',
    },
  ];

  // Store production entries
  const existingProd = getProductionEntries();
  localStorage.setItem(
    'keiths-production-entries',
    JSON.stringify([...existingProd, ...productionEntries])
  );

  // --- Waste Entries ---
  const wasteEntries: WasteEntry[] = [
    {
      id: generateId(),
      date: today,
      shift: 'AM',
      employeeId: 'emp-1',
      employeeName: 'Maria Garcia',
      items: [
        { itemId: findItemId('Bacon'), itemName: 'Bacon', quantity: 4 },
        { itemId: findItemId('Scrambled Eggs'), itemName: 'Scrambled Eggs', quantity: 3 },
        { itemId: findItemId('Donuts Glazed'), itemName: 'Donuts Glazed', quantity: 5 },
      ],
      createdAt: new Date().toISOString(),
      source: 'manual',
    },
    {
      id: generateId(),
      date: today,
      shift: 'PM',
      employeeId: 'emp-2',
      employeeName: 'James Wilson',
      items: [
        { itemId: findItemId('Hamburger'), itemName: 'Hamburger', quantity: 3 },
        { itemId: findItemId('French Fries'), itemName: 'French Fries', quantity: 6 },
        { itemId: findItemId('Chicken Wings'), itemName: 'Chicken Wings', quantity: 8 },
        { itemId: findItemId('Pizza Slice'), itemName: 'Pizza Slice', quantity: 4 },
      ],
      createdAt: new Date().toISOString(),
      source: 'manual',
    },
  ];

  const existingWaste = getWasteEntries();
  localStorage.setItem(
    'keiths-waste-entries',
    JSON.stringify([...existingWaste, ...wasteEntries])
  );

  // --- Weekly Counts (last week + this week for order suggestions) ---
  const thisWeekStart = new Date();
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const endOfWeek = (start: Date) => {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return end;
  };

  // Items with meaningful sales data for order suggestions
  const hotItems = [
    { name: 'Chicken Tenders', lastSold: 120, thisSold: 155, wasted: 8 },
    { name: 'Bacon', lastSold: 180, thisSold: 210, wasted: 15 },
    { name: 'Kolache', lastSold: 100, thisSold: 130, wasted: 5 },
    { name: 'Pizza Slice', lastSold: 140, thisSold: 170, wasted: 12 },
  ];
  const coldItems = [
    { name: 'Meatballs', lastSold: 60, thisSold: 35, wasted: 15 },
    { name: 'Club Sandwich', lastSold: 45, thisSold: 28, wasted: 10 },
    { name: 'Fried Pickles', lastSold: 50, thisSold: 30, wasted: 12 },
  ];
  const stableItems = [
    { name: 'Hamburger', lastSold: 90, thisSold: 88, wasted: 6 },
    { name: 'Cheeseburger', lastSold: 95, thisSold: 92, wasted: 5 },
    { name: 'Hot Dog', lastSold: 110, thisSold: 108, wasted: 7 },
    { name: 'French Fries', lastSold: 200, thisSold: 195, wasted: 10 },
    { name: 'Corn Dog', lastSold: 80, thisSold: 78, wasted: 4 },
    { name: 'Donuts Glazed', lastSold: 150, thisSold: 148, wasted: 12 },
    { name: 'Cinnamon Rolls', lastSold: 70, thisSold: 72, wasted: 3 },
    { name: 'Taquitos', lastSold: 130, thisSold: 125, wasted: 8 },
  ];

  const allWeeklyItems = [...hotItems, ...coldItems, ...stableItems];

  const lastWeekCount: WeeklyCount = {
    id: generateId(),
    weekStart: fmt(lastWeekStart),
    weekEnd: fmt(endOfWeek(lastWeekStart)),
    items: allWeeklyItems.map((i) => ({
      itemId: findItemId(i.name),
      itemName: i.name,
      sold: i.lastSold,
      wasted: Math.round(i.wasted * 0.8),
    })),
    createdAt: new Date().toISOString(),
  };

  const thisWeekCount: WeeklyCount = {
    id: generateId(),
    weekStart: fmt(thisWeekStart),
    weekEnd: fmt(endOfWeek(thisWeekStart)),
    items: allWeeklyItems.map((i) => ({
      itemId: findItemId(i.name),
      itemName: i.name,
      sold: i.thisSold,
      wasted: i.wasted,
    })),
    createdAt: new Date().toISOString(),
  };

  saveWeeklyCount(lastWeekCount);
  saveWeeklyCount(thisWeekCount);

  localStorage.setItem(SEED_KEY, '1');
}
