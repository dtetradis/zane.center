import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import DashboardNav from '@/components/dashboard/DashboardNav';

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { storeName: string };
}) {
  // TODO: Re-enable authentication for production
  // const supabase = await createClient();
  // const { data: { user } } = await supabase.auth.getUser();

  // if (!user) {
  //   redirect(`/${params.storeName}/dashboard/login`);
  // }

  return (
    <>
      <DashboardNav storeName={params.storeName} />
      <main className="ml-16 container mx-auto px-4 py-8">
        {children}
      </main>
    </>
  );
}
