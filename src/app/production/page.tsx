'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Minus, Plus, Save, Check, ScanLine, Edit3 } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Scanner from '@/components/Scanner';
import OcrResults from '@/components/OcrResults';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { CATEGORIES } from '@/data/inventory';
import {
  getEnabledForSheets,
  getEmployees,
  saveProductionEntry,
  generateId,
  getTodayStr,
} from '@/lib/storage';
import { InventoryItem, Employee, ProductionEntry, OcrResult } from '@/types';
import { QRCodeData } from '@/lib/ocr';

export default function ProductionPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [date, setDate] = useState(getTodayStr());
  const [employeeName, setEmployeeName] = useState('');
  const [shift, setShift] = useState<'AM' | 'PM' | 'Night'>('AM');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [deliSales, setDeliSales] = useState('');
  const [brandedDeliSales, setBrandedDeliSales] = useState('');
  const [saved, setSaved] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [qrData, setQrData] = useState<QRCodeData | null>(null);

  useEffect(() => {
    setItems(getEnabledForSheets());
    setEmployees(getEmployees().filter((e) => e.active));
  }, []);

  const categories = CATEGORIES.filter((cat) =>
    items.some((item) => item.category === cat)
  );

  // Auto-expand first category
  useEffect(() => {
    if (categories.length > 0 && !expandedCategory) {
      setExpandedCategory(categories[0]);
    }
  }, [categories, expandedCategory]);

  const updateQty = useCallback((itemId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: next };
    });
  }, []);

  const setQty = useCallback((itemId: string, value: number) => {
    setQuantities((prev) => {
      if (value <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: value };
    });
  }, []);

  const totalItems = Object.keys(quantities).length;
  const totalUnits = Object.values(quantities).reduce((s, q) => s + q, 0);

  const handleScanComplete = useCallback((result: OcrResult, qr: QRCodeData | null) => {
    setOcrResult(result);
    setQrData(qr);

    // Auto-populate from QR code if available
    if (qr) {
      setEmployeeName(qr.employeeName);
      setShift(qr.shift);
      setDate(qr.date);
    } else if (result.employeeName) {
      setEmployeeName(result.employeeName);
    }
    if (result.shift) {
      setShift(result.shift);
    }

    // Populate quantities from OCR results
    const newQty: Record<string, number> = {};
    result.items.forEach((item) => {
      if (item.matchedItemId && item.quantity > 0) {
        newQty[item.matchedItemId] = item.quantity;
      }
    });
    setQuantities(newQty);
  }, []);

  const handleSave = () => {
    if (!employeeName.trim() || totalItems === 0) return;

    const deli = parseFloat(deliSales) || 0;
    const branded = parseFloat(brandedDeliSales) || 0;

    const entry: ProductionEntry = {
      id: generateId(),
      date,
      shift,
      employeeId: employees.find((e) => e.name === employeeName)?.id || '',
      employeeName: employeeName.trim(),
      items: Object.entries(quantities)
        .filter(([, qty]) => qty > 0)
        .map(([itemId, qty]) => ({
          itemId,
          itemName: items.find((i) => i.id === itemId)?.name || '',
          quantity: qty,
        })),
      createdAt: new Date().toISOString(),
      source: mode === 'scan' ? 'ocr' : 'manual',
      deliSales: deli > 0 ? deli : undefined,
      brandedDeliSales: branded > 0 ? branded : undefined,
      totalSales: (deli + branded) > 0 ? deli + branded : undefined,
    };

    saveProductionEntry(entry);
    setQuantities({});
    setDeliSales('');
    setBrandedDeliSales('');
    setOcrResult(null);
    setQrData(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <h2 className="text-lg font-bold">Production Entry</h2>

        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 text-center font-medium flex items-center justify-center gap-2">
            <Check className="h-4 w-4" />
            Report saved successfully!
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
              mode === 'manual'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            <Edit3 className="h-4 w-4" />
            Manual Entry
          </button>
          <button
            onClick={() => setMode('scan')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
              mode === 'scan'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            <ScanLine className="h-4 w-4" />
            Scan/Upload
          </button>
        </div>

        {/* Scanner Mode */}
        {mode === 'scan' && !ocrResult && (
          <Scanner onScanComplete={handleScanComplete} />
        )}

        {/* OCR Results Review */}
        {mode === 'scan' && ocrResult && (
          <OcrResults
            result={ocrResult}
            type="production"
            onConfirm={(updatedResult) => {
              // Update with edited results
              setEmployeeName(updatedResult.employeeName);
              if (updatedResult.shift) {
                setShift(updatedResult.shift);
              }

              // Update quantities with edited results
              const newQty: Record<string, number> = {};
              updatedResult.items.forEach((item) => {
                if (item.matchedItemId && item.quantity > 0) {
                  newQty[item.matchedItemId] = item.quantity;
                }
              });
              setQuantities(newQty);

              // Clear OCR result to show manual form for final review
              setOcrResult(null);
            }}
            onDiscard={() => {
              setOcrResult(null);
              setQrData(null);
              setQuantities({});
            }}
          />
        )}

        {/* Manual Entry Mode or After Scan */}
        {(mode === 'manual' || (mode === 'scan' && ocrResult)) && (
          <>
        {/* Entry Header */}
        <Card>
          <CardContent className="p-3 space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Employee</label>
              {employees.length > 0 ? (
                <Select
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="mt-1"
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </Select>
              ) : (
                <Input
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  placeholder="Enter name..."
                  className="mt-1"
                />
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Shift</label>
              <div className="flex gap-2 mt-1">
                {(['AM', 'PM', 'Night'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setShift(s)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      shift === s
                        ? 'bg-keiths-red text-white border-keiths-red'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {s === 'Night' ? 'ON' : s}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Data */}
        <Card className="border-2 border-emerald-200 bg-emerald-50">
          <CardContent className="p-3 space-y-2">
            <p className="text-xs font-semibold text-emerald-900">Shift Sales (optional)</p>
            <p className="text-[10px] text-emerald-700">Enter sales totals for this shift to track correlation with production</p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-emerald-800">Deli Sales $</label>
                <Input
                  type="number"
                  value={deliSales}
                  onChange={(e) => setDeliSales(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 bg-white"
                  min={0}
                  step={0.01}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-emerald-800">Branded Deli $</label>
                <Input
                  type="number"
                  value={brandedDeliSales}
                  onChange={(e) => setBrandedDeliSales(e.target.value)}
                  placeholder="0.00"
                  className="mt-1 bg-white"
                  min={0}
                  step={0.01}
                />
              </div>
            </div>
            {(parseFloat(deliSales) > 0 || parseFloat(brandedDeliSales) > 0) && (
              <p className="text-xs font-medium text-emerald-800">
                Total: ${((parseFloat(deliSales) || 0) + (parseFloat(brandedDeliSales) || 0)).toFixed(2)}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Items by Category */}
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          const isExpanded = expandedCategory === cat;
          const catTotal = catItems.reduce((s, i) => s + (quantities[i.id] || 0), 0);

          return (
            <Card key={cat}>
              <button
                className="w-full text-left"
                onClick={() => setExpandedCategory(isExpanded ? null : cat)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span>{cat} ({catItems.length})</span>
                    <div className="flex items-center gap-2">
                      {catTotal > 0 && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-normal">
                          {catTotal} units
                        </span>
                      )}
                      <span className="text-muted-foreground text-xs">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
              </button>
              {isExpanded && (
                <CardContent className="pt-0 space-y-1.5">
                  {catItems.map((item) => {
                    const qty = quantities[item.id] || 0;
                    return (
                      <div key={item.id} className="flex items-center justify-between py-1.5">
                        <span className="text-sm flex-1 min-w-0 truncate pr-2">{item.name}</span>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => updateQty(item.id, -1)}
                            className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-100 active:bg-gray-200"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <Input
                            type="number"
                            value={qty || ''}
                            onChange={(e) => setQty(item.id, parseInt(e.target.value) || 0)}
                            className="w-14 h-8 text-center text-sm"
                            min={0}
                          />
                          <button
                            onClick={() => updateQty(item.id, 1)}
                            className="w-8 h-8 rounded-lg border flex items-center justify-center hover:bg-gray-100 active:bg-gray-200"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}

        {/* Save */}
        <div className="sticky bottom-16 bg-gray-50 pt-2 pb-2">
          <Button
            onClick={handleSave}
            disabled={!employeeName.trim() || totalItems === 0}
            className="w-full bg-keiths-red hover:bg-keiths-darkRed h-12 text-base"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Report ({totalItems} items, {totalUnits} units)
          </Button>
        </div>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
