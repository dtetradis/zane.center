'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { getGreekDateTime } from '@/lib/supabase/utils';
import { DateTime } from 'luxon';

export default function ReservationPage({ params }: { params: { storeName: string } }) {
  const router = useRouter();
  const { items, removeItem, updateItemDateTime, updateItemEmployee, getTotalPrice, getTotalDuration } = useCartStore();
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const supabase = createClient();

  useEffect(() => {
    fetchBlockedDates();
  }, []);

  const fetchBlockedDates = async () => {
    const { data: store } = await supabase
      .from('stores')
      .select('blocked_dates')
      .eq('store_name', params.storeName)
      .single();

    if (store) {
      setBlockedDates(store.blocked_dates || []);
    }
  };

  const isDateBlocked = (dateString: string) => {
    const date = DateTime.fromISO(dateString).toISODate();
    return blockedDates.includes(date || '');
  };

  const getMinDateTime = () => {
    return getGreekDateTime().plus({ hours: 1 }).toFormat("yyyy-MM-dd'T'HH:mm");
  };

  const handleProceedToCheckout = () => {
    // Validate all items have date/time
    const allItemsHaveDateTime = items.every((item) => item.dateTime);

    if (!allItemsHaveDateTime) {
      alert('Please select date and time for all services');
      return;
    }

    // Check if any dates are blocked
    const hasBlockedDates = items.some((item) => item.dateTime && isDateBlocked(item.dateTime));

    if (hasBlockedDates) {
      alert('One or more selected dates are blocked. Please choose different dates.');
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
          {items.map((item) => (
            <Card key={item.service.id}>
              <CardHeader>
                <CardTitle>{item.service.serviceName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Duration:</span>
                  <span className="text-text">{item.service.duration} min</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-text-secondary">Price:</span>
                  <span className="text-text font-bold">€{item.service.price.toFixed(2)}</span>
                </div>

                <div className="space-y-2">
                  <Input
                    type="datetime-local"
                    label="Select Date & Time"
                    value={item.dateTime || ''}
                    min={getMinDateTime()}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      if (isDateBlocked(selectedDate)) {
                        alert('This date is blocked. Please choose another date.');
                        return;
                      }
                      updateItemDateTime(item.service.id, selectedDate);
                    }}
                    required
                  />

                  <Input
                    type="text"
                    label="Preferred Employee (Optional)"
                    placeholder="Any employee"
                    value={item.employee || ''}
                    onChange={(e) => updateItemEmployee(item.service.id, e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  variant="danger"
                  size="sm"
                  fullWidth
                  onClick={() => removeItem(item.service.id)}
                >
                  Remove
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <span className="text-lg font-bold text-text">Total:</span>
                  <span className="text-lg font-bold text-primary">
                    €{getTotalPrice().toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button fullWidth size="lg" onClick={handleProceedToCheckout}>
                Proceed to Checkout
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
