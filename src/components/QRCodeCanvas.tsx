'use client';

import React, { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeCanvasProps {
  data: string;
  size?: number;
}

export default function QRCodeCanvas({ data, size = 100 }: QRCodeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: size,
        margin: 1,
        color: { dark: '#000000', light: '#ffffff' },
      });
    }
  }, [data, size]);

  return <canvas ref={canvasRef} />;
}
