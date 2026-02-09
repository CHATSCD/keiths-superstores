'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeCanvasProps {
  data: string;
  size?: number;
}

export default function QRCodeCanvas({ data, size = 100 }: QRCodeCanvasProps) {
  const [src, setSrc] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(data, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
    }).then(setSrc);
  }, [data, size]);

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="QR Code" width={size} height={size} style={{ imageRendering: 'pixelated' }} />
  );
}
