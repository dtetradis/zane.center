import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import StoreNav from '@/components/store/StoreNav';

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeName: string };
}) {
  const supabase = await createClient();

  // Fetch store data
  const { data: store, error } = await supabase
    .from('stores')
    .select('*')
    .eq('store_name', params.storeName)
    .single();

  if (error || !store) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      <StoreNav store={store} />
      <main>{children}</main>
    </div>
  );
}
