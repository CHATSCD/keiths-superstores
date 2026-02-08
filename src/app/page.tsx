'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  ClipboardList,
  Trash2,
  FileText,
  PenLine,
  ChevronDown,
  ChevronUp,
  Edit2,
  X,
  Check,
  Printer,
} from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Scanner from '@/components/Scanner';
import OcrResults from '@/components/OcrResults';
import ManualEntryForm from '@/components/ManualEntryForm';
import QRCodeCanvas from '@/components/QRCodeCanvas';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getProductionEntriesByDate,
  getWasteEntriesByDate,
  saveProductionEntry,
  saveWasteEntry,
  deleteProductionEntry,
  deleteWasteEntry,
  updateProductionEntry,
  updateWasteEntry,
  getEmployees,
  getTodayStr,
  generateId,
} from '@/lib/storage';
import { OcrResult, ProductionEntry, WasteEntry } from '@/types';
import { seedIfEmpty } from '@/lib/seed';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('production');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [todayProduction, setTodayProduction] = useState(0);
  const [todayWaste, setTodayWaste] = useState(0);
  const [saved, setSaved] = useState(false);
  const [logKey, setLogKey] = useState(0);

  useEffect(() => {
    seedIfEmpty();
  }, []);

  const refreshStats = useCallback(() => {
    const today = getTodayStr();
    const prodEntries = getProductionEntriesByDate(today);
    const wasteEntries = getWasteEntriesByDate(today);

    const totalProd = prodEntries.reduce(
      (sum, e) => sum + e.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
    const totalWaste = wasteEntries.reduce(
      (sum, e) => sum + e.items.reduce((s, i) => s + i.quantity, 0),
      0
    );
    setTodayProduction(totalProd);
    setTodayWaste(totalWaste);
    setLogKey((k) => k + 1);
  }, []);

  useEffect(() => {
    refreshStats();
  }, [refreshStats]);

  const handleScanComplete = useCallback((result: OcrResult) => {
    setOcrResult(result);
    setShowManual(false);
  }, []);

  const handleConfirmOcr = useCallback(
    (result: OcrResult) => {
      const employees = getEmployees();
      const emp = employees.find((e) => e.name === result.employeeName);

      if (activeTab === 'production') {
        const entry: ProductionEntry = {
          id: generateId(),
          date: getTodayStr(),
          shift: result.shift as 'AM' | 'PM' | 'Night',
          employeeId: emp?.id || '',
          employeeName: result.employeeName,
          items: result.items.map((i) => ({
            itemId: i.matchedItemId,
            itemName: i.matchedItem,
            quantity: i.quantity,
            confidence: i.confidence,
          })),
          createdAt: new Date().toISOString(),
          source: 'ocr',
        };
        saveProductionEntry(entry);
      } else {
        const entry: WasteEntry = {
          id: generateId(),
          date: getTodayStr(),
          shift: result.shift as 'AM' | 'PM' | 'Night',
          employeeId: emp?.id || '',
          employeeName: result.employeeName,
          items: result.items.map((i) => ({
            itemId: i.matchedItemId,
            itemName: i.matchedItem,
            quantity: i.quantity,
            confidence: i.confidence,
          })),
          createdAt: new Date().toISOString(),
          source: 'ocr',
        };
        saveWasteEntry(entry);
      }

      setOcrResult(null);
      refreshStats();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    [activeTab, refreshStats]
  );

  const handleManualSubmit = useCallback(
    (data: { employeeName: string; shift: 'AM' | 'PM' | 'Night'; items: any[] }) => {
      const employees = getEmployees();
      const emp = employees.find((e) => e.name === data.employeeName);

      if (activeTab === 'production') {
        const entry: ProductionEntry = {
          id: generateId(),
          date: getTodayStr(),
          shift: data.shift,
          employeeId: emp?.id || '',
          employeeName: data.employeeName,
          items: data.items,
          createdAt: new Date().toISOString(),
          source: 'manual',
        };
        saveProductionEntry(entry);
      } else {
        const entry: WasteEntry = {
          id: generateId(),
          date: getTodayStr(),
          shift: data.shift,
          employeeId: emp?.id || '',
          employeeName: data.employeeName,
          items: data.items,
          createdAt: new Date().toISOString(),
          source: 'manual',
        };
        saveWasteEntry(entry);
      }

      setShowManual(false);
      refreshStats();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
    [activeTab, refreshStats]
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Header />

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <ClipboardList className="h-5 w-5 text-green-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today&apos;s Production</p>
                <p className="text-xl font-bold">{todayProduction}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-700" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today&apos;s Waste</p>
                <p className="text-xl font-bold">{todayWaste}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Success Toast */}
        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-700 text-center font-medium">
            Report saved successfully!
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="production">
              <FileText className="h-4 w-4 mr-1.5" />
              Production Report
            </TabsTrigger>
            <TabsTrigger value="waste">
              <Trash2 className="h-4 w-4 mr-1.5" />
              Waste Sheet
            </TabsTrigger>
          </TabsList>

          <TabsContent value="production">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  Scan Production Report
                  <button
                    onClick={() => {
                      setShowManual(!showManual);
                      setOcrResult(null);
                    }}
                    className="text-sm font-normal text-keiths-red hover:underline flex items-center gap-1"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    {showManual ? 'Use Scanner' : 'Manual Entry'}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showManual ? (
                  <ManualEntryForm type="production" onSubmit={handleManualSubmit} />
                ) : ocrResult ? (
                  <OcrResults
                    result={ocrResult}
                    type="production"
                    onConfirm={handleConfirmOcr}
                    onDiscard={() => setOcrResult(null)}
                  />
                ) : (
                  <Scanner onScanComplete={handleScanComplete} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="waste">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center justify-between">
                  Scan Waste Sheet
                  <button
                    onClick={() => {
                      setShowManual(!showManual);
                      setOcrResult(null);
                    }}
                    className="text-sm font-normal text-keiths-red hover:underline flex items-center gap-1"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    {showManual ? 'Use Scanner' : 'Manual Entry'}
                  </button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showManual ? (
                  <ManualEntryForm type="waste" onSubmit={handleManualSubmit} />
                ) : ocrResult ? (
                  <OcrResults
                    result={ocrResult}
                    type="waste"
                    onConfirm={handleConfirmOcr}
                    onDiscard={() => setOcrResult(null)}
                  />
                ) : (
                  <Scanner onScanComplete={handleScanComplete} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Today's Log */}
        <TodayLog key={logKey} onUpdate={refreshStats} />
      </main>

      <BottomNav />
    </div>
  );
}

// ============ TODAY'S LOG WITH EDIT/DELETE ============

function TodayLog({ onUpdate }: { onUpdate: () => void }) {
  const [productionEntries, setProductionEntries] = useState<ProductionEntry[]>([]);
  const [wasteEntries, setWasteEntries] = useState<WasteEntry[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const reload = useCallback(() => {
    const today = getTodayStr();
    setProductionEntries(getProductionEntriesByDate(today));
    setWasteEntries(getWasteEntriesByDate(today));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleDeleteProduction = (id: string) => {
    deleteProductionEntry(id);
    reload();
    onUpdate();
    setConfirmDeleteId(null);
    setExpandedId(null);
  };

  const handleDeleteWaste = (id: string) => {
    deleteWasteEntry(id);
    reload();
    onUpdate();
    setConfirmDeleteId(null);
    setExpandedId(null);
  };

  const handleUpdateProductionQty = (entryId: string, itemIdx: number, newQty: number) => {
    const entry = productionEntries.find((e) => e.id === entryId);
    if (!entry) return;
    const updated = { ...entry, items: [...entry.items] };
    updated.items[itemIdx] = { ...updated.items[itemIdx], quantity: newQty };
    updateProductionEntry(updated);
    reload();
    onUpdate();
  };

  const handleUpdateWasteQty = (entryId: string, itemIdx: number, newQty: number) => {
    const entry = wasteEntries.find((e) => e.id === entryId);
    if (!entry) return;
    const updated = { ...entry, items: [...entry.items] };
    updated.items[itemIdx] = { ...updated.items[itemIdx], quantity: newQty };
    updateWasteEntry(updated);
    reload();
    onUpdate();
  };

  const handleRemoveProductionItem = (entryId: string, itemIdx: number) => {
    const entry = productionEntries.find((e) => e.id === entryId);
    if (!entry) return;
    const updated = { ...entry, items: entry.items.filter((_, i) => i !== itemIdx) };
    if (updated.items.length === 0) {
      deleteProductionEntry(entryId);
    } else {
      updateProductionEntry(updated);
    }
    reload();
    onUpdate();
  };

  const handleRemoveWasteItem = (entryId: string, itemIdx: number) => {
    const entry = wasteEntries.find((e) => e.id === entryId);
    if (!entry) return;
    const updated = { ...entry, items: entry.items.filter((_, i) => i !== itemIdx) };
    if (updated.items.length === 0) {
      deleteWasteEntry(entryId);
    } else {
      updateWasteEntry(updated);
    }
    reload();
    onUpdate();
  };

  const handlePrint = () => {
    window.print();
  };

  if (productionEntries.length === 0 && wasteEntries.length === 0) return null;

  const totalProdUnits = productionEntries.reduce(
    (sum, e) => sum + e.items.reduce((s, i) => s + i.quantity, 0), 0
  );
  const totalWasteUnits = wasteEntries.reduce(
    (sum, e) => sum + e.items.reduce((s, i) => s + i.quantity, 0), 0
  );

  return (
    <>
      {/* Printable Report (hidden on screen, shown on print) */}
      <div className="print-only">
        <div className="text-center mb-4 border-b pb-3">
          <div className="flex justify-between items-start">
            <div className="flex-1" />
            <div className="text-center flex-1">
              <h1 className="text-xl font-bold">Keith&apos;s Superstores</h1>
              <p className="text-sm text-gray-500 italic">&ldquo;The Fastest And Friendliest&rdquo;</p>
              <h2 className="text-lg font-semibold mt-2">
                Daily Production &amp; Waste Report
              </h2>
              <p className="text-sm text-gray-600">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="flex-1 flex justify-end">
              <QRCodeCanvas
                data={JSON.stringify({
                  type: 'daily-report',
                  date: getTodayStr(),
                  production: totalProdUnits,
                  waste: totalWasteUnits,
                  entries: productionEntries.length + wasteEntries.length,
                })}
                size={80}
              />
            </div>
          </div>
        </div>

        {productionEntries.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-bold mb-2 border-b pb-1">Production Reports</h3>
            {productionEntries.map((entry) => (
              <div key={entry.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-semibold pr-3">
                      <span>Cook: {entry.employeeName}</span>
                      <span>Shift: {entry.shift}</span>
                    </div>
                    <table className="w-full text-sm mt-1">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-0.5">Item</th>
                          <th className="text-right py-0.5 w-20">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-0.5">{item.itemName}</td>
                            <td className="text-right py-0.5">{item.quantity}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="py-0.5">Total</td>
                          <td className="text-right py-0.5">
                            {entry.items.reduce((s, i) => s + i.quantity, 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <QRCodeCanvas
                      data={JSON.stringify({
                        id: entry.id,
                        type: 'production',
                        date: entry.date,
                        cook: entry.employeeName,
                        shift: entry.shift,
                        items: entry.items.map((i) => ({ name: i.itemName, qty: i.quantity })),
                      })}
                      size={72}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {wasteEntries.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-bold mb-2 border-b pb-1">Waste Reports</h3>
            {wasteEntries.map((entry) => (
              <div key={entry.id} className="mb-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-semibold pr-3">
                      <span>Cook: {entry.employeeName}</span>
                      <span>Shift: {entry.shift}</span>
                    </div>
                    <table className="w-full text-sm mt-1">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-0.5">Item</th>
                          <th className="text-right py-0.5 w-20">Qty</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.items.map((item, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-0.5">{item.itemName}</td>
                            <td className="text-right py-0.5">{item.quantity}</td>
                          </tr>
                        ))}
                        <tr className="font-semibold">
                          <td className="py-0.5">Total</td>
                          <td className="text-right py-0.5">
                            {entry.items.reduce((s, i) => s + i.quantity, 0)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="ml-3 flex-shrink-0">
                    <QRCodeCanvas
                      data={JSON.stringify({
                        id: entry.id,
                        type: 'waste',
                        date: entry.date,
                        cook: entry.employeeName,
                        shift: entry.shift,
                        items: entry.items.map((i) => ({ name: i.itemName, qty: i.quantity })),
                      })}
                      size={72}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t pt-2 text-sm">
          <div className="flex justify-between font-semibold">
            <span>Total Production: {totalProdUnits} units</span>
            <span>Total Waste: {totalWasteUnits} units</span>
          </div>
          {totalProdUnits > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Waste Rate: {Math.round((totalWasteUnits / (totalProdUnits + totalWasteUnits)) * 100)}%
            </p>
          )}
        </div>
      </div>

      {/* On-screen log */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            Today&apos;s Log
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-xs"
              onClick={handlePrint}
            >
              <Printer className="h-3 w-3 mr-1" />
              Print
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
        {productionEntries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const isEditing = editingId === entry.id;
          const isConfirmingDelete = confirmDeleteId === entry.id;
          const totalUnits = entry.items.reduce((s, i) => s + i.quantity, 0);

          return (
            <div key={entry.id} className="bg-green-50 rounded-lg overflow-hidden border border-green-200">
              <div
                className="flex items-center justify-between p-2.5 cursor-pointer"
                onClick={() => {
                  setExpandedId(isExpanded ? null : entry.id);
                  setEditingId(null);
                  setConfirmDeleteId(null);
                }}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{entry.employeeName}</span>
                  <div className="text-xs text-muted-foreground">
                    {entry.items.length} items, {totalUnits} units
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="success">Production</Badge>
                  <Badge variant="outline">{entry.shift}</Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-green-200 p-2.5 space-y-2">
                  {/* Items list */}
                  <div className="space-y-1">
                    {entry.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate">{item.itemName}</span>
                        {isEditing ? (
                          <>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateProductionQty(entry.id, idx, parseInt(e.target.value) || 0)
                              }
                              className="w-16 h-7 text-center text-sm"
                              min={0}
                            />
                            <button
                              onClick={() => handleRemoveProductionItem(entry.id, idx)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-muted-foreground tabular-nums">{item.quantity}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    {isConfirmingDelete ? (
                      <>
                        <span className="text-xs text-red-600 flex-1 self-center">Delete this entry?</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => handleDeleteProduction(entry.id)}
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs flex-1"
                          onClick={() => setEditingId(isEditing ? null : entry.id)}
                        >
                          {isEditing ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Done
                            </>
                          ) : (
                            <>
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setConfirmDeleteId(entry.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {wasteEntries.map((entry) => {
          const isExpanded = expandedId === entry.id;
          const isEditing = editingId === entry.id;
          const isConfirmingDelete = confirmDeleteId === entry.id;
          const totalUnits = entry.items.reduce((s, i) => s + i.quantity, 0);

          return (
            <div key={entry.id} className="bg-red-50 rounded-lg overflow-hidden border border-red-200">
              <div
                className="flex items-center justify-between p-2.5 cursor-pointer"
                onClick={() => {
                  setExpandedId(isExpanded ? null : entry.id);
                  setEditingId(null);
                  setConfirmDeleteId(null);
                }}
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{entry.employeeName}</span>
                  <div className="text-xs text-muted-foreground">
                    {entry.items.length} items, {totalUnits} units
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="danger">Waste</Badge>
                  <Badge variant="outline">{entry.shift}</Badge>
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-red-200 p-2.5 space-y-2">
                  <div className="space-y-1">
                    {entry.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        <span className="flex-1 truncate">{item.itemName}</span>
                        {isEditing ? (
                          <>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateWasteQty(entry.id, idx, parseInt(e.target.value) || 0)
                              }
                              className="w-16 h-7 text-center text-sm"
                              min={0}
                            />
                            <button
                              onClick={() => handleRemoveWasteItem(entry.id, idx)}
                              className="text-red-400 hover:text-red-600"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <span className="text-muted-foreground tabular-nums">{item.quantity}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    {isConfirmingDelete ? (
                      <>
                        <span className="text-xs text-red-600 flex-1 self-center">Delete this entry?</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setConfirmDeleteId(null)}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => handleDeleteWaste(entry.id)}
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs flex-1"
                          onClick={() => setEditingId(isEditing ? null : entry.id)}
                        >
                          {isEditing ? (
                            <>
                              <Check className="h-3 w-3 mr-1" />
                              Done
                            </>
                          ) : (
                            <>
                              <Edit2 className="h-3 w-3 mr-1" />
                              Edit
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs flex-1 text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => setConfirmDeleteId(entry.id)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
    </>
  );
}
