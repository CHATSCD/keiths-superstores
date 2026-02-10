'use client';

import React, { useState, useCallback } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import LiveQRScanner from '@/components/LiveQRScanner';
import { QRCodeData, ItemQRCodeData, AnyQRCode } from '@/lib/ocr';
import { OcrResult } from '@/types';

interface ScannerProps {
  onScanComplete: (result: OcrResult, qrData: QRCodeData | null) => void;
  onItemsScanned?: (items: { itemId: string; itemName: string; quantity: number }[]) => void;
}

interface ScannedItem {
  itemId: string;
  itemName: string;
  quantity: number;
}

export default function Scanner({ onScanComplete, onItemsScanned }: ScannerProps) {
  const [scannedItems, setScannedItems] = useState<ScannedItem[]>([]);
  const [pendingItem, setPendingItem] = useState<ItemQRCodeData | null>(null);
  const [pendingQty, setPendingQty] = useState('');
  const [scanError, setScanError] = useState<string | null>(null);

  // Called by LiveQRScanner when a QR is detected
  const handleQRDetected = useCallback(
    (raw: string) => {
      setScanError(null);
      try {
        const parsed = JSON.parse(raw) as AnyQRCode;

        if (parsed.type === 'item') {
          const itemQR = parsed as ItemQRCodeData;
          const already = scannedItems.find((i) => i.itemId === itemQR.id);
          if (already) {
            setScanError(`"${itemQR.name}" already added (qty: ${already.quantity}). Remove it first to re-scan.`);
            return;
          }
          setPendingItem(itemQR);
          setPendingQty('');
          return;
        }

        // Sheet-level QR (production / waste) — auto-fill employee/shift
        if (parsed.type === 'production' || parsed.type === 'waste') {
          const sheetQR = parsed as QRCodeData;
          const emptyResult: OcrResult = {
            employeeName: sheetQR.employeeName,
            shift: sheetQR.shift,
            items: [],
            rawText: '',
            overallConfidence: 100,
          };
          onScanComplete(emptyResult, sheetQR);
          return;
        }

        setScanError('Unrecognized QR code. Make sure to scan the QR codes printed on your sheet.');
      } catch {
        setScanError('Could not read QR code data. Try again.');
      }
    },
    [scannedItems, onScanComplete]
  );

  const confirmPendingItem = () => {
    if (!pendingItem) return;
    const qty = parseInt(pendingQty) || 0;
    if (qty <= 0) { setScanError('Enter a quantity greater than 0'); return; }
    setScannedItems((prev) => [
      ...prev,
      { itemId: pendingItem.id, itemName: pendingItem.name, quantity: qty },
    ]);
    setPendingItem(null);
    setPendingQty('');
    setScanError(null);
  };

  const removeScannedItem = (itemId: string) =>
    setScannedItems((prev) => prev.filter((i) => i.itemId !== itemId));

  const submitScannedItems = () => {
    if (onItemsScanned && scannedItems.length > 0) {
      onItemsScanned(scannedItems);
    }
  };

  return (
    <div className="space-y-4">
      {/* How-to hint */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <strong>How to scan:</strong> Print the sheet, fill in bubbles, then scan each item&apos;s QR code and type the quantity.
        Use the <strong>QR Reference page</strong> (print separately) for easy large-format QR codes.
      </div>

      {/* Pending item — quantity entry */}
      {pendingItem ? (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4 space-y-3">
          <p className="text-base font-bold text-yellow-900">
            Scanned: <span className="text-green-700">{pendingItem.name}</span>
          </p>
          <p className="text-sm text-yellow-700">How many were made / wasted?</p>
          <div className="flex gap-2">
            <Input
              type="number"
              value={pendingQty}
              onChange={(e) => setPendingQty(e.target.value)}
              placeholder="Qty"
              className="flex-1 text-xl font-bold text-center h-14"
              min={1}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && confirmPendingItem()}
            />
            <Button
              onClick={confirmPendingItem}
              className="bg-green-600 hover:bg-green-700 h-14 px-6 text-base"
            >
              <Plus className="h-5 w-5 mr-1" /> Add
            </Button>
          </div>
          <button
            onClick={() => { setPendingItem(null); setPendingQty(''); setScanError(null); }}
            className="text-xs text-gray-500 underline"
          >
            Cancel — scan a different item
          </button>
        </div>
      ) : (
        /* Camera scanner */
        <LiveQRScanner
          onDetected={handleQRDetected}
          label="Scan Item QR Code"
        />
      )}

      {scanError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {scanError}
        </div>
      )}

      {/* Scanned list */}
      {scannedItems.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Items Recorded ({scannedItems.length})
          </p>
          {scannedItems.map((item) => (
            <div
              key={item.itemId}
              className="flex items-center justify-between bg-white rounded-lg border px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium">{item.itemName}</p>
                <p className="text-xs text-green-700 font-bold">Qty: {item.quantity}</p>
              </div>
              <button
                onClick={() => removeScannedItem(item.itemId)}
                className="text-red-400 hover:text-red-600 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <Button
            onClick={submitScannedItems}
            className="w-full bg-green-600 hover:bg-green-700 h-12 text-base"
          >
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Save — {scannedItems.length} item{scannedItems.length !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  );
}
