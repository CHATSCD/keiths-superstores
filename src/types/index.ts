export interface Employee {
  id: string;
  name: string;
  role: 'cook' | 'manager' | 'cashier';
  active: boolean;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  parLevel: number;
  unit: string;
}

export interface ProductionEntry {
  id: string;
  date: string;
  shift: 'AM' | 'PM' | 'Night';
  employeeId: string;
  employeeName: string;
  items: ProductionLineItem[];
  createdAt: string;
  source: 'ocr' | 'manual';
}

export interface ProductionLineItem {
  itemId: string;
  itemName: string;
  quantity: number;
  confidence?: number;
}

export interface WasteEntry {
  id: string;
  date: string;
  shift: 'AM' | 'PM' | 'Night';
  employeeId: string;
  employeeName: string;
  items: WasteLineItem[];
  createdAt: string;
  source: 'ocr' | 'manual';
}

export interface WasteLineItem {
  itemId: string;
  itemName: string;
  quantity: number;
  reason?: string;
  confidence?: number;
}

export interface WeeklyCount {
  id: string;
  weekStart: string;
  weekEnd: string;
  items: WeeklyCountItem[];
  createdAt: string;
}

export interface WeeklyCountItem {
  itemId: string;
  itemName: string;
  sold: number;
  wasted: number;
}

export interface OcrResult {
  employeeName: string;
  shift: 'AM' | 'PM' | 'Night' | '';
  items: OcrLineItem[];
  rawText: string;
  overallConfidence: number;
}

export interface OcrLineItem {
  rawText: string;
  matchedItem: string;
  matchedItemId: string;
  quantity: number;
  confidence: number;
  alternatives: Array<{ name: string; score: number }>;
}

export interface EmployeePerformance {
  employeeId: string;
  employeeName: string;
  productionScore: number;
  sellThroughRate: number;
  categoryCoverage: number;
  totalCooked: number;
  totalWasted: number;
  wastePercentage: number;
  status: 'good' | 'undercooking' | 'overcooking';
  issues: string[];
}

export interface OrderSuggestion {
  itemId: string;
  itemName: string;
  category: string;
  lastWeekSold: number;
  thisWeekSold: number;
  percentChange: number;
  wasteRate: number;
  trend: 'hot' | 'cold' | 'stable';
  suggestion: string;
  suggestedOrder: number;
  priority: 'high' | 'medium' | 'low';
}

export type ScanStage = 'idle' | 'preprocessing' | 'scanning' | 'processing' | 'complete' | 'error';
