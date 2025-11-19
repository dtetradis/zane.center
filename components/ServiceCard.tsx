'use client';

import React from 'react';
import { Button } from './ui/Button';
import type { Service } from '@/types';

interface ServiceCardProps {
  service: Service;
  onAddToCart: (service: Service) => void;
  isInCart?: boolean;
}

export function ServiceCard({ service, onAddToCart, isInCart = false }: ServiceCardProps) {
  return (
    <div className="bg-surface rounded-lg border border-border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Service Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-text mb-1">{service.serviceName}</h3>
          <p className="text-sm text-text-secondary mb-2">
            {service.profession} · {service.category}
          </p>
          {service.description && (
            <p className="text-sm text-text-secondary mb-3">{service.description}</p>
          )}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-text-secondary">
              <span className="font-medium text-text">{service.duration}</span> min
            </span>
            <span className="text-primary font-bold text-lg">
              €{service.price.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Add Button */}
        <div className="flex-shrink-0">
          <Button
            onClick={() => onAddToCart(service)}
            variant={isInCart ? 'secondary' : 'primary'}
            size="sm"
          >
            {isInCart ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
