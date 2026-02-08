'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { ClipboardList, Trash2, FileText, PenLine } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Scanner from '@/components/Scanner';
import OcrResults from '@/components/OcrResults';
import ManualEntryForm from '@/components/ManualEntryForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  getProductionEntriesByDate,
  getWasteEntriesByDate,
  saveProductionEntry,
  saveWasteEntry,
  getEmployees,
  getTodayStr,
  generateId,
} from '@/lib/storage';
import { OcrResult, ProductionEntry, WasteEntry } from '@/types';

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('production');
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [todayProduction, setTodayProduction] = useState(0);
  const [todayWaste, setTodayWaste] = useState(0);
  const [saved, setSaved] = useState(false);

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
        <TodayLog />
      </main>

      <BottomNav />
    </div>
  );
}

function TodayLog() {
  const [entries, setEntries] = useState<{ production: ProductionEntry[]; waste: WasteEntry[] }>({
    production: [],
    waste: [],
  });

  useEffect(() => {
    const today = getTodayStr();
    setEntries({
      production: getProductionEntriesByDate(today),
      waste: getWasteEntriesByDate(today),
    });
  }, []);

  if (entries.production.length === 0 && entries.waste.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Today&apos;s Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.production.map((entry) => (
          <div key={entry.id} className="bg-green-50 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{entry.employeeName}</span>
              <div className="flex gap-1.5">
                <Badge variant="success">Production</Badge>
                <Badge variant="outline">{entry.shift}</Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {entry.items.length} items, {entry.items.reduce((s, i) => s + i.quantity, 0)} total
              units
            </div>
          </div>
        ))}
        {entries.waste.map((entry) => (
          <div key={entry.id} className="bg-red-50 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{entry.employeeName}</span>
              <div className="flex gap-1.5">
                <Badge variant="danger">Waste</Badge>
                <Badge variant="outline">{entry.shift}</Badge>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {entry.items.length} items, {entry.items.reduce((s, i) => s + i.quantity, 0)} total
              units
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
