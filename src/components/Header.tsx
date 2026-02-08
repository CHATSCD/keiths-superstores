'use client';

import React from 'react';

export default function Header() {
  return (
    <header
      className="no-print shadow-md"
      style={{
        background: 'linear-gradient(to bottom, #5B9BD5 0%, #2E75B6 85%, #C65D07 100%)',
      }}
    >
      <div className="max-w-lg mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Leopard mascot */}
          <div className="w-12 h-12 flex-shrink-0 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-2xl" role="img" aria-label="leopard mascot">
              🐆
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h1
              className="text-xl font-black text-white leading-tight tracking-wide"
              style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}
            >
              KEITH&apos;S
            </h1>
            <p
              className="text-sm font-black leading-tight -mt-0.5"
              style={{
                color: '#DC2626',
                textShadow: '0 0 4px rgba(255,255,255,0.5)',
              }}
            >
              SUPERSTORES
            </p>
            <p className="text-[10px] text-white/90 italic">
              &ldquo;The Fastest And Friendliest&rdquo;
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-[10px] text-white/70 font-medium bg-white/10 rounded px-1.5 py-0.5">
              Waste Tracking
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
