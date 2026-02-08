'use client';

import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, Loader2, CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { performOcr } from '@/lib/ocr';
import { getInventory } from '@/lib/storage';
import { OcrResult, ScanStage } from '@/types';

interface ScannerProps {
  onScanComplete: (result: OcrResult) => void;
}

const STAGE_LABELS: Record<ScanStage, string> = {
  idle: '',
  preprocessing: 'Preprocessing image...',
  scanning: 'Scanning text with OCR...',
  processing: 'Processing & matching items...',
  complete: 'Scan complete!',
  error: 'Scan failed',
};

const STAGE_PROGRESS: Record<ScanStage, number> = {
  idle: 0,
  preprocessing: 20,
  scanning: 60,
  processing: 85,
  complete: 100,
  error: 0,
};

export default function Scanner({ onScanComplete }: ScannerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<ScanStage>('idle');
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImage = useCallback(async (dataUrl: string) => {
    setPreview(dataUrl);
    setError(null);
    try {
      const inventory = getInventory();
      const result = await performOcr(dataUrl, inventory, setStage);
      onScanComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'OCR scan failed');
      setStage('error');
    }
  }, [onScanComplete]);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          handleImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [handleImage]
  );

  const reset = () => {
    setStage('idle');
    setPreview(null);
    setError(null);
  };

  const isScanning = stage !== 'idle' && stage !== 'complete' && stage !== 'error';

  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      {stage === 'idle' && (
        <div className="flex gap-3">
          <Button
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 bg-keiths-red hover:bg-keiths-darkRed"
            size="lg"
          >
            <Camera className="h-5 w-5 mr-2" />
            Camera
          </Button>
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex-1"
            size="lg"
          >
            <Upload className="h-5 w-5 mr-2" />
            Upload
          </Button>
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* Preview */}
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

      {/* Progress */}
      {stage !== 'idle' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {stage === 'complete' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {stage === 'error' && <AlertCircle className="h-4 w-4 text-red-600" />}
            {isScanning && <Loader2 className="h-4 w-4 animate-spin text-keiths-red" />}
            <span className="text-sm font-medium">{STAGE_LABELS[stage]}</span>
          </div>
          <Progress value={STAGE_PROGRESS[stage]} />

          {/* Stage indicators */}
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="text-keiths-red font-medium">Preprocess</span>
            <span
              className={
                stage === 'scanning' || stage === 'processing' || stage === 'complete'
                  ? 'text-keiths-red font-medium'
                  : ''
              }
            >
              Scan
            </span>
            <span
              className={
                stage === 'processing' || stage === 'complete'
                  ? 'text-keiths-red font-medium'
                  : ''
              }
            >
              Process
            </span>
            <span className={stage === 'complete' ? 'text-green-600 font-medium' : ''}>Done</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Reset */}
      {(stage === 'complete' || stage === 'error') && (
        <Button onClick={reset} variant="outline" className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Scan Another
        </Button>
      )}
    </div>
  );
}
