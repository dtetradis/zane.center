'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { createClient } from '@/lib/supabase/client';
import { getGreekDateTime } from '@/lib/supabase/utils';
import { DateTime } from 'luxon';
import { canBookServicesAtTime } from '@/lib/reservationUtils';

interface EmployeeClosure {
  employeeEmail: string;
  date: string;
}

export default function ReservationPage({ params }: { params: { storeName: string } }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { items, removeItem, updateItemDateTime, getTotalPrice, getTotalDuration } = useCartStore();
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [workDays, setWorkDays] = useState<any[]>([]);
  const [existingReservations, setExistingReservations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [employeeClosures, setEmployeeClosures] = useState<EmployeeClosure[]>([]);
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');
  const [dateIcon, setDateIcon] = useState<string>('calendar');
  const supabase = createClient();

  useEffect(() => {
    fetchStoreData();
  }, []);

  // Helper to get icon path based on icon ID
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

  // Helper to parse blocked_dates items (handles both objects and stringified JSON)
  const parseBlockedDateItem = (item: any): any => {
    if (typeof item === 'string') {
      // Try to parse as JSON if it looks like an object
      if (item.startsWith('{')) {
        try {
          return JSON.parse(item);
        } catch {
          return item; // Return as-is if parsing fails
        }
      }
      return item; // Plain date string
    }
    return item; // Already an object
  };

  // Load employee closures from database (stored in blocked_dates as objects/stringified JSON)
  useEffect(() => {
    if (blockedDates && blockedDates.length > 0) {
      // Extract employee closures (objects with employeeEmail) from blocked_dates
      const empClosures = blockedDates
        .map(parseBlockedDateItem)
        .filter((item: any) => typeof item === 'object' && item.employeeEmail)
        .map((item: any) => ({
          employeeEmail: item.employeeEmail,
          date: item.date,
        }));
      setEmployeeClosures(empClosures);
    }
  }, [blockedDates]);

  // Calculate time slots for all services based on start time
  useEffect(() => {
    if (startDateTime && items.length > 0) {
      let currentTime = DateTime.fromISO(startDateTime);

      items.forEach((item) => {
        updateItemDateTime(item.service.id, currentTime.toISO() || '');
        currentTime = currentTime.plus({ minutes: item.service.duration });
      });
    }
  }, [startDateTime, items.length]);

  const fetchStoreData = async () => {
    // Fetch store info
    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('store_name', params.storeName)
      .single();

    if (store) {
      setBlockedDates(store.blocked_dates || []);
      setWorkDays(store.work_days || []);
      setStoreId(store.id);
      setDateIcon(store.date_icon || store.dateIcon || 'calendar');

      // Fetch existing reservations for this store
      const { data: reservations } = await supabase
        .from('reservations')
        .select('date_time, service_duration, employee, profession')
        .eq('id_store', store.id)
        .gte('date_time', DateTime.now().toISO());

      if (reservations) {
        setExistingReservations(reservations);
      }

      // Fetch employees for this store
      const { data: storeEmployees } = await supabase
        .from('users')
        .select('id, email, category, role')
        .eq('id_store', store.id)
        .in('role', ['employee', 'admin', 'owner']);

      if (storeEmployees) {
        setEmployees(storeEmployees);
      }
    }
  };

  // Calculate available time slots (slots not conflicting with existing reservations)
  const getAvailableSlots = () => {
    // For now, return empty array to show all slots
    // TODO: Implement conflict detection based on existingReservations
    return [];
  };

  const isDateBlocked = (dateString: string) => {
    const date = DateTime.fromISO(dateString).toISODate();
    // Only check store-wide closures (string entries after parsing)
    const storeBlockedDates = blockedDates
      .map(parseBlockedDateItem)
      .filter((item: any) => typeof item === 'string');
    return storeBlockedDates.includes(date || '');
  };

  const getMinDateTime = () => {
    return getGreekDateTime().plus({ hours: 1 }).toFormat("yyyy-MM-dd'T'HH:mm");
  };

  const getServiceTimeSlot = (index: number) => {
    if (!startDateTime) return t('reservation.selectTimeAbove');

    let currentTime = DateTime.fromISO(startDateTime);

    // Add duration of all previous services
    for (let i = 0; i < index; i++) {
      currentTime = currentTime.plus({ minutes: items[i].service.duration });
    }

    return currentTime.toFormat('HH:mm');
  };

  const getEndTime = () => {
    if (!startDateTime || items.length === 0) return '';

    const start = DateTime.fromISO(startDateTime);
    const end = start.plus({ minutes: getTotalDuration() });
    return end.toFormat('HH:mm');
  };

  const handleProceedToCheckout = () => {
    // Validate start time is selected
    if (!startDateTime) {
      alert(t('reservation.selectTimeAlert'));
      return;
    }

    // Check if date is blocked
    if (isDateBlocked(startDateTime)) {
      alert(t('reservation.dateBlockedAlert'));
      return;
    }

    router.push(`/${params.storeName}/checkout`);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-text mb-4">{t('reservation.emptyCart')}</h1>
        <p className="text-text-secondary mb-8">{t('reservation.addServicesToStart')}</p>
        <Button onClick={() => router.push(`/${params.storeName}`)}>
          {t('reservation.browseServices')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface to-surface-secondary/30">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-3xl font-bold text-text">{t('reservation.title')}</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Date & Time Selection */}
          <div className="lg:col-span-2">
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <CardTitle>{t('reservation.selectDateTime')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <DateTimePicker
                  value={startDateTime}
                  onChange={setStartDateTime}
                  minDate={getMinDateTime()}
                  blockedDates={blockedDates.map(parseBlockedDateItem).filter((item: any) => typeof item === 'string')}
                  availableSlots={getAvailableSlots()}
                  workDays={workDays}
                  totalDuration={getTotalDuration()}
                  services={items.map(item => ({
                    profession: item.service.profession,
                    duration: item.service.duration
                  }))}
                  employees={employees}
                  existingReservations={existingReservations}
                  employeeClosures={employeeClosures}
                  dateIcon={dateIcon}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Services & Summary */}
          <div className="lg:col-span-1 space-y-6">
            {/* Your Services */}
            <Card className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <CardTitle>{t('reservation.yourServices')}</CardTitle>
                  </div>
                  <span className="text-xs text-text-secondary bg-surface-secondary px-2 py-1 rounded-full">
                    {items.length}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-3 divide-y divide-border">
                {items.map((item, index) => (
                  <div key={item.service.id} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {startDateTime && (
                            <span className="inline-flex items-center justify-center px-2 py-1 bg-primary text-white text-xs font-bold rounded">
                              {getServiceTimeSlot(index)}
                            </span>
                          )}
                          <h3 className="font-medium text-text text-sm truncate">{item.service.serviceName}</h3>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary">
                          <span>{item.service.duration} {t('store.minutes')}</span>
                          <span>·</span>
                          <span>€{item.service.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.service.id)}
                        className="p-1.5 text-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title={t('common.remove')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Booking Summary */}
            <Card className="overflow-hidden shadow-lg">
              <div className="bg-gradient-to-r from-primary to-primary-hover p-4">
                <h3 className="text-lg font-bold text-white text-center">{t('reservation.bookingSummary')}</h3>
              </div>
              <CardContent className="pt-5 space-y-4">
                {startDateTime ? (
                  <div className="bg-surface-secondary rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(dateIcon)} />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary uppercase tracking-wide">{t('reservation.date')}</p>
                        <p className="font-semibold text-text text-sm">
                          {DateTime.fromISO(startDateTime).toFormat('EEE, dd MMM')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary uppercase tracking-wide">{t('reservation.time')}</p>
                        <p className="font-semibold text-text text-sm">
                          {DateTime.fromISO(startDateTime).toFormat('HH:mm')} - {getEndTime()}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-secondary rounded-xl p-4 text-center">
                    <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-2">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(dateIcon)} />
                      </svg>
                    </div>
                    <p className="text-xs text-text-secondary">{t('reservation.selectDateTime')}</p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{t('reservation.services')}</span>
                    <span className="text-text font-medium">{items.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">{t('reservation.duration')}</span>
                    <span className="text-text font-medium">{getTotalDuration()} {t('store.minutes')}</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-text-secondary font-medium">{t('reservation.total')}</span>
                    <span className="text-2xl font-bold text-primary">
                      €{getTotalPrice().toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-surface-secondary/50 border-t border-border">
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleProceedToCheckout}
                  disabled={!startDateTime}
                  className="shadow-lg"
                >
                  {startDateTime ? t('reservation.proceedToCheckout') : t('reservation.selectTime')}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
