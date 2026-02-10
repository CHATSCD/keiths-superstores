'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, RotateCcw, QrCode, Plus, Trash2, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { performOcr, decodeAnyQRCode, QRCodeData, ItemQRCodeData } from '@/lib/ocr';
import { getInventory } from '@/lib/storage';
import { OcrResult, ScanStage } from '@/types';

interface ScannerProps {
  onScanComplete: (result: OcrResult, qrData: QRCodeData | null) => void;
  // Item QR scan callback: called when items are confirmed via per-item QR scanning
  onItemsScanned?: (items: { itemId: string; itemName: string; quantity: number }[]) => void;
}

interface ScannedItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

const STAGE_LABELS: Record<ScanStage, string> = {
  idle: '',
  preprocessing: 'Preprocessing image...',
  scanning: 'Scanning text with OCR...',
  processing: 'Processing & matching items...',
  complete: 'Scan complete!',
  error: 'Scan failed',
};

export default function Scanner({ onScanComplete, onItemsScanned }: ScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const itemCameraRef = useRef<HTMLInputElement>(null);
  const itemFileRef = useRef<HTMLInputElement>(null);

  const [scanMode, setScanMode] = useState<'sheet' | 'items'>('items');
  const [stage, setStage] = useState<ScanStage>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeDetected, setQrCodeDetected] = useState<QRCodeData | null>(null);

  // Item-by-item scanning state
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [pendingItem, setPendingItem] = useState<ItemQRCodeData | null>(null);
  const [pendingQty, setPendingQty] = useState('');
  const [itemScanError, setItemScanError] = useState<string | null>(null);

  // ---- SHEET SCAN MODE ----
  const handleSheetImage = useCallback(async (dataUrl: string) => {
    setPreview(dataUrl);
    setError(null);
    setQrCodeDetected(null);

    try {
      setStage('preprocessing');
      const qrResult = await decodeAnyQRCode(dataUrl);
      let sheetQR: QRCodeData | null = null;
      if (qrResult?.type === 'production' || qrResult?.type === 'waste') {
        sheetQR = qrResult as QRCodeData;
        setQrCodeDetected(sheetQR);
      }

      const inventory = getInventory();
      const result = await performOcr(dataUrl, inventory, setStage);

      if (sheetQR) {
        result.employeeName = sheetQR.employeeName;
        result.shift = sheetQR.shift;
      }

      onScanComplete(result, sheetQR);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Scan failed');
      setStage('error');
    }
  }, [onScanComplete]);

  const handleSheetFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') handleSheetImage(reader.result);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [handleSheetImage]
  );

  // ---- ITEM QR SCAN MODE ----
  const handleItemImage = useCallback(async (dataUrl: string) => {
    setItemScanError(null);
    try {
      const qrResult = await decodeAnyQRCode(dataUrl);
      if (qrResult?.type === 'item') {
        const itemQR = qrResult as ItemQRCodeData;
        // Check if already scanned
        const existing = scannedItems.find((i) => i.itemId === itemQR.id);
        if (existing) {
          setItemScanError(`"${itemQR.name}" already scanned (qty: ${existing.quantity}). Remove it first to re-scan.`);
          return;
        }
        setPendingItem(itemQR);
        setPendingQty('');
      } else {
        setItemScanError('No item QR code found. Make sure to scan the small QR code on the item row.');
      }
    } catch {
      setItemScanError('Failed to read QR code. Try again with better lighting.');
    }
  }, [scannedItems]);

  const handleItemFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') handleItemImage(reader.result);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [handleItemImage]
  );

  const confirmPendingItem = () => {
    if (!pendingItem) return;
    const qty = parseInt(pendingQty) || 0;
    if (qty <= 0) { setItemScanError('Enter a quantity greater than 0'); return; }
    setScannedItems((prev) => [...prev, { itemId: pendingItem.id, itemName: pendingItem.name, quantity: qty }]);
    setPendingItem(null);
    setPendingQty('');
    setItemScanError(null);
  };

  const removeScannedItem = (itemId: string) => {
    setScannedItems((prev) => prev.filter((i) => i.itemId !== itemId));
  };

  const submitScannedItems = () => {
    if (onItemsScanned && scannedItems.length > 0) {
      onItemsScanned(scannedItems);
    }
  };

  const reset = () => {
    setStage('idle');
    setPreview(null);
    setError(null);
    setQrCodeDetected(null);
  };

  const isScanning = stage !== 'idle' && stage !== 'complete' && stage !== 'error';

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setScanMode('items')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
            scanMode === 'items'
              ? 'bg-green-600 text-white border-green-600'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          <QrCode className="h-4 w-4" />
          Scan Items (QR)
        </button>
        <button
          onClick={() => setScanMode('sheet')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors flex items-center justify-center gap-1.5 ${
            scanMode === 'sheet'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-600 border-gray-200'
          }`}
        >
          <ScanLine className="h-4 w-4" />
          Scan Full Sheet
        </button>
      </div>

      {/* ===== ITEM QR SCAN MODE ===== */}
      {scanMode === 'items' && (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs font-semibold text-green-900">How to use:</p>
            <p className="text-xs text-green-700 mt-0.5">
              Point camera at the small QR code on each item row → enter the quantity → repeat for each item
            </p>
          </div>

          {/* Pending item — enter quantity */}
          {pendingItem ? (
            <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-3 space-y-2">
              <p className="text-sm font-bold text-yellow-900">Item Scanned: {pendingItem.name}</p>
              <p className="text-xs text-yellow-700">How many?</p>
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={pendingQty}
                  onChange={(e) => setPendingQty(e.target.value)}
                  placeholder="Enter quantity"
                  className="flex-1 text-lg font-bold text-center"
                  min={1}
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && confirmPendingItem()}
                />
                <Button onClick={confirmPendingItem} className="bg-green-600 hover:bg-green-700 px-6">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
              <button
                onClick={() => { setPendingItem(null); setPendingQty(''); }}
                className="text-xs text-gray-500 underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            /* Scan next item */
            <div className="flex gap-2">
              <Button
                onClick={() => itemCameraRef.current?.click()}
                className="flex-1 bg-keiths-red hover:bg-keiths-darkRed"
                size="lg"
              >
                <Camera className="h-5 w-5 mr-2" />
                Scan Item QR
              </Button>
              <Button
                onClick={() => itemFileRef.current?.click()}
                variant="outline"
                className="flex-1"
                size="lg"
              >
                <Upload className="h-5 w-5 mr-2" />
                Upload Photo
              </Button>
            </div>
          )}

          <input ref={itemCameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleItemFileChange} />
          <input ref={itemFileRef} type="file" accept="image/*" className="hidden" onChange={handleItemFileChange} />

          {itemScanError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {itemScanError}
            </div>
          )}

          {/* Scanned Items List */}
          {scannedItems.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-gray-600">Scanned Items ({scannedItems.length})</p>
              {scannedItems.map((item) => (
                <div key={item.itemId} className="flex items-center justify-between bg-white rounded-lg border px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{item.itemName}</p>
                    <p className="text-xs text-green-600 font-bold">Qty: {item.quantity}</p>
                  </div>
                  <button onClick={() => removeScannedItem(item.itemId)} className="text-red-400 hover:text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <Button
                onClick={submitScannedItems}
                className="w-full bg-green-600 hover:bg-green-700 mt-2"
                size="lg"
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Done — Use These {scannedItems.length} Items
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ===== FULL SHEET SCAN MODE ===== */}
      {scanMode === 'sheet' && (
        <div className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
            <p className="text-xs text-blue-700">Take a photo of the entire completed sheet. OCR will attempt to read item names and quantities.</p>
          </div>

          {stage === 'idle' && (
            <div className="flex gap-3">
              <Button onClick={() => cameraInputRef.current?.click()} className="flex-1 bg-keiths-red hover:bg-keiths-darkRed" size="lg">
                <Camera className="h-5 w-5 mr-2" /> Camera
              </Button>
              <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="flex-1" size="lg">
                <Upload className="h-5 w-5 mr-2" /> Upload
              </Button>
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleSheetFileChange} />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleSheetFileChange} />
            </div>
          )}

          {preview && (
            <div className="relative rounded-lg overflow-hidden border">
              <img src={preview} alt="Scan preview" className="w-full max-h-48 object-cover" />
              {isScanning && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Loader2 className="h-8 w-8 text-white animate-spin" />
                </div>
              )}
            </div>
          )}

          {qrCodeDetected && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-700">
                <QrCode className="h-5 w-5" />
                <div>
                  <p className="text-sm font-semibold">Sheet QR Detected</p>
                  <p className="text-xs">{qrCodeDetected.type === 'production' ? 'Production' : 'Waste'} — {qrCodeDetected.employeeName} ({qrCodeDetected.shift})</p>
                </div>
              </div>
            </div>
          )}

          {stage !== 'idle' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {stage === 'complete' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                {stage === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
                {isScanning && <Loader2 className="h-4 w-4 animate-spin text-keiths-red" />}
                <span className="text-sm font-medium">{STAGE_LABELS[stage]}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          {(stage === 'complete' || stage === 'error') && (
            <Button onClick={reset} variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" /> Scan Another
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
