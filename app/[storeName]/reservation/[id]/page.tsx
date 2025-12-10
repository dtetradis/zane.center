'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { notFound, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DateTime } from 'luxon';

export default function ReservationConfirmationPage({
  params,
}: {
  params: { storeName: string; id: string };
}) {
  const { t } = useLanguage();
  const router = useRouter();
  const [reservation, setReservation] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);
  const [dateIcon, setDateIcon] = useState('calendar');
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchReservation();
  }, [params.id]);

  const fetchReservation = async () => {
    // Fetch the main reservation
    const { data: reservationData, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error || !reservationData) {
      router.push('/');
      return;
    }

    setReservation(reservationData);

    // Fetch all reservations with the same email, phone, and similar date_time (within a few hours)
    const reservationTime = DateTime.fromISO(reservationData.date_time);
    const timeWindowStart = reservationTime.minus({ hours: 2 }).toISO();
    const timeWindowEnd = reservationTime.plus({ hours: 2 }).toISO();

    const { data: relatedReservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('email', reservationData.email)
      .eq('phone', reservationData.phone)
      .gte('date_time', timeWindowStart!)
      .lte('date_time', timeWindowEnd!)
      .order('date_time', { ascending: true });

    const allReservations = relatedReservations && relatedReservations.length > 0
      ? relatedReservations
      : [reservationData];

    setReservations(allReservations);

    // Fetch store info for date icon
    const { data: store } = await supabase
      .from('stores')
      .select('date_icon')
      .eq('id', reservationData.id_store)
      .single();

    setDateIcon(store?.date_icon || 'calendar');
    setLoading(false);
  };

  const getIconPath = (iconId: string) => {
    const icons: { [key: string]: string } = {
      calendar: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      scissors: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z',
      sparkles: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
      heart: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
      star: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
      clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
    };
    return icons[iconId] || icons.calendar;
  };

  const getTotalDuration = () => {
    return reservations.reduce((sum, res) => sum + res.service_duration, 0);
  };

  const getStartTime = () => {
    return DateTime.fromISO(reservations[0].date_time).toFormat('HH:mm');
  };

  const getEndTime = () => {
    const lastReservation = reservations[reservations.length - 1];
    const endTime = DateTime.fromISO(lastReservation.date_time).plus({
      minutes: lastReservation.service_duration
    });
    return endTime.toFormat('HH:mm');
  };

  const getFormattedDate = () => {
    return DateTime.fromISO(reservations[0].date_time).toFormat('EEEE, dd MMMM yyyy');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-surface to-surface-secondary/30 flex items-center justify-center">
        <div className="text-text">{t('common.loading')}</div>
      </div>
    );
  }

  if (!reservation) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-surface-secondary/30">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Success Icon and Thank You Message */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-text mb-2">{t('confirmation.thankYou')}</h1>
          <p className="text-lg text-text-secondary">
            {t('confirmation.confirmed')}
          </p>
        </div>

        {/* Reservation Details Card */}
        <Card className="overflow-hidden shadow-xl mb-6">
          <div className="bg-gradient-to-r from-primary to-primary-hover p-6">
            <h2 className="text-2xl font-bold text-white text-center">{t('confirmation.reservationSummary')}</h2>
          </div>

          <CardContent className="pt-6 space-y-6">
            {/* Date and Time */}
            <div className="bg-surface-secondary rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(dateIcon)} />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">{t('confirmation.date')}</p>
                  <p className="font-semibold text-text text-lg">{getFormattedDate()}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-text-secondary uppercase tracking-wide font-medium">{t('confirmation.time')}</p>
                  <p className="font-semibold text-text text-lg">
                    {getStartTime()} - {getEndTime()} ({getTotalDuration()} {t('store.minutes')})
                  </p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                {t('confirmation.yourServices')}
              </h3>
              <div className="space-y-3">
                {reservations.map((res) => (
                  <div
                    key={res.id}
                    className="bg-surface-secondary rounded-lg p-4 flex items-start justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center justify-center px-2 py-1 bg-primary text-white text-xs font-bold rounded">
                          {DateTime.fromISO(res.date_time).toFormat('HH:mm')}
                        </span>
                        <h4 className="font-semibold text-text">{res.service_name}</h4>
                      </div>
                      <p className="text-sm text-text-secondary">
                        {res.profession} · {res.service_duration} {t('store.minutes')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Information */}
            <div>
              <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                {t('confirmation.contactInformation')}
              </h3>
              <div className="bg-surface-secondary rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-text font-medium">{reservation.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-text">{reservation.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-text">{reservation.phone}</span>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            {reservation.note && (
              <div>
                <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
                  {t('confirmation.additionalNotes')}
                </h3>
                <div className="bg-surface-secondary rounded-lg p-4">
                  <p className="text-text">{reservation.note}</p>
                </div>
              </div>
            )}

            {/* Confirmation Message */}
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <p className="text-sm text-text text-center">
                {t('confirmation.emailSent')} <strong>{reservation.email}</strong>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Back to Home Button */}
        <div className="text-center">
          <Link href={`/${params.storeName}`}>
            <Button size="lg" className="shadow-lg">
              {t('confirmation.backToHome')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
