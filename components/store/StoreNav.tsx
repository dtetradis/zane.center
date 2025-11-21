'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCartStore } from '@/store/useCartStore';
import type { Store } from '@/types';
import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

export default function StoreNav({ store }: { store: Store }) {
  const pathname = usePathname();
  const { getItemCount } = useCartStore();
  const { setColors } = useThemeStore();
  const [itemCount, setItemCount] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Apply store's custom colors
    if (store.themeColors) {
      setColors(store.themeColors);
    }
  }, [store.themeColors, setColors]);

  useEffect(() => {
    setMounted(true);
    setItemCount(getItemCount());
  }, [getItemCount]);

  const storeName = store.store_name || store.storeName;

  const navItems = [
    { href: `/${storeName}`, label: 'Services' },
    { href: `/${storeName}/reservation`, label: 'Book Appointment' },
  ];

  return (
    <nav className="bg-surface border-b border-border shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href={`/${storeName}`} className="text-2xl font-bold text-primary">
              {store.title || storeName}
            </Link>
            <div className="hidden md:flex space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    pathname === item.href
                      ? 'bg-primary text-white'
                      : 'text-text hover:bg-primary/10'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Link
              href={`/${storeName}/reservation`}
              className="relative p-2 rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {mounted && itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
