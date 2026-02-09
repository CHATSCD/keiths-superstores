'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ClipboardList, Trash2, Settings, Printer, TrendingUp, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const items = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/production', icon: ClipboardList, label: 'Production' },
    { href: '/waste', icon: Trash2, label: 'Waste' },
    { href: '/count', icon: Package, label: 'Count' },
    { href: '/manager', icon: TrendingUp, label: 'Manager' },
    { href: '/print', icon: Printer, label: 'Print' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 no-print">
      <div className="max-w-lg mx-auto flex">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex-1 flex flex-col items-center py-2 px-1 text-[10px] transition-colors',
                isActive ? 'text-keiths-red' : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <item.icon className={cn('h-5 w-5 mb-0.5', isActive && 'stroke-[2.5]')} />
              <span className={cn(isActive && 'font-semibold')}>{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
