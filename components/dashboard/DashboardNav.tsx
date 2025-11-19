'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function DashboardNav({ storeName }: { storeName: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push(`/${storeName}/dashboard/login`);
  };

  const navItems = [
    { href: `/${storeName}/dashboard`, label: 'Overview' },
    { href: `/${storeName}/dashboard/reservations`, label: 'Reservations' },
    { href: `/${storeName}/dashboard/services`, label: 'Services' },
    { href: `/${storeName}/dashboard/settings`, label: 'Settings' },
  ];

  return (
    <nav className="bg-surface border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link href={`/${storeName}/dashboard`} className="text-xl font-bold text-primary">
              {storeName}
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
            <Link href={`/${storeName}`} target="_blank">
              <Button variant="outline" size="sm">
                View Store
              </Button>
            </Link>
            <ThemeToggle />
            <Button variant="secondary" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
