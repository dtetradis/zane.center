'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DateTimePicker } from '@/components/ui/DateTimePicker';
import { createClient } from '@/lib/supabase/client';
import { getGreekDateTime } from '@/lib/supabase/utils';
import { DateTime } from 'luxon';
import { canBookServicesAtTime } from '@/lib/reservationUtils';

export default function ReservationPage({ params }: { params: { storeName: string } }) {
  const router = useRouter();
  const { items, removeItem, updateItemDateTime, getTotalPrice, getTotalDuration } = useCartStore();
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [workDays, setWorkDays] = useState<any[]>([]);
  const [existingReservations, setExistingReservations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [startDateTime, setStartDateTime] = useState<string>('');
  const [storeId, setStoreId] = useState<string>('');
  const supabase = createClient();

  useEffect(() => {
    fetchStoreData();
  }, []);

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
    return blockedDates.includes(date || '');
  };

  const getMinDateTime = () => {
    return getGreekDateTime().plus({ hours: 1 }).toFormat("yyyy-MM-dd'T'HH:mm");
  };

  const getServiceTimeSlot = (index: number) => {
    if (!startDateTime) return 'Select appointment time above';

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
      alert('Please select appointment start time');
      return;
    }

    // Check if date is blocked
    if (isDateBlocked(startDateTime)) {
      alert('This date is blocked. Please choose another date.');
      return;
    }

    router.push(`/${params.storeName}/checkout`);
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold text-text mb-4">Your Cart is Empty</h1>
        <p className="text-text-secondary mb-8">Add some services to get started!</p>
        <Button onClick={() => router.push(`/${params.storeName}`)}>
          Browse Services
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text mb-8">Book Your Appointment</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Appointment Start Time */}
          <Card>
            <CardHeader>
              <CardTitle>Select Appointment Start Time</CardTitle>
              <p className="text-sm text-text-secondary mt-1">
                Choose a date and time for your appointment. Times shown in 15-minute intervals.
              </p>
            </CardHeader>
            <CardContent>
              <DateTimePicker
                value={startDateTime}
                onChange={setStartDateTime}
                minDate={getMinDateTime()}
                blockedDates={blockedDates}
                availableSlots={getAvailableSlots()}
                workDays={workDays}
                totalDuration={getTotalDuration()}
                services={items.map(item => ({
                  profession: item.service.profession,
                  duration: item.service.duration
                }))}
                employees={employees}
                existingReservations={existingReservations}
              />
              {startDateTime && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Total Duration:</span>
                    <span className="text-text font-bold">{getTotalDuration()} minutes</span>
                  </div>
                  {getEndTime() && (
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-text-secondary">Estimated End Time:</span>
                      <span className="text-text font-bold">{getEndTime()}</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Service Timeline */}
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-text">Services Timeline</h2>
            {items.map((item, index) => (
              <Card key={item.service.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{item.service.serviceName}</CardTitle>
                      <p className="text-sm text-text-secondary mt-1">
                        {item.service.profession}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-primary">
                        {getServiceTimeSlot(index)}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {item.service.duration} min
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-text">
                      €{item.service.price.toFixed(2)}
                    </span>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => removeItem(item.service.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Appointment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {startDateTime && (
                <>
                  <div className="bg-surface-secondary rounded-lg p-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Start Time:</span>
                      <span className="text-text font-bold">
                        {DateTime.fromISO(startDateTime).toFormat('HH:mm')}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">End Time:</span>
                      <span className="text-text font-bold">{getEndTime()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-text-secondary">Date:</span>
                      <span className="text-text font-bold">
                        {DateTime.fromISO(startDateTime).toFormat('dd MMM yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-2"></div>
                </>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Services:</span>
                <span className="text-text font-medium">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Total Duration:</span>
                <span className="text-text font-medium">{getTotalDuration()} min</span>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-lg font-bold text-text">Total Price:</span>
                  <span className="text-lg font-bold text-primary">
                    €{getTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                fullWidth
                size="lg"
                onClick={handleProceedToCheckout}
                disabled={!startDateTime}
              >
                Proceed to Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
