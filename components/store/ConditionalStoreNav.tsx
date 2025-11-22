'use client';

import { usePathname } from 'next/navigation';
import StoreNav from './StoreNav';
import type { Store } from '@/types';

export default function ConditionalStoreNav({ store }: { store: Store }) {
  const pathname = usePathname();
  const isDashboard = pathname.includes('/dashboard');

  if (isDashboard) {
    return null;
  }

  return <StoreNav store={store} />;
}
