'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCartStore } from '@/store/useCartStore';
import StoreServicesClient from '@/components/store/StoreServicesClient';
import ImageCarousel from '@/components/store/ImageCarousel';

export default function StorePage({ params }: { params: { storeName: string } }) {
  const { t } = useLanguage();
  const { validateCartItems } = useCartStore();
  const [store, setStore] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, [params.storeName]);

  const fetchData = async () => {
    // Fetch store and services
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('store_name', params.storeName)
      .single();

    console.log('Store fetch:', { store: storeData, storeError });

    if (storeData) {
      setStore(storeData);

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('id_store', storeData.id)
        .order('index', { ascending: true });

      // Transform snake_case to camelCase for services
      const transformedServices = servicesData?.map((service: any) => ({
        ...service,
        serviceName: service.service_name || service.serviceName,
        id_store: service.id_store,
      }));

      console.log('Services fetch:', { services: transformedServices, servicesError, storeId: storeData.id });

      if (transformedServices) {
        setServices(transformedServices);

        // Validate cart items - remove any services that don't belong to this store
        const validServiceIds = transformedServices.map((s: any) => s.id);
        validateCartItems(validServiceIds);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface to-surface-secondary/30 flex items-center justify-center">
        <div className="text-text">{t('common.loading')}</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface to-surface-secondary/30 flex items-center justify-center">
        <div className="text-text">Store not found</div>
      </div>
    );
  }

  // Sample carousel images (in production, these would come from store.photos)
  const carouselImages = store.photos || [
    'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=400&fit=crop',
    'https://images.unsplash.com/photo-1633681122715-2089c0e0e9e5?w=1200&h=400&fit=crop',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-surface-secondary/30">
      {/* Image Carousel */}
      <ImageCarousel images={carouselImages} />

      {/* Store Info Pills */}
      {(store?.reviews || store?.address) && (
        <div className="container mx-auto px-4">
          <div className="py-4 flex flex-wrap items-center justify-center gap-3">
            {store?.reviews && (
              <div className="flex items-center gap-2 bg-surface rounded-full px-4 py-2 shadow-sm border border-border">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.floor(store.reviews || 0) ? 'text-accent' : 'text-border'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm font-medium text-text">{store.reviews.toFixed(1)}</span>
              </div>
            )}
            {store?.address && (
              <div className="flex items-center gap-2 bg-surface rounded-full px-4 py-2 shadow-sm border border-border">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm text-text-secondary">{store.address}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="container mx-auto px-4 pt-8 pb-32">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-text">{t('store.title')}</h2>
          <span className="text-sm text-text-secondary">
            {services.length} {t('store.servicesAvailable')}
          </span>
        </div>
        {services.length > 0 ? (
          <StoreServicesClient services={services} storeId={store.id} />
        ) : (
          <div className="text-center py-12 text-text-secondary bg-surface rounded-xl border border-border">
            {t('store.noServicesAvailable')}
          </div>
        )}
      </div>
    </div>
  );
}
