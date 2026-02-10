'use client';

import React from 'react';
import Image from 'next/image';
import { useStore } from '@/context/StoreContext';
import { ChevronDown } from 'lucide-react';

export default function Header() {
  const { currentStore, openPicker } = useStore();

  return (
    <header className="no-print shadow-md">
      <div className="max-w-lg mx-auto">
        <Image
          src="/logo.svg"
          alt="Keith's Superstores — The Fastest And Friendliest"
          width={400}
          height={100}
          className="w-full h-auto"
          priority
        />
      </div>

      {/* Store selector bar */}
      <div className="bg-blue-800 text-white">
        <div className="max-w-lg mx-auto px-3 py-1.5">
          <button
            onClick={openPicker}
            className="w-full flex items-center justify-between gap-2 text-left hover:bg-blue-700 rounded-lg px-2 py-1 transition-colors"
          >
            <div className="min-w-0">
              {currentStore ? (
                <>
                  <span className="font-bold text-sm truncate block">{currentStore.name}</span>
                  {currentStore.address && (
                    <span className="text-blue-200 text-xs truncate block">
                      {currentStore.address}, {currentStore.city}, {currentStore.state}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-blue-200 text-sm">Tap to select your store</span>
              )}
            </div>
            <ChevronDown size={16} className="text-blue-300 shrink-0" />
          </button>
        </div>
      </div>
    </header>
  );
}
