'use client';

import { useState, useEffect, useRef } from 'react';
import { DateTime } from 'luxon';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Reservation } from '@/types';

interface NotificationBellProps {
  reservations: Reservation[];
  onNotificationClick: (reservation: Reservation) => void;
}

// Key for localStorage to store dismissed notification IDs
const DISMISSED_NOTIFICATIONS_KEY = 'dismissedNotifications';

export default function NotificationBell({ reservations, onNotificationClick }: NotificationBellProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load dismissed notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDismissedIds(new Set(parsed));
      } catch (e) {
        console.error('Failed to parse dismissed notifications:', e);
      }
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter to get only new/unread reservations (created in the last 24 hours and not dismissed)
  const newReservations = reservations.filter(r => {
    if (dismissedIds.has(r.id)) return false;
    const createdAt = DateTime.fromISO(r.created_at);
    const now = DateTime.now();
    const hoursDiff = now.diff(createdAt, 'hours').hours;
    return hoursDiff <= 24;
  });

  const handleDismiss = (e: React.MouseEvent, reservationId: string) => {
    e.stopPropagation();
    const newDismissedIds = new Set(dismissedIds);
    newDismissedIds.add(reservationId);
    setDismissedIds(newDismissedIds);
    localStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(Array.from(newDismissedIds)));
  };

  const handleNotificationClick = (reservation: Reservation) => {
    onNotificationClick(reservation);
    setIsOpen(false);
  };

  const notificationCount = newReservations.length;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 flex items-center justify-center rounded-lg transition-colors text-text hover:bg-primary/10 relative"
        title={t('dashboard.notifications.title')}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Notification Badge */}
        {notificationCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1">
            {notificationCount > 9 ? '9+' : notificationCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-full ml-2 top-0 w-80 bg-surface border border-border rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-text">{t('dashboard.notifications.title')}</h3>
            <p className="text-xs text-text-secondary">{t('dashboard.notifications.newReservations')}</p>
          </div>

          {/* Notifications List */}
          {newReservations.length === 0 ? (
            <div className="px-4 py-6 text-center text-text-secondary">
              {t('dashboard.notifications.noNewNotifications')}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {newReservations.map((reservation) => {
                const reservationDateTime = DateTime.fromISO(reservation.date_time).setZone('Europe/Athens');
                const createdAt = DateTime.fromISO(reservation.created_at);
                const timeAgo = createdAt.toRelative();

                return (
                  <div
                    key={reservation.id}
                    className="px-4 py-3 hover:bg-surface-secondary cursor-pointer flex items-start gap-3 group"
                    onClick={() => handleNotificationClick(reservation)}
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-text truncate">{reservation.name}</p>
                      <p className="text-sm text-text-secondary truncate">
                        {reservation.service_name || reservation.serviceName}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {reservationDateTime.toFormat('MMM d, HH:mm')}
                      </p>
                      <p className="text-xs text-primary mt-1">{timeAgo}</p>
                    </div>

                    {/* Dismiss Button */}
                    <button
                      onClick={(e) => handleDismiss(e, reservation.id)}
                      className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-surface rounded"
                      title={t('dashboard.notifications.dismiss')}
                    >
                      <svg className="w-4 h-4 text-text-secondary hover:text-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
