import { createClient } from '@/lib/supabase/server';
import StoreServicesClient from '@/components/store/StoreServicesClient';

export default async function StorePage({ params }: { params: { storeName: string } }) {
  const supabase = await createClient();

  // Fetch store and services
  const { data: store, error: storeError } = await supabase
    .from('stores')
    .select('*')
    .eq('store_name', params.storeName)
    .single();

  console.log('Store fetch:', { store, storeError });

  const { data: services, error: servicesError } = await supabase
    .from('services')
    .select('*')
    .eq('id_store', store?.id)
    .order('index', { ascending: true });

  console.log('Services fetch:', { services, servicesError, storeId: store?.id });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-text mb-4">{store?.title}</h1>
        <p className="text-xl text-text-secondary mb-2">{store?.address}</p>
        {store?.reviews && (
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <svg
                  key={i}
                  className={`w-5 h-5 ${
                    i < Math.floor(store.reviews || 0) ? 'text-accent' : 'text-border'
                  }`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-text-secondary">({store.reviews.toFixed(1)})</span>
          </div>
        )}
      </div>

      {/* Categories */}
      {store?.categories && store.categories.length > 0 && (
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {store.categories.map((category) => (
              <span
                key={category}
                className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {category}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-text mb-6">Our Services</h2>
        {services && services.length > 0 ? (
          <StoreServicesClient services={services} storeId={store?.id || ''} />
        ) : (
          <div className="text-center py-12 text-text-secondary">
            No services available at the moment
          </div>
        )}
      </div>
    </div>
  );
}
