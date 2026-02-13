export type ShiftStatus = 'unassigned' | 'pending' | 'approved' | 'completed' | 'locked';
export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeId: string;
  active: boolean;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  storeId: string;
}

export interface Shift {
  id: string;
  storeId: string;
  date: string;
  startTime: string;
  endTime: string;
  roleRequired?: string;
  station?: string;
  assignedUserId?: string;
  assignedName?: string;
  claimedBy?: string;
  claimedName?: string;
  status: ShiftStatus;
  wasteTotal: number;
  productionTotal: number;
  approvalRequired: boolean;
  notes?: string;
  eventFlag?: boolean;
  eventNote?: string;
  clockIn?: string;
  clockOut?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WasteLog {
  id: string;
  shiftId: string;
  itemName: string;
  quantity: number;
  reason?: string;
  cost: number;
  loggedBy?: string;
  loggedByName?: string;
  createdAt: string;
}

export interface ProductionLog {
  id: string;
  shiftId: string;
  itemName: string;
  quantityProduced: number;
  cost: number;
  loggedBy?: string;
  loggedByName?: string;
  createdAt: string;
}

export interface SwapRequest {
  id: string;
  shiftId: string;
  fromUserId: string;
  fromName?: string;
  toUserId?: string;
  toName?: string;
  status: 'pending' | 'approved' | 'denied';
  message?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message?: string;
  read: boolean;
  shiftId?: string;
  createdAt: string;
}

export interface EmployeeMetric {
  userId: string;
  name: string;
  storeId: string;
  totalShifts: number;
  totalWaste: number;
  totalProduction: number;
  wasteRatio: number;
  efficiencyScore: number;
}

export interface AnalyticsSummary {
  period: { days: number };
  totals: { waste: number; production: number; wasteRatio: string };
  topWasters: Array<{ item_name: string; total_qty: number; total_cost: number }>;
  employeeMetrics: EmployeeMetric[];
  shiftStatusBreakdown: Array<{ status: string; count: number }>;
  dailyTotals: Array<{ date: string; waste: number; production: number }>;
  aiInsights: {
    riskyEmployees: Array<{ name: string; wasteRatio: number }>;
    avgWasteRatio: string;
    recommendation: string;
  };
}

export const SHIFT_STATUS_COLORS: Record<ShiftStatus, string> = {
  unassigned: 'bg-gray-100 text-gray-700 border-gray-300',
  pending:    'bg-yellow-100 text-yellow-800 border-yellow-300',
  approved:   'bg-green-100 text-green-800 border-green-300',
  completed:  'bg-blue-100 text-blue-800 border-blue-300',
  locked:     'bg-gray-800 text-white border-gray-900',
};

export const SHIFT_STATUS_DOT: Record<ShiftStatus, string> = {
  unassigned: 'bg-gray-400',
  pending:    'bg-yellow-400',
  approved:   'bg-green-500',
  completed:  'bg-blue-500',
  locked:     'bg-gray-700',
};
