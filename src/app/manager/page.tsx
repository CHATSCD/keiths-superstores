'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Package,
  Users,
  TrendingUp,
  ShoppingCart,
  Plus,
  Trash2,
  Search,
  Printer,
  Save,
  Flame,
  Snowflake,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { CATEGORIES } from '@/data/inventory';
import {
  getInventory,
  saveInventory,
  getEmployees,
  saveEmployees,
  getProductionEntries,
  getWasteEntries,
  getWeeklyCounts,
  saveWeeklyCount,
  generateId,
} from '@/lib/storage';
import { calculateEmployeePerformance, calculateOrderSuggestions } from '@/lib/performance';
import {
  InventoryItem,
  Employee,
  EmployeePerformance,
  OrderSuggestion,
  WeeklyCount,
} from '@/types';

export default function ManagerPage() {
  const [activeTab, setActiveTab] = useState('items');

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-4">
        <h2 className="text-lg font-bold mb-3">Manager Dashboard</h2>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="items">
              <Package className="h-3.5 w-3.5 mr-1" />
              Items
            </TabsTrigger>
            <TabsTrigger value="performance">
              <TrendingUp className="h-3.5 w-3.5 mr-1" />
              Perf
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ShoppingCart className="h-3.5 w-3.5 mr-1" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="employees">
              <Users className="h-3.5 w-3.5 mr-1" />
              Staff
            </TabsTrigger>
          </TabsList>

          <TabsContent value="items">
            <ItemsTab />
          </TabsContent>
          <TabsContent value="performance">
            <PerformanceTab />
          </TabsContent>
          <TabsContent value="orders">
            <OrdersTab />
          </TabsContent>
          <TabsContent value="employees">
            <EmployeesTab />
          </TabsContent>
        </Tabs>
      </main>
      <BottomNav />
    </div>
  );
}

// ============ ITEMS TAB ============
function ItemsTab() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');

  useEffect(() => {
    setItems(getInventory());
  }, []);

  const filtered = items.filter((item) => {
    const matchSearch =
      !search || item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'All' || item.category === category;
    return matchSearch && matchCat;
  });

  const updateParLevel = (id: string, parLevel: number) => {
    const updated = items.map((i) => (i.id === id ? { ...i, parLevel } : i));
    setItems(updated);
    saveInventory(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-36"
        >
          <option value="All">All ({items.length})</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c} ({items.filter((i) => i.category === c).length})
            </option>
          ))}
        </Select>
      </div>

      <div className="text-xs text-muted-foreground">
        Showing {filtered.length} of {items.length} items
      </div>

      <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between bg-white rounded-lg border px-3 py-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground">{item.category}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-xs text-muted-foreground">Par:</span>
              <button
                onClick={() => updateParLevel(item.id, Math.max(0, item.parLevel - 1))}
                className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
              >
                <Minus className="h-3 w-3" />
              </button>
              <Input
                type="number"
                value={item.parLevel}
                onChange={(e) => updateParLevel(item.id, parseInt(e.target.value) || 0)}
                className="w-14 h-7 text-center text-sm"
                min={0}
              />
              <button
                onClick={() => updateParLevel(item.id, item.parLevel + 1)}
                className="w-6 h-6 rounded border flex items-center justify-center hover:bg-gray-100"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ PERFORMANCE TAB ============
function PerformanceTab() {
  const [performances, setPerformances] = useState<EmployeePerformance[]>([]);

  useEffect(() => {
    const employees = getEmployees();
    const production = getProductionEntries();
    const waste = getWasteEntries();
    const inventory = getInventory();
    const weeklyCounts = getWeeklyCounts();

    const perfs = employees
      .filter((e) => e.active)
      .map((emp) =>
        calculateEmployeePerformance(emp, production, waste, inventory, weeklyCounts)
      )
      .filter((p) => p.totalCooked > 0 || p.totalWasted > 0);

    setPerformances(perfs);
  }, []);

  if (performances.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <TrendingUp className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>No performance data yet.</p>
          <p className="text-xs mt-1">
            Add employees and scan production/waste reports to see performance metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {performances.map((perf) => (
        <PerformanceCard key={perf.employeeId} performance={perf} />
      ))}
    </div>
  );
}

function PerformanceCard({ performance: p }: { performance: EmployeePerformance }) {
  const statusColor = {
    good: 'bg-green-100 text-green-800 border-green-200',
    undercooking: 'bg-red-100 text-red-800 border-red-200',
    overcooking: 'bg-orange-100 text-orange-800 border-orange-200',
  };

  const statusLabel = {
    good: 'Good',
    undercooking: 'Undercooking',
    overcooking: 'Overcooking',
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{p.employeeName}</CardTitle>
          <Badge className={statusColor[p.status]}>{statusLabel[p.status]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Scores */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Production</p>
            <p className="text-lg font-bold">{p.productionScore}%</p>
            <p className="text-[10px] text-muted-foreground">Good: 80-120%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Sell-Through</p>
            <p className="text-lg font-bold">{p.sellThroughRate}%</p>
            <p className="text-[10px] text-muted-foreground">Good: 60-90%</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2">
            <p className="text-xs text-muted-foreground">Categories</p>
            <p className="text-lg font-bold">{p.categoryCoverage}</p>
            <p className="text-[10px] text-muted-foreground">of {CATEGORIES.length}</p>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span>Waste Rate</span>
            <span
              className={
                p.wastePercentage > 20
                  ? 'text-red-600 font-medium'
                  : p.wastePercentage > 10
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }
            >
              {p.wastePercentage}%
            </span>
          </div>
          <Progress
            value={Math.min(100, p.wastePercentage * 2)}
            className={
              p.wastePercentage > 20
                ? '[&>div]:bg-red-500'
                : p.wastePercentage > 10
                ? '[&>div]:bg-yellow-500'
                : '[&>div]:bg-green-500'
            }
          />
        </div>

        <div className="flex gap-3 text-xs text-muted-foreground">
          <span>Cooked: {p.totalCooked}</span>
          <span>Wasted: {p.totalWasted}</span>
        </div>

        {/* Issues */}
        {p.issues.length > 0 && (
          <div className="space-y-1">
            {p.issues.map((issue, idx) => (
              <div
                key={idx}
                className="text-xs bg-yellow-50 text-yellow-800 rounded px-2 py-1"
              >
                {issue}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============ ORDERS TAB ============
function OrdersTab() {
  const [suggestions, setSuggestions] = useState<OrderSuggestion[]>([]);
  const [filter, setFilter] = useState<'all' | 'hot' | 'cold'>('all');
  const [showWeeklyEntry, setShowWeeklyEntry] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inventory = getInventory();
    const weeklyCounts = getWeeklyCounts();
    const waste = getWasteEntries();
    const s = calculateOrderSuggestions(inventory, weeklyCounts, waste);
    setSuggestions(s);
  }, [showWeeklyEntry]);

  const filtered = suggestions.filter((s) => {
    if (filter === 'all') return true;
    return s.trend === filter;
  });

  const hotCount = suggestions.filter((s) => s.trend === 'hot').length;
  const coldCount = suggestions.filter((s) => s.trend === 'cold').length;

  const handlePrint = () => {
    window.print();
  };

  if (suggestions.length === 0) {
    return (
      <div className="space-y-3">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No order data yet.</p>
            <p className="text-xs mt-1">Add weekly count data to get smart order suggestions.</p>
          </CardContent>
        </Card>
        <Button onClick={() => setShowWeeklyEntry(true)} className="w-full bg-keiths-red hover:bg-keiths-darkRed">
          <Plus className="h-4 w-4 mr-2" />
          Enter Weekly Count
        </Button>
        {showWeeklyEntry && (
          <WeeklyCountEntry onClose={() => setShowWeeklyEntry(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`text-center rounded-lg p-2 border transition-colors ${
            filter === 'all' ? 'bg-keiths-red text-white border-keiths-red' : 'bg-white'
          }`}
        >
          <p className="text-lg font-bold">{suggestions.length}</p>
          <p className="text-xs">Total</p>
        </button>
        <button
          onClick={() => setFilter('hot')}
          className={`text-center rounded-lg p-2 border transition-colors ${
            filter === 'hot' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white'
          }`}
        >
          <p className="text-lg font-bold">{hotCount}</p>
          <p className="text-xs">Hot</p>
        </button>
        <button
          onClick={() => setFilter('cold')}
          className={`text-center rounded-lg p-2 border transition-colors ${
            filter === 'cold' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white'
          }`}
        >
          <p className="text-lg font-bold">{coldCount}</p>
          <p className="text-xs">Cold</p>
        </button>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          onClick={() => setShowWeeklyEntry(true)}
          variant="outline"
          className="flex-1"
          size="sm"
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          Weekly Count
        </Button>
        <Button onClick={handlePrint} variant="outline" className="flex-1" size="sm">
          <Printer className="h-3.5 w-3.5 mr-1" />
          Print Report
        </Button>
      </div>

      {/* Printable Report */}
      <div ref={printRef}>
        <div className="print-only mb-4">
          <h1 className="text-xl font-bold">Keith&apos;s Superstores — Weekly Order Suggestions</h1>
          <p className="text-sm text-gray-500">Generated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Suggestions List */}
        <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
          {filtered.map((s) => (
            <div key={s.itemId} className="bg-white rounded-lg border px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {s.trend === 'hot' && <Flame className="h-4 w-4 text-orange-500 flex-shrink-0" />}
                  {s.trend === 'cold' && <Snowflake className="h-4 w-4 text-blue-500 flex-shrink-0" />}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.itemName}</p>
                    <p className="text-xs text-muted-foreground">{s.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-0.5">
                      {s.percentChange > 0 ? (
                        <ArrowUpRight className="h-3 w-3 text-green-600" />
                      ) : s.percentChange < 0 ? (
                        <ArrowDownRight className="h-3 w-3 text-red-600" />
                      ) : null}
                      <span
                        className={`text-xs font-medium ${
                          s.percentChange > 0
                            ? 'text-green-600'
                            : s.percentChange < 0
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        {s.percentChange > 0 ? '+' : ''}
                        {s.percentChange}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Order: {s.suggestedOrder}
                    </p>
                  </div>
                  <Badge
                    variant={
                      s.priority === 'high'
                        ? 'destructive'
                        : s.priority === 'medium'
                        ? 'warning'
                        : 'secondary'
                    }
                    className="text-[10px]"
                  >
                    {s.priority}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{s.suggestion}</p>
            </div>
          ))}
        </div>
      </div>

      {showWeeklyEntry && (
        <WeeklyCountEntry onClose={() => setShowWeeklyEntry(false)} />
      )}
    </div>
  );
}

function WeeklyCountEntry({ onClose }: { onClose: () => void }) {
  const inventory = getInventory();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [items, setItems] = useState<Record<string, { sold: number; wasted: number }>>({});

  const catItems = inventory.filter((i) => i.category === category);

  const updateField = (itemId: string, field: 'sold' | 'wasted', value: number) => {
    setItems({
      ...items,
      [itemId]: {
        sold: items[itemId]?.sold || 0,
        wasted: items[itemId]?.wasted || 0,
        [field]: value,
      },
    });
  };

  const handleSave = () => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const weeklyCount: WeeklyCount = {
      id: generateId(),
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      items: Object.entries(items)
        .filter(([, v]) => v.sold > 0 || v.wasted > 0)
        .map(([itemId, data]) => ({
          itemId,
          itemName: inventory.find((i) => i.id === itemId)?.name || '',
          sold: data.sold,
          wasted: data.wasted,
        })),
      createdAt: new Date().toISOString(),
    };

    saveWeeklyCount(weeklyCount);
    onClose();
  };

  return (
    <Card className="border-2 border-keiths-red">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          Weekly Count Entry
          <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>

        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {catItems.map((item) => (
            <div key={item.id} className="grid grid-cols-[1fr,70px,70px] gap-1.5 items-center">
              <span className="text-sm truncate">{item.name}</span>
              <Input
                type="number"
                placeholder="Sold"
                value={items[item.id]?.sold || ''}
                onChange={(e) => updateField(item.id, 'sold', parseInt(e.target.value) || 0)}
                className="h-7 text-xs text-center"
                min={0}
              />
              <Input
                type="number"
                placeholder="Waste"
                value={items[item.id]?.wasted || ''}
                onChange={(e) => updateField(item.id, 'wasted', parseInt(e.target.value) || 0)}
                className="h-7 text-xs text-center"
                min={0}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-2 text-xs text-muted-foreground justify-end">
          <span>Sold column</span>
          <span>|</span>
          <span>Waste column</span>
        </div>

        <Button onClick={handleSave} className="w-full bg-keiths-red hover:bg-keiths-darkRed">
          <Save className="h-4 w-4 mr-2" />
          Save Weekly Count
        </Button>
      </CardContent>
    </Card>
  );
}

// ============ EMPLOYEES TAB ============
function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'cook' | 'manager' | 'cashier'>('cook');

  useEffect(() => {
    setEmployees(getEmployees());
  }, []);

  const handleAdd = () => {
    if (!newName.trim()) return;
    const emp: Employee = {
      id: generateId(),
      name: newName.trim(),
      role: newRole,
      active: true,
      createdAt: new Date().toISOString(),
    };
    const updated = [...employees, emp];
    setEmployees(updated);
    saveEmployees(updated);
    setNewName('');
    setShowAdd(false);
  };

  const toggleActive = (id: string) => {
    const updated = employees.map((e) =>
      e.id === id ? { ...e, active: !e.active } : e
    );
    setEmployees(updated);
    saveEmployees(updated);
  };

  const removeEmployee = (id: string) => {
    const updated = employees.filter((e) => e.id !== id);
    setEmployees(updated);
    saveEmployees(updated);
  };

  return (
    <div className="space-y-3">
      <Button
        onClick={() => setShowAdd(!showAdd)}
        className="w-full bg-keiths-red hover:bg-keiths-darkRed"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Add Employee
      </Button>

      {showAdd && (
        <Card className="border-2 border-keiths-red">
          <CardContent className="p-3 space-y-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Employee name"
              autoFocus
            />
            <Select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as 'cook' | 'manager' | 'cashier')}
            >
              <option value="cook">Cook</option>
              <option value="manager">Manager</option>
              <option value="cashier">Cashier</option>
            </Select>
            <div className="flex gap-2">
              <Button onClick={() => setShowAdd(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                className="flex-1 bg-keiths-red hover:bg-keiths-darkRed"
                disabled={!newName.trim()}
              >
                Add
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {employees.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No employees added yet.</p>
            <p className="text-xs mt-1">Add employees to track their performance.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-1.5">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className={`flex items-center justify-between bg-white rounded-lg border px-3 py-2.5 ${
                !emp.active ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                    emp.active ? 'bg-keiths-red' : 'bg-gray-400'
                  }`}
                >
                  {emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{emp.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{emp.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleActive(emp.id)}
                  className={`text-xs px-2 py-1 rounded border transition-colors ${
                    emp.active
                      ? 'text-green-700 border-green-200 bg-green-50'
                      : 'text-gray-500 border-gray-200 bg-gray-50'
                  }`}
                >
                  {emp.active ? 'Active' : 'Inactive'}
                </button>
                <button
                  onClick={() => removeEmployee(emp.id)}
                  className="text-red-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
