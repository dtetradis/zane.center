'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import type { Store } from '@/types';
import { useEffect, useState } from 'react';
import { useThemeStore } from '@/store/useThemeStore';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/contexts/LanguageContext';

export default function StoreNav({ store }: { store: Store }) {
  const pathname = usePathname();
  const { getItemCount, getTotalPrice } = useCartStore();
  const { setColors } = useThemeStore();
  const { t } = useLanguage();
  const [itemCount, setItemCount] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
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
    setTotalPrice(getTotalPrice());
  }, [getItemCount, getTotalPrice]);

  // Subscribe to cart changes
  useEffect(() => {
    const unsubscribe = useCartStore.subscribe((state) => {
      setItemCount(state.items.length);
      setTotalPrice(state.items.reduce((total, item) => total + item.service.price, 0));
    });
    return () => unsubscribe();
  }, []);

  const storeName = store.store_name || store.storeName;

  // Check if we're on the reservation or checkout page
  const isBookingPage = pathname?.includes('/reservation') || pathname?.includes('/checkout');

  return (
    <>
      {/* Top Navigation - Store Name with Language Toggle */}
      <nav className="bg-surface border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex-1"></div>
            <Link href={`/${storeName}`} className="text-2xl md:text-3xl font-bold text-primary">
              {store.title || storeName}
            </Link>
            <div className="flex-1 flex justify-end">
              <LanguageToggle />
            </div>
          </div>
        </div>
      </nav>

      {/* Bottom Cart Bar - Always show on main page */}
      {mounted && !isBookingPage && (
        <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
          <div className="container mx-auto px-4 py-4">
            <Link
              href={`/${storeName}/reservation`}
              className={`flex items-center justify-between bg-primary text-white rounded-xl p-4 transition-all shadow-xl pointer-events-auto ${
                itemCount > 0 ? 'hover:bg-primary-hover' : 'opacity-60 cursor-default'
              }`}
              onClick={(e) => itemCount === 0 && e.preventDefault()}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {itemCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-semibold">{t('store.viewCart')}</p>
                  <p className="text-xs text-white/80">{itemCount} {t('store.servicesSelected')}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold">€{totalPrice.toFixed(2)}</p>
                <p className="text-xs text-white/80">{t('store.proceedToBooking')}</p>
              </div>
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
