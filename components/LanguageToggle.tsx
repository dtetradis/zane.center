'use client';

import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageToggleProps {
  vertical?: boolean;
}

export function LanguageToggle({ vertical = false }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  return (
    <div className={`flex ${vertical ? 'flex-col' : 'gap-1'} bg-surface-secondary rounded-lg p-1`}>
      <button
        onClick={() => setLanguage('el')}
        className={`${vertical ? 'px-2 py-1.5' : 'px-3 py-1.5'} rounded font-medium text-sm transition-colors ${
          language === 'el'
            ? 'bg-primary text-white'
            : 'text-text-secondary hover:text-text'
        }`}
      >
        ΕΛ
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`${vertical ? 'px-2 py-1.5' : 'px-3 py-1.5'} rounded font-medium text-sm transition-colors ${
          language === 'en'
            ? 'bg-primary text-white'
            : 'text-text-secondary hover:text-text'
        }`}
      >
        EN
      </button>
    </div>
  );
}
