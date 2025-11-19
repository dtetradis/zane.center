'use client';

import { useEffect } from 'react';
import { useThemeStore } from '@/store/useThemeStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { isDark, applyColors } = useThemeStore();

  useEffect(() => {
    // Apply theme class
    document.documentElement.classList.toggle('dark', isDark);

    // Apply custom colors
    applyColors();
  }, [isDark, applyColors]);

  return <>{children}</>;
}
