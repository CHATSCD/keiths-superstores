'use client';

import { OcrResult, OcrLineItem, InventoryItem, ScanStage } from '@/types';
import jsQR from 'jsqr';

// QR Code data structure
export interface QRCodeData {
  type: 'production' | 'waste';
  employeeName: string;
  shift: 'AM' | 'PM' | 'Night';
  date: string;
  items: number;
  increment: number;
  maxQty: number;
}

// Decode QR code from image
export async function decodeQRCode(imageData: string): Promise<QRCodeData | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const code = jsQR(imageData.data, imageData.width, imageData.height);

      if (code && code.data) {
        try {
          const parsed = JSON.parse(code.data) as QRCodeData;
          resolve(parsed);
        } catch {
          resolve(null);
        }
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageData;
  });
}

// Levenshtein distance
function levenshtein(a: string, b: string): number {
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

function similarityRatio(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

// OCR character error correction
function correctOcrErrors(text: string): string {
  let corrected = text;
  // Common OCR mistakes in quantity context
  corrected = corrected.replace(/rn/g, 'm');
  return corrected;
}

function correctQuantityStr(str: string): string {
  return str
    .replace(/O/g, '0')
    .replace(/o/g, '0')
    .replace(/I/g, '1')
    .replace(/l/g, '1')
    .replace(/S/g, '5')
    .replace(/B/g, '8');
}

// Fuzzy matching
export function fuzzyMatch(
  input: string,
  items: InventoryItem[],
  threshold = 0.6
): { item: InventoryItem; score: number }[] {
  const normalized = correctOcrErrors(input.toLowerCase().trim());
  const matches = items
    .map((item) => ({
      item,
      score: Math.max(
        similarityRatio(normalized, item.name.toLowerCase()),
        // Also check if the input contains the item name or vice versa
        item.name.toLowerCase().includes(normalized) ? 0.85 : 0,
        normalized.includes(item.name.toLowerCase()) ? 0.85 : 0
      ),
    }))
    .filter((m) => m.score >= threshold)
    .sort((a, b) => b.score - a.score);
  return matches;
}

// Image preprocessing using canvas
export function preprocessImage(imageData: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;

      // Draw original
      ctx.drawImage(img, 0, 0);

      // Get pixel data
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        // Grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;

        // Increase contrast (1.5x)
        const contrasted = Math.min(255, Math.max(0, (gray - 128) * 1.5 + 128));

        // Threshold (binary)
        const threshold = contrasted > 128 ? 255 : 0;

        data[i] = threshold;
        data[i + 1] = threshold;
        data[i + 2] = threshold;
      }

      ctx.putImageData(imgData, 0, 0);

      // Sharpen pass
      const sharpenCanvas = document.createElement('canvas');
      sharpenCanvas.width = canvas.width;
      sharpenCanvas.height = canvas.height;
      const sCtx = sharpenCanvas.getContext('2d')!;
      sCtx.drawImage(canvas, 0, 0);

      resolve(sharpenCanvas.toDataURL('image/png'));
    };
    img.src = imageData;
  });
}

// Parse OCR text into structured data
function parseOcrText(
  rawText: string,
  inventory: InventoryItem[]
): { employeeName: string; shift: 'AM' | 'PM' | 'Night' | ''; items: OcrLineItem[] } {
  const lines = rawText.split('\n').filter((l) => l.trim().length > 0);
  let employeeName = '';
  let shift: 'AM' | 'PM' | 'Night' | '' = '';
  const items: OcrLineItem[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // Try to detect shift
    if (/\b(AM|am|morning)\b/i.test(trimmed) && !shift) {
      shift = 'AM';
    } else if (/\b(PM|pm|afternoon|evening)\b/i.test(trimmed) && !shift) {
      shift = 'PM';
    } else if (/\b(night|overnight)\b/i.test(trimmed) && !shift) {
      shift = 'Night';
    }

    // Try to detect employee name (lines with "name:", "cook:", "employee:", "by:")
    const nameMatch = trimmed.match(/(?:name|cook|employee|by|prepared)\s*[:\-]\s*(.+)/i);
    if (nameMatch && !employeeName) {
      employeeName = nameMatch[1].trim();
      continue;
    }

    // Try to parse as item + quantity
    // Patterns: "Item Name - 10", "Item Name: 10", "Item Name  10", "10 x Item Name", "10  Item Name"
    let itemText = '';
    let qtyStr = '';

    const pattern1 = trimmed.match(/^(.+?)[\s\-:]+(\d+)\s*$/);
    const pattern2 = trimmed.match(/^(\d+)\s*[x×]?\s+(.+)$/);

    if (pattern1) {
      itemText = pattern1[1].trim();
      qtyStr = pattern1[2];
    } else if (pattern2) {
      qtyStr = pattern2[1];
      itemText = pattern2[2].trim();
    }

    if (itemText && qtyStr) {
      const correctedQty = parseInt(correctQuantityStr(qtyStr), 10);
      const quantity = isNaN(correctedQty) ? 0 : correctedQty;

      const matches = fuzzyMatch(itemText, inventory);
      const topMatch = matches[0];

      if (topMatch) {
        items.push({
          rawText: trimmed,
          matchedItem: topMatch.item.name,
          matchedItemId: topMatch.item.id,
          quantity,
          confidence: Math.round(topMatch.score * 100),
          alternatives: matches.slice(1, 4).map((m) => ({
            name: m.item.name,
            score: Math.round(m.score * 100),
          })),
        });
      } else {
        items.push({
          rawText: trimmed,
          matchedItem: itemText,
          matchedItemId: '',
          quantity,
          confidence: 0,
          alternatives: [],
        });
      }
    }
  }

  return { employeeName, shift, items };
}

// Main OCR function
export async function performOcr(
  imageData: string,
  inventory: InventoryItem[],
  onStageChange: (stage: ScanStage) => void
): Promise<OcrResult> {
  try {
    onStageChange('preprocessing');
    const processedImage = await preprocessImage(imageData);

    onStageChange('scanning');
    const Tesseract = await import('tesseract.js');
    const { data } = await Tesseract.recognize(processedImage, 'eng', {
      logger: (m: { status: string }) => {
        if (m.status === 'recognizing text') {
          onStageChange('scanning');
        }
      },
    });

    onStageChange('processing');
    const rawText = data.text;
    const parsed = parseOcrText(rawText, inventory);

    const overallConfidence =
      parsed.items.length > 0
        ? Math.round(
            parsed.items.reduce((sum, i) => sum + i.confidence, 0) / parsed.items.length
          )
        : 0;

    onStageChange('complete');

    return {
      employeeName: parsed.employeeName,
      shift: parsed.shift,
      items: parsed.items,
      rawText,
      overallConfidence,
    };
  } catch (error) {
    onStageChange('error');
    throw error;
  }
}
