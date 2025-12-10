'use client';

import React, { useState } from 'react';
import { Button } from './ui/Button';
import type { Service } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';

interface ServiceCardProps {
  service: Service;
  onAddToCart?: (service: Service) => void;
  isInCart?: boolean;
  hideAddButton?: boolean;
  disabled?: boolean;
  showCategory?: boolean;
  isLast?: boolean;
}

export function ServiceCard({ service, onAddToCart, isInCart = false, hideAddButton = false, disabled = false, showCategory = true, isLast = false }: ServiceCardProps) {
  const { t } = useLanguage();
  const [showDescription, setShowDescription] = useState(false);
  // Handle both snake_case (from DB) and camelCase field names
  const serviceName = (service as any).service_name || service.serviceName || '';

  return (
    <div className={`group relative bg-surface transition-all duration-300 ${
      !isLast ? 'border-b border-border' : ''
    } ${
      isInCart ? 'bg-primary/5' : 'hover:bg-surface-secondary/50'
    }`}>
      <div className="relative py-3 px-4">
        <div className="flex items-start justify-between gap-4">
          {/* Service Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-text mb-1 leading-tight">{serviceName}</h3>
                {showCategory && (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                      {service.category}
                    </span>
                    <span className="text-xs text-text-secondary">· {service.profession}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Price and Duration Row */}
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-text">{service.duration}</span> {t('store.minutes')}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-primary">€{service.price.toFixed(2)}</span>
              </div>
            </div>

            {/* Description Toggle */}
            {service.description && (
              <div className="mt-2">
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  <svg
                    className={`w-3 h-3 transition-transform duration-200 ${showDescription ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {showDescription ? 'Απόκρυψη περιγραφής' : 'Εμφάνιση περιγραφής'}
                </button>

                {/* Collapsible Description */}
                <div className={`overflow-hidden transition-all duration-300 ${
                  showDescription ? 'max-h-96 opacity-100 mt-2' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-sm text-text-secondary">
                    {service.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Add/Remove Button */}
          {!hideAddButton && onAddToCart && (
            <div className="flex-shrink-0 self-center">
              <Button
                onClick={() => onAddToCart(service)}
                variant={isInCart ? 'secondary' : 'primary'}
                size="sm"
                disabled={disabled && !isInCart}
                className="transition-all duration-200"
                title={
                  disabled && !isInCart
                    ? t('store.maxServicesReached')
                    : isInCart
                    ? t('store.removeFromCart')
                    : t('store.addToCart')
                }
              >
                {isInCart ? (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="font-medium">Αφαίρεση</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span className="font-medium">Προσθήκη</span>
                  </div>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
