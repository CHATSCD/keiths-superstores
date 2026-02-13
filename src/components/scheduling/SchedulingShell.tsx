'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard, CalendarDays, Users, Bell, LogOut, User, Loader2,
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: Array<'admin' | 'manager' | 'employee'>;
}

const NAV: NavItem[] = [
  { href: '/scheduling/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/scheduling/schedule',  label: 'Schedule',  icon: CalendarDays },
  { href: '/scheduling/users',     label: 'Team',      icon: Users, roles: ['admin', 'manager'] },
  { href: '/scheduling/profile',   label: 'Profile',   icon: User },
];

export function SchedulingShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  if (!user) return null;

  const visibleNav = NAV.filter((n) => !n.roles || n.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-blue-800 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-white font-black text-sm">K</span>
          </div>
          <div>
            <p className="font-bold text-sm leading-none">Keith&apos;s Superstores</p>
            <p className="text-blue-200 text-[10px]">{user.role.charAt(0).toUpperCase() + user.role.slice(1)} · {user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <button onClick={() => logout().then(() => router.push('/login'))} className="p-1.5 hover:bg-white/10 rounded-lg">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4 pb-24">
        {children}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-40">
        {visibleNav.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-colors ${
                active ? 'text-blue-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
