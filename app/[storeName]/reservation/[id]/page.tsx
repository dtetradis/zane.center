import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { formatGreekDate } from '@/lib/supabase/utils';

export default async function ReservationConfirmationPage({
  params,
}: {
  params: { storeName: string; id: string };
}) {
  const supabase = await createClient();

  const { data: reservation, error } = await supabase
    .from('reservations')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !reservation) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto text-center">
        {/* Success Icon */}
        <div className="mb-8 flex justify-center">
          <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-6">
            <svg
              className="w-16 h-16 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-4xl font-bold text-text mb-4">Reservation Confirmed!</h1>
        <p className="text-xl text-text-secondary mb-8">
          Your appointment has been successfully booked
        </p>

        <Card className="text-left mb-8">
          <CardHeader>
            <CardTitle>Reservation Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-text-secondary">Service:</span>
              <span className="font-medium text-text">{reservation.service_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Date & Time:</span>
              <span className="font-medium text-text">
                {formatGreekDate(reservation.date_time)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Duration:</span>
              <span className="text-text">{reservation.service_duration} minutes</span>
            </div>
            {reservation.employee && (
              <div className="flex justify-between">
                <span className="text-text-secondary">Employee:</span>
                <span className="text-text">{reservation.employee}</span>
              </div>
            )}
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex justify-between">
                <span className="text-text-secondary">Name:</span>
                <span className="text-text">{reservation.name}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-text-secondary">Email:</span>
                <span className="text-text">{reservation.email}</span>
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-text-secondary">Phone:</span>
                <span className="text-text">{reservation.phone}</span>
              </div>
            </div>
            {reservation.note && (
              <div className="border-t border-border pt-3 mt-3">
                <p className="text-text-secondary text-sm mb-1">Notes:</p>
                <p className="text-text">{reservation.note}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            A confirmation email has been sent to <strong>{reservation.email}</strong>
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href={`/${params.storeName}`}>
            <Button variant="outline" size="lg">
              Back to Store
            </Button>
          </Link>
          <Link href={`/${params.storeName}`}>
            <Button size="lg">Book Another Appointment</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
