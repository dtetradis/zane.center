'use client';

import React from 'react';
import { Input } from '@/components/ui/Input';
import { ReservationCard } from '@/components/ReservationCard';
import type { Reservation } from '@/types';

interface ReservationsTabProps {
  t: (key: string) => string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filteredReservations: Reservation[];
  setSelectedReservation: (reservation: Reservation) => void;
  setShowCancelModal: (show: boolean) => void;
}

export default function ReservationsTab({
  t,
  searchTerm,
  setSearchTerm,
  filteredReservations,
  setSelectedReservation,
  setShowCancelModal,
}: ReservationsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-text">{t('dashboard.reservationsTab.title')}</h2>
          <p className="text-text-secondary">{t('dashboard.reservationsTab.subtitle')}</p>
        </div>
      </div>

      <Input
        type="search"
        placeholder={t('dashboard.reservationsTab.searchPlaceholder')}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {filteredReservations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onCancel={(r) => {
                setSelectedReservation(r);
                setShowCancelModal(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-text-secondary">
          {t('dashboard.reservationsTab.noReservationsFound')}
        </div>
      )}
    </div>
  );
}
