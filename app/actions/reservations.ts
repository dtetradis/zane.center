'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function deleteReservation(reservationId: string) {
  try {
    const { error } = await supabase
      .from('reservations')
      .delete()
      .eq('id', reservationId);

    if (error) {
      console.error('Error deleting reservation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateReservation(reservationId: string, updates: {
  name: string;
  email: string;
  phone: string;
  note: string;
  date_time: string;
  service_duration: number;
  service_name: string;
  profession: string;
}) {
  try {
    const { error } = await supabase
      .from('reservations')
      .update(updates)
      .eq('id', reservationId);

    if (error) {
      console.error('Error updating reservation:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
