import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import ConditionalStoreNav from '@/components/store/ConditionalStoreNav';

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
      <ConditionalStoreNav store={store} />
      <main>{children}</main>
    </div>
  );
}
