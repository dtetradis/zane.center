import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ThemeColors } from '@/types';

interface ThemeState {
  isDark: boolean;
  colors: ThemeColors;

  // Actions
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
  setColors: (colors: ThemeColors) => void;
  applyColors: () => void;
}

const defaultColors: ThemeColors = {
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryLight: '#93c5fd',
  secondary: '#64748b',
  accent: '#f59e0b',
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      isDark: false,
      colors: defaultColors,

      toggleTheme: () => {
        set((state) => {
          const newIsDark = !state.isDark;
          if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', newIsDark);
          }
          return { isDark: newIsDark };
        });
      },

      setTheme: (isDark) => {
        set({ isDark });
        if (typeof document !== 'undefined') {
          document.documentElement.classList.toggle('dark', isDark);
        }
      },

      setColors: (colors) => {
        set({ colors });
        get().applyColors();
      },

      applyColors: () => {
        if (typeof document !== 'undefined') {
          const { colors } = get();
          const root = document.documentElement;

          root.style.setProperty('--color-primary', colors.primary);
          root.style.setProperty('--color-primary-hover', colors.primaryHover);
          root.style.setProperty('--color-primary-light', colors.primaryLight);
          root.style.setProperty('--color-secondary', colors.secondary);
          root.style.setProperty('--color-accent', colors.accent);
        }
      },
    }),
    {
      name: 'zane-center-theme',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
