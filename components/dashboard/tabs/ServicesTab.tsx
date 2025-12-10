'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { ServiceCard } from '@/components/ServiceCard';
import type { Service } from '@/types';

interface ServicesTabProps {
  t: (key: string) => string;
  services: Service[];
  resetServiceForm: () => void;
  setShowServiceModal: (show: boolean) => void;
  openEditServiceModal: (service: Service) => void;
  handleDeleteService: (serviceId: string) => void;
}

export default function ServicesTab({
  t,
  services,
  resetServiceForm,
  setShowServiceModal,
  openEditServiceModal,
  handleDeleteService,
}: ServicesTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">{t('dashboard.servicesTab.title')}</h2>
          <p className="text-text-secondary">{t('dashboard.servicesTab.subtitle')}</p>
        </div>
        <Button
          onClick={() => {
            resetServiceForm();
            setShowServiceModal(true);
          }}
        >
          {t('dashboard.servicesTab.addService')}
        </Button>
      </div>

      {services.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <div key={service.id} className="relative group">
              <ServiceCard service={service} hideAddButton />
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEditServiceModal(service)}>
                  {t('dashboard.servicesTab.edit')}
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDeleteService(service.id)}>
                  {t('dashboard.servicesTab.delete')}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-text-secondary">
          {t('dashboard.servicesTab.noServicesYet')}
        </div>
      )}
    </div>
  );
}
