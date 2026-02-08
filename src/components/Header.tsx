'use client';

import React from 'react';

export default function Header() {
  return (
    <header className="bg-keiths-red text-white px-4 py-3 shadow-md no-print">
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-keiths-red font-bold text-lg">K</span>
        </div>
        <div>
          <h1 className="text-lg font-bold leading-tight">Keith&apos;s Superstores</h1>
          <p className="text-xs text-red-200">The Fastest And Friendliest</p>
        </div>
      </div>
    </header>
  );
}
