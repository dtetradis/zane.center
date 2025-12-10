'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { toGreekISO } from '@/lib/supabase/utils';
import { getAvailableEmployee } from '@/lib/reservationUtils';
import { DateTime } from 'luxon';

export default function CheckoutPage({ params }: { params: { storeName: string } }) {
  const router = useRouter();
  const { t } = useLanguage();
  const { items, storeId, getTotalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [employees, setEmployees] = useState<any[]>([]);
  const [existingReservations, setExistingReservations] = useState<any[]>([]);
  const supabase = createClient();

  // Handle client-side mounting and fetch data
  useEffect(() => {
    setMounted(true);
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    if (!storeId) return;

    // Fetch employees for this store
    const { data: storeEmployees } = await supabase
      .from('users')
      .select('id, email, category, role')
      .eq('id_store', storeId)
      .in('role', ['employee', 'admin', 'owner']);

    if (storeEmployees) {
      setEmployees(storeEmployees);
    }

    // Fetch existing reservations for conflict checking
    const { data: reservations } = await supabase
      .from('reservations')
      .select('date_time, service_duration, employee, profession')
      .eq('id_store', storeId)
      .gte('date_time', DateTime.now().toISO());

    if (reservations) {
      setExistingReservations(reservations);
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    note: '',
  });

  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const validate = () => {
    const newErrors = { name: '', email: '', phone: '' };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = t('checkout.nameRequired');
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = t('checkout.emailRequired');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('checkout.emailInvalid');
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t('checkout.phoneRequired');
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);
    setSubmittingCheckout(true);

    try {
      // Create reservations for each item with assigned employees
      const reservations: any[] = [];
      const tempReservations = [...existingReservations];

      for (const item of items) {
        const startTime = DateTime.fromISO(item.dateTime!);

        // Find an available employee for this service
        const assignedEmployee = getAvailableEmployee(
          item.service.profession,
          startTime,
          item.service.duration,
          employees,
          tempReservations // Include existing + previously assigned in this batch
        );

        const reservation = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          note: formData.note,
          date_time: toGreekISO(new Date(item.dateTime!)),
          service_duration: item.service.duration,
          service_name: (item.service as any).service_name || item.service.serviceName,
          id_store: storeId,
          employee: assignedEmployee || item.employee || null,
          profession: item.service.profession,
        };

        reservations.push(reservation);
        // Add to temp list so next service knows this employee is busy
        tempReservations.push(reservation);
      }

      const { data, error } = await supabase
        .from('reservations')
        .insert(reservations)
        .select();

      if (error) {
        throw error;
      }

      // Clear cart
      clearCart();

      // Redirect to confirmation page
      router.push(`/${params.storeName}/reservation/${data[0].id}`);
    } catch (error: any) {
      alert(t('checkout.errorAlert'));
      setSubmittingCheckout(false);
    } finally {
      setLoading(false);
    }
  };

  // Handle redirect when cart is empty (but not during checkout submission)
  useEffect(() => {
    if (mounted && items.length === 0 && !submittingCheckout) {
      router.push(`/${params.storeName}/reservation`);
    }
  }, [mounted, items.length, submittingCheckout, router, params.storeName]);

  // Don't render until mounted to avoid SSR issues
  if (!mounted) {
    return null;
  }

  if (items.length === 0) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-3xl font-bold text-text">{t('checkout.title')}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('checkout.yourInformation')}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label={t('checkout.fullName')}
                  placeholder={t('checkout.namePlaceholder')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  required
                />

                <Input
                  type="email"
                  label={t('checkout.email')}
                  placeholder={t('checkout.emailPlaceholder')}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  required
                />

                <Input
                  type="tel"
                  label={t('checkout.phone')}
                  placeholder={t('checkout.phonePlaceholder')}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  error={errors.phone}
                  required
                />

                <Textarea
                  label={t('checkout.additionalNotes')}
                  placeholder={t('checkout.notesPlaceholder')}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={4}
                />

                <Button type="submit" fullWidth size="lg" isLoading={loading}>
                  {t('checkout.confirmReservation')}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>{t('checkout.orderSummary')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item) => (
                <div key={item.service.id} className="pb-4 border-b border-border">
                  <p className="font-medium text-text">{item.service.serviceName}</p>
                  <p className="text-sm text-text-secondary mt-1">
                    {new Date(item.dateTime!).toLocaleString('el-GR', {
                      timeZone: 'Europe/Athens',
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                  {item.employee && (
                    <p className="text-sm text-text-secondary">{t('checkout.with')}: {item.employee}</p>
                  )}
                  <p className="text-sm font-bold text-primary mt-1">
                    €{item.service.price.toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-text">{t('checkout.total')}:</span>
                  <span className="text-primary">€{getTotalPrice().toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
