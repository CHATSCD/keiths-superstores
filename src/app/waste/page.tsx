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
  saveWasteEntry,
  generateId,
  getTodayStr,
} from '@/lib/storage';
import { InventoryItem, Employee, WasteEntry, WasteReason, WASTE_REASONS, OcrResult } from '@/types';
import { QRCodeData } from '@/lib/ocr';

interface WasteItemState {
  quantity: number;
  reason?: WasteReason;
}

export default function WastePage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [date, setDate] = useState(getTodayStr());
  const [employeeName, setEmployeeName] = useState('');
  const [shift, setShift] = useState<'AM' | 'PM' | 'Night'>('AM');
  const [wasteItems, setWasteItems] = useState<Record<string, WasteItemState>>({});
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

  useEffect(() => {
    if (categories.length > 0 && !expandedCategory) {
      setExpandedCategory(categories[0]);
    }
  }, [categories, expandedCategory]);

  const updateQty = useCallback((itemId: string, delta: number) => {
    setWasteItems((prev) => {
      const current = prev[itemId]?.quantity || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { ...prev[itemId], quantity: next } };
    });
  }, []);

  const setQty = useCallback((itemId: string, value: number) => {
    setWasteItems((prev) => {
      if (value <= 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { ...prev[itemId], quantity: value } };
    });
  }, []);

  const setReason = useCallback((itemId: string, reason: WasteReason) => {
    setWasteItems((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], reason },
    }));
  }, []);

  const totalItems = Object.keys(wasteItems).length;
  const totalUnits = Object.values(wasteItems).reduce((s, w) => s + w.quantity, 0);

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

    // Populate waste items from OCR results
    const newWasteItems: Record<string, WasteItemState> = {};
    result.items.forEach((item) => {
      if (item.matchedItemId && item.quantity > 0) {
        newWasteItems[item.matchedItemId] = {
          quantity: item.quantity,
        };
      }
    });
    setWasteItems(newWasteItems);
  }, []);

  const handleSave = () => {
    if (!employeeName.trim() || totalItems === 0) return;

    const entry: WasteEntry = {
      id: generateId(),
      date,
      shift,
      employeeId: employees.find((e) => e.name === employeeName)?.id || '',
      employeeName: employeeName.trim(),
      items: Object.entries(wasteItems)
        .filter(([, w]) => w.quantity > 0)
        .map(([itemId, w]) => ({
          itemId,
          itemName: items.find((i) => i.id === itemId)?.name || '',
          quantity: w.quantity,
          reason: w.reason,
        })),
      createdAt: new Date().toISOString(),
      source: mode === 'scan' ? 'ocr' : 'manual',
    };

    saveWasteEntry(entry);
    setWasteItems({});
    setOcrResult(null);
    setQrData(null);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header />
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <h2 className="text-lg font-bold">Waste Entry</h2>

        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 text-center font-medium flex items-center justify-center gap-2">
            <Check className="h-4 w-4" />
            Waste report saved!
          </div>
        )}

        {/* Mode Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setMode('manual')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-2 ${
              mode === 'manual'
                ? 'bg-red-600 text-white border-red-600'
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
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white text-gray-700 border-gray-200'
            }`}
          >
            <ScanLine className="h-4 w-4" />
            Scan/Upload
          </button>
        </div>

        {/* Scanner Mode */}
        {mode === 'scan' && !ocrResult && (
          <Scanner
            onScanComplete={handleScanComplete}
            onItemsScanned={(scanned) => {
              const newWaste: Record<string, WasteItemState> = {};
              scanned.forEach((i) => { newWaste[i.itemId] = { quantity: i.quantity }; });
              setWasteItems(newWaste);
              setMode('manual');
            }}
          />
        )}

        {/* OCR Results Review */}
        {mode === 'scan' && ocrResult && (
          <OcrResults
            result={ocrResult}
            type="waste"
            onConfirm={(updatedResult) => {
              // Update with edited results
              setEmployeeName(updatedResult.employeeName);
              if (updatedResult.shift) {
                setShift(updatedResult.shift);
              }

              // Update waste items with edited results
              const newWasteItems: Record<string, WasteItemState> = {};
              updatedResult.items.forEach((item) => {
                if (item.matchedItemId && item.quantity > 0) {
                  newWasteItems[item.matchedItemId] = {
                    quantity: item.quantity,
                  };
                }
              });
              setWasteItems(newWasteItems);

              // Clear OCR result to show manual form for final review
              setOcrResult(null);
            }}
            onDiscard={() => {
              setOcrResult(null);
              setQrData(null);
              setWasteItems({});
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

        {/* Items by Category */}
        {categories.map((cat) => {
          const catItems = items.filter((i) => i.category === cat);
          const isExpanded = expandedCategory === cat;
          const catTotal = catItems.reduce((s, i) => s + (wasteItems[i.id]?.quantity || 0), 0);

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
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-normal">
                          {catTotal} wasted
                        </span>
                      )}
                      <span className="text-muted-foreground text-xs">{isExpanded ? '\u25B2' : '\u25BC'}</span>
                    </div>
                  </CardTitle>
                </CardHeader>
              </button>
              {isExpanded && (
                <CardContent className="pt-0 space-y-2">
                  {catItems.map((item) => {
                    const state = wasteItems[item.id];
                    const qty = state?.quantity || 0;
                    return (
                      <div key={item.id} className="space-y-1">
                        <div className="flex items-center justify-between py-1">
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
                        {/* Waste Reason Buttons - shown when qty > 0 */}
                        {qty > 0 && (
                          <div className="flex flex-wrap gap-1 pb-1">
                            {WASTE_REASONS.map((r) => (
                              <button
                                key={r.code}
                                onClick={() => setReason(item.id, r.code)}
                                className={`text-[11px] px-2 py-1 rounded-full border transition-colors ${
                                  state?.reason === r.code
                                    ? 'bg-red-600 text-white border-red-600'
                                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                {r.emoji} {r.label}
                              </button>
                            ))}
                          </div>
                        )}
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
            className="w-full bg-red-600 hover:bg-red-700 h-12 text-base"
          >
            <Save className="h-5 w-5 mr-2" />
            Save Waste Report ({totalItems} items, {totalUnits} units)
          </Button>
        </div>
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
