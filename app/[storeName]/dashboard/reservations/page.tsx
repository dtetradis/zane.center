'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ReservationCard } from '@/components/ReservationCard';
import { Loading } from '@/components/ui/Loading';
import { Input } from '@/components/ui/Input';
import type { Reservation } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export default function ReservationsPage({ params }: { params: { storeName: string } }) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchReservations();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = reservations.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.phone.includes(searchTerm)
      );
      setFilteredReservations(filtered);
    } else {
      setFilteredReservations(reservations);
    }
  }, [searchTerm, reservations]);

  const fetchReservations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: userData } = await supabase
        .from('users')
        .select('id_store')
        .eq('id', user?.id)
        .single();

      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .eq('id_store', userData?.id_store)
        .order('date_time', { ascending: true });

      if (error) throw error;

      setReservations(data || []);
      setFilteredReservations(data || []);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async () => {
    if (!selectedReservation) return;

    try {
      const { error } = await supabase
        .from('reservations')
        .delete()
        .eq('id', selectedReservation.id);

      if (error) throw error;

      setReservations(reservations.filter((r) => r.id !== selectedReservation.id));
      setShowCancelModal(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error canceling reservation:', error);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Reservations</h1>
          <p className="text-text-secondary">Manage all your bookings</p>
        </div>
      </div>

      <Input
        type="search"
        placeholder="Search by name, email, or phone..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {filteredReservations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReservations.map((reservation) => (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              onCancel={(r) => {
                setSelectedReservation(r);
                setShowCancelModal(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-text-secondary">
          No reservations found
        </div>
      )}

      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Reservation"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Keep Reservation
            </Button>
            <Button variant="danger" onClick={handleCancelReservation}>
              Cancel Reservation
            </Button>
          </div>
        }
      >
        <p className="text-text">
          Are you sure you want to cancel the reservation for{' '}
          <strong>{selectedReservation?.name}</strong>?
        </p>
      </Modal>
    </div>
  );
}
