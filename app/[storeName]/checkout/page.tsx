'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/useCartStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { toGreekISO } from '@/lib/supabase/utils';

export default function CheckoutPage({ params }: { params: { storeName: string } }) {
  const router = useRouter();
  const { items, storeId, getTotalPrice, clearCart } = useCartStore();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

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
      newErrors.name = 'Name is required';
      isValid = false;
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
      isValid = false;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setLoading(true);

    try {
      // Create reservations for each item
      const reservations = items.map((item) => ({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        note: formData.note,
        date_time: toGreekISO(new Date(item.dateTime!)),
        service_duration: item.service.duration,
        service_name: item.service.serviceName,
        id_store: storeId,
        employee: item.employee || null,
        profession: item.service.profession,
      }));

      const { data, error } = await supabase
        .from('reservations')
        .insert(reservations)
        .select();

      if (error) throw error;

      // Clear cart
      clearCart();

      // Redirect to confirmation page
      router.push(`/${params.storeName}/reservation/${data[0].id}`);
    } catch (error: any) {
      console.error('Error creating reservation:', error);
      alert('Failed to create reservation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    router.push(`/${params.storeName}/reservation`);
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-text mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={errors.name}
                  required
                />

                <Input
                  type="email"
                  label="Email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={errors.email}
                  required
                />

                <Input
                  type="tel"
                  label="Phone"
                  placeholder="+30 123 456 7890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  error={errors.phone}
                  required
                />

                <Textarea
                  label="Additional Notes (Optional)"
                  placeholder="Any special requests or information..."
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  rows={4}
                />

                <Button type="submit" fullWidth size="lg" isLoading={loading}>
                  Confirm Reservation
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
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
                    <p className="text-sm text-text-secondary">With: {item.employee}</p>
                  )}
                  <p className="text-sm font-bold text-primary mt-1">
                    €{item.service.price.toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-text">Total:</span>
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
