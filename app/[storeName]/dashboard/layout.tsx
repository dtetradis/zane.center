import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import DashboardNav from '@/components/dashboard/DashboardNav';
import { AccessDenied } from '@/components/dashboard/AccessDenied';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeName: string };
}) {
  // Get current path to check if we're on auth pages
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || headersList.get('x-invoke-path') || '';

  // Skip auth check for login/signup pages
  const isAuthPage = pathname.includes('/login') || pathname.includes('/signup');

  if (isAuthPage) {
    return <>{children}</>;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect(`/${params.storeName}/dashboard/login`);
  }

  // Fetch store to check whitelist
  const { data: store } = await supabase
    .from('stores')
    .select('whitelist')
    .eq('store_name', params.storeName)
    .single();

  // Check if user's email is in the whitelist
  const whitelist = store?.whitelist || [];
  const isWhitelisted = whitelist.includes(user.email || '');

  if (!isWhitelisted) {
    return <AccessDenied email={user.email || ''} storeName={params.storeName} />;
  }

  return (
    <>
      <DashboardNav storeName={params.storeName} />
      <main className="ml-16 px-6 py-8" style={{ width: 'calc(100vw - 4rem)' }}>
        {children}
      </main>
    </>
  );
}
