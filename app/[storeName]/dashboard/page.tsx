import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ReservationCard } from '@/components/ReservationCard';
import { getGreekDateTime } from '@/lib/supabase/utils';

export default async function DashboardPage({ params }: { params: { storeName: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Get user's store
  const { data: userData } = await supabase
    .from('users')
    .select('id_store')
    .eq('id', user?.id)
    .single();

  // Get today's reservations
  const today = getGreekDateTime().startOf('day').toISO();
  const tomorrow = getGreekDateTime().plus({ days: 1 }).startOf('day').toISO();

  const { data: todayReservations } = await supabase
    .from('reservations')
    .select('*')
    .eq('id_store', userData?.id_store)
    .gte('date_time', today)
    .lt('date_time', tomorrow)
    .order('date_time', { ascending: true });

  // Get total reservations count
  const { count: totalReservations } = await supabase
    .from('reservations')
    .select('*', { count: 'exact', head: true })
    .eq('id_store', userData?.id_store);

  // Get total services count
  const { count: totalServices } = await supabase
    .from('services')
    .select('*', { count: 'exact', head: true })
    .eq('id_store', userData?.id_store);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Dashboard</h1>
        <p className="text-text-secondary">Welcome to your store management panel</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">Today's Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{todayReservations?.length || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">Total Reservations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{totalReservations || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-text-secondary">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary">{totalServices || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Reservations */}
      <div>
        <h2 className="text-2xl font-bold text-text mb-4">Today's Reservations</h2>
        {todayReservations && todayReservations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayReservations.map((reservation) => (
              <ReservationCard
                key={reservation.id}
                reservation={reservation}
                showActions={false}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-text-secondary">
              No reservations for today
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
