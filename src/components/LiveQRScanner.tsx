'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, CameraOff, Upload } from 'lucide-react';

interface LiveQRScannerProps {
  onDetected: (rawData: string) => void;
  label?: string;
}

export default function LiveQRScanner({ onDetected, label }: LiveQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const detectedRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setActive(false);
  }, []);

  // Scan a single canvas frame — tries at 1x and 2x (zoomed center) for small QRs
  const scanFrame = useCallback(
    (ctx: CanvasRenderingContext2D, w: number, h: number): string | null => {
      // Full image scan
      const full = ctx.getImageData(0, 0, w, h);
      const found = jsQR(full.data, full.width, full.height, { inversionAttempts: 'dontInvert' });
      if (found?.data) return found.data;

      // Zoomed center (inner 50% of the frame — where the reticle is)
      const cx = Math.floor(w * 0.25);
      const cy = Math.floor(h * 0.25);
      const cw = Math.floor(w * 0.5);
      const ch = Math.floor(h * 0.5);
      const center = ctx.getImageData(cx, cy, cw, ch);
      const found2 = jsQR(center.data, center.width, center.height, { inversionAttempts: 'dontInvert' });
      if (found2?.data) return found2.data;

      return null;
    },
    []
  );

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || detectedRef.current) return;
    if (video.readyState < video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) { rafRef.current = requestAnimationFrame(tick); return; }
    ctx.drawImage(video, 0, 0);

    const data = scanFrame(ctx, canvas.width, canvas.height);
    if (data) {
      detectedRef.current = true;
      stopCamera();
      onDetected(data);
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [scanFrame, stopCamera, onDetected]);

  const startCamera = useCallback(async () => {
    setError(null);
    detectedRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setActive(true);
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      setError('Camera access denied. Try uploading a photo instead.');
    }
  }, [tick]);

  // Photo upload fallback
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          const result = scanFrame(ctx, canvas.width, canvas.height);
          if (result) {
            onDetected(result);
          } else {
            setError('No QR code found in image. Try a clearer photo or use the camera.');
          }
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    },
    [scanFrame, onDetected]
  );

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className="space-y-2">
      {!active ? (
        <div className="flex gap-2">
          <button
            onClick={startCamera}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-3 rounded-xl font-semibold text-sm"
          >
            <Camera className="h-5 w-5" />
            {label || 'Scan QR Code'}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1 bg-gray-100 text-gray-700 px-3 py-3 rounded-xl text-sm border"
          >
            <Upload className="h-4 w-4" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border-2 border-green-500 bg-black">
          {/* Live video viewfinder */}
          <video
            ref={videoRef}
            className="w-full max-h-72 object-cover"
            playsInline
            muted
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Targeting reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-44 h-44">
              {/* Corner marks */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-md" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-md" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-md" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-md" />
              {/* Scan line animation */}
              <div className="absolute left-1 right-1 h-0.5 bg-green-400 opacity-80 animate-scan-line" />
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={stopCamera}
            className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-lg"
          >
            <CameraOff className="h-4 w-4" />
          </button>

          <p className="absolute bottom-0 left-0 right-0 text-center text-xs text-white bg-black/50 py-1.5">
            Aim the box at the QR code
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2 border border-red-200">
          {error}
        </p>
      )}
    </div>
  );
}
