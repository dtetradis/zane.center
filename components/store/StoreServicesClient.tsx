'use client';

import { useState, useEffect } from 'react';
import { ServiceCard } from '@/components/ServiceCard';
import { useCartStore } from '@/store/useCartStore';
import type { Service } from '@/types';

export default function StoreServicesClient({
  services,
  storeId,
}: {
  services: Service[];
  storeId: string;
}) {
  const { items, addItem, setStore } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    // Get store name from current URL
    const path = window.location.pathname;
    const storeName = path.split('/')[1];
    setStore(storeId, storeName);
  }, [storeId]);

  const categories = Array.from(new Set(services.map((s) => s.category)));
  const filteredServices = selectedCategory
    ? services.filter((s) => s.category === selectedCategory)
    : services;

  const handleAddToCart = (service: Service) => {
    addItem(service);
  };

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      {categories.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-primary text-white'
                : 'bg-surface text-text border border-border hover:bg-primary/10'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-white'
                  : 'bg-surface text-text border border-border hover:bg-primary/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Services List */}
      <div className="space-y-3">
        {filteredServices.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onAddToCart={handleAddToCart}
            isInCart={items.some((item) => item.service.id === service.id)}
          />
        ))}
      </div>
    </div>
  );
}
