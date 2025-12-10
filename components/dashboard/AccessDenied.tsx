'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/Button';

interface AccessDeniedProps {
  email: string;
  storeName: string;
}

export function AccessDenied({ email, storeName }: AccessDeniedProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${storeName}/dashboard/login`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center p-8 max-w-md">
        <h1 className="text-2xl font-bold text-text mb-4">{t('dashboard.accessDenied.title')}</h1>
        <p className="text-text-secondary mb-6">
          {t('dashboard.accessDenied.message')} ({email})
        </p>
        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={handleLogout}>
            {t('dashboard.accessDenied.signOut')}
          </Button>
          <a
            href={`/${storeName}`}
            className="text-primary hover:underline text-sm"
          >
            {t('dashboard.accessDenied.returnToStore')}
          </a>
        </div>
      </div>
    </div>
  );
}
