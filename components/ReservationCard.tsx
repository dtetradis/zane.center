'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import type { Reservation } from '@/types';
import { formatGreekDate } from '@/lib/supabase/utils';

interface ReservationCardProps {
  reservation: Reservation;
  onEdit?: (reservation: Reservation) => void;
  onCancel?: (reservation: Reservation) => void;
  showActions?: boolean;
}

export function ReservationCard({
  reservation,
  onEdit,
  onCancel,
  showActions = true,
}: ReservationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{reservation.serviceName}</CardTitle>
        <CardDescription>
          {formatGreekDate(reservation.date_time)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Client:</span>
            <span className="font-medium text-text">{reservation.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Email:</span>
            <span className="text-text">{reservation.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Phone:</span>
            <span className="text-text">{reservation.phone}</span>
          </div>
          {reservation.employee && (
            <div className="flex justify-between">
              <span className="text-text-secondary">Employee:</span>
              <span className="text-text">{reservation.employee}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-text-secondary">Duration:</span>
            <span className="text-text">{reservation.serviceDuration} min</span>
          </div>
          {reservation.note && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-text-secondary text-xs mb-1">Note:</p>
              <p className="text-text">{reservation.note}</p>
            </div>
          )}
        </div>
      </CardContent>
      {showActions && (onEdit || onCancel) && (
        <div className="px-6 pb-6 flex gap-2">
          {onEdit && (
            <Button variant="outline" size="sm" onClick={() => onEdit(reservation)}>
              Edit
            </Button>
          )}
          {onCancel && (
            <Button variant="danger" size="sm" onClick={() => onCancel(reservation)}>
              Cancel
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
