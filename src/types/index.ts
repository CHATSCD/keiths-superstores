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
  custom?: boolean;
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

export type WasteReason =
  | 'overcooked'
  | 'expired'
  | 'dropped'
  | 'damaged'
  | 'customer-return'
  | 'quality-issue'
  | 'other';

export const WASTE_REASONS: { code: WasteReason; label: string; emoji: string; short: string }[] = [
  { code: 'overcooked', label: 'Overcooked', emoji: '\uD83D\uDD25', short: 'OC' },
  { code: 'expired', label: 'Expired', emoji: '\u23F0', short: 'EX' },
  { code: 'dropped', label: 'Dropped', emoji: '\uD83D\uDCA5', short: 'DR' },
  { code: 'damaged', label: 'Damaged', emoji: '\uD83D\uDCE6', short: 'DM' },
  { code: 'customer-return', label: 'Customer Return', emoji: '\u21A9\uFE0F', short: 'CR' },
  { code: 'quality-issue', label: 'Quality Issue', emoji: '\u26A0\uFE0F', short: 'QI' },
  { code: 'other', label: 'Other', emoji: '\uD83D\uDCDD', short: 'OT' },
];

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
  reason?: WasteReason;
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

export interface BubbleConfig {
  increment: number;
  maxQuantity: number;
}

export type ScanStage = 'idle' | 'preprocessing' | 'scanning' | 'processing' | 'complete' | 'error';
