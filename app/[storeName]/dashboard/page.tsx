'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ReservationCard } from '@/components/ReservationCard';
import { ServiceCard } from '@/components/ServiceCard';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useThemeStore } from '@/store/useThemeStore';
import { getGreekDateTime, toGreekISO } from '@/lib/supabase/utils';
import { DateTime } from 'luxon';
import type { Service, Store, Reservation } from '@/types';
import { deleteReservation, updateReservation } from '@/app/actions/reservations';
import { updateStoreBlockedDates, updateStoreSettings } from '@/app/actions/stores';
import { createService, updateService, deleteService } from '@/app/actions/services';

type Tab = 'overview' | 'reservations' | 'services' | 'closures' | 'settings';

interface EmployeeClosure {
  id: string;
  employeeEmail: string;
  date: string;
  reason?: string;
}

// Generate a consistent color based on a string (name)
const stringToColor = (str: string): { bg: string; hover: string } => {
  // Predefined color palette with good contrast for white text
  const colors = [
    { bg: '#3B82F6', hover: '#2563EB' }, // Blue
    { bg: '#10B981', hover: '#059669' }, // Emerald
    { bg: '#8B5CF6', hover: '#7C3AED' }, // Violet
    { bg: '#F59E0B', hover: '#D97706' }, // Amber
    { bg: '#EF4444', hover: '#DC2626' }, // Red
    { bg: '#EC4899', hover: '#DB2777' }, // Pink
    { bg: '#06B6D4', hover: '#0891B2' }, // Cyan
    { bg: '#84CC16', hover: '#65A30D' }, // Lime
    { bg: '#F97316', hover: '#EA580C' }, // Orange
    { bg: '#6366F1', hover: '#4F46E5' }, // Indigo
    { bg: '#14B8A6', hover: '#0D9488' }, // Teal
    { bg: '#A855F7', hover: '#9333EA' }, // Purple
  ];

  // Create a hash from the string
  let hash = 0;
  const normalizedStr = str.toLowerCase().trim();
  for (let i = 0; i < normalizedStr.length; i++) {
    hash = normalizedStr.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Use the hash to pick a color from the palette
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function DashboardPage({ params }: { params: { storeName: string } }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [selectedDate, setSelectedDate] = useState(DateTime.now().setZone('Europe/Athens'));
  const [dayReservations, setDayReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [totalReservations, setTotalReservations] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // New reservation modal
  const [showNewReservationModal, setShowNewReservationModal] = useState(false);
  const [newReservationSlot, setNewReservationSlot] = useState<{
    employee: string;
    time: DateTime;
  } | null>(null);
  const [newReservationForm, setNewReservationForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    note: '',
  });

  // Edit reservation modal
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [editReservationForm, setEditReservationForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    note: '',
    dateTime: '',
  });

  // Services state
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [serviceFormData, setServiceFormData] = useState({
    serviceName: '',
    profession: '',
    category: '',
    duration: 30,
    price: 0,
    description: '',
  });
  const [isAddingNewProfession, setIsAddingNewProfession] = useState(false);
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  // Closures state
  const [employeeClosures, setEmployeeClosures] = useState<EmployeeClosure[]>([]);
  const [closureSelectedEmployee, setClosureSelectedEmployee] = useState('all');
  const [closureMonth, setClosureMonth] = useState(DateTime.now());

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
    if (store?.id) {
      const blockedDates = store.blocked_dates || store.blockedDates || [];
      // Extract employee closures (objects with employeeEmail) from blocked_dates
      const empClosures = blockedDates
        .map(parseBlockedDateItem)
        .filter((item: any) => typeof item === 'object' && item.employeeEmail)
        .map((item: any) => ({
          id: `${item.employeeEmail}-${item.date}`,
          employeeEmail: item.employeeEmail,
          date: item.date,
          reason: item.reason,
        }));
      setEmployeeClosures(empClosures);
    }
  }, [store?.id, store?.blocked_dates, store?.blockedDates]);

  // Helper function to check if an employee is closed on a date
  const isEmployeeClosedOnDate = (employeeEmail: string, date: DateTime): boolean => {
    const dateStr = date.toFormat('yyyy-MM-dd');
    const blockedDates = store?.blocked_dates || store?.blockedDates || [];

    // Check store-wide closure (string entries that are plain dates)
    const parsedDates = blockedDates.map(parseBlockedDateItem);
    const storeClosures = parsedDates.filter((item: any) => typeof item === 'string');
    if (storeClosures.includes(dateStr)) {
      return true;
    }

    // Check employee-specific closure
    return employeeClosures.some(
      c => c.employeeEmail === employeeEmail && c.date === dateStr
    );
  };

  // Helper to get only store-wide blocked dates (strings)
  const getStoreBlockedDates = (): string[] => {
    const blockedDates = store?.blocked_dates || store?.blockedDates || [];
    const parsedDates = blockedDates.map(parseBlockedDateItem);
    return parsedDates.filter((item: any) => typeof item === 'string');
  };

  // Settings state
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [blockedDate, setBlockedDate] = useState('');
  const [saving, setSaving] = useState(false);
  const { colors, setColors } = useThemeStore();
  const [colorForm, setColorForm] = useState({
    primary: colors.primary,
    primaryHover: colors.primaryHover,
    primaryLight: colors.primaryLight,
    secondary: colors.secondary,
    accent: colors.accent,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchAllData();

    // Handle hash navigation
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && ['overview', 'reservations', 'services', 'closures', 'settings'].includes(hash)) {
        setActiveTab(hash as Tab);
      }
    };

    // Set initial tab from hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (store) {
      fetchDayReservations(selectedDate, store.id);
    }
  }, [selectedDate, store]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = allReservations.filter(
        (r) =>
          r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.phone.includes(searchTerm)
      );
      setFilteredReservations(filtered);
    } else {
      setFilteredReservations(allReservations);
    }
  }, [searchTerm, allReservations]);

  const fetchAllData = async () => {
    try {
      // Get store by name
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('store_name', params.storeName)
        .single();

      if (storeData) {
        setStore(storeData);
        setWhitelist(storeData.whitelist || []);
        const themeColors = storeData.theme_colors || storeData.themeColors;
        if (themeColors) {
          setColorForm(themeColors);
          setColors(themeColors);
        }


        // Get all reservations
        const { data: allData } = await supabase
          .from('reservations')
          .select('*')
          .eq('id_store', storeData.id)
          .order('date_time', { ascending: true });

        setAllReservations(allData || []);
        setFilteredReservations(allData || []);

        // Get total reservations count
        const { count } = await supabase
          .from('reservations')
          .select('*', { count: 'exact', head: true })
          .eq('id_store', storeData.id);

        setTotalReservations(count || 0);

        // Get services
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('id_store', storeData.id)
          .order('index', { ascending: true });

        setServices(servicesData || []);

        // Get employees
        const { data: employeesData } = await supabase
          .from('users')
          .select('id, email, category, role')
          .eq('id_store', storeData.id)
          .in('role', ['employee', 'admin', 'owner']);

        setEmployees(employeesData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDayReservations = async (date?: DateTime, storeId?: string) => {
    const targetDate = date || selectedDate;
    const targetStoreId = storeId || store?.id;

    if (!targetStoreId) return;

    try {
      // Convert Athens time to UTC for database query
      const dayStart = targetDate.startOf('day').toUTC().toISO();
      const dayEnd = targetDate.plus({ days: 1 }).startOf('day').toUTC().toISO();

      const { data } = await supabase
        .from('reservations')
        .select('*')
        .eq('id_store', targetStoreId)
        .gte('date_time', dayStart)
        .lt('date_time', dayEnd)
        .order('date_time', { ascending: true });

      setDayReservations(data || []);
    } catch (error) {
      console.error('Error fetching day reservations:', error);
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

      // Use functional updates to avoid stale state
      setAllReservations(prev => prev.filter((r) => r.id !== selectedReservation.id));
      setFilteredReservations(prev => prev.filter((r) => r.id !== selectedReservation.id));
      setDayReservations(prev => prev.filter((r) => r.id !== selectedReservation.id));
      setShowCancelModal(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error canceling reservation:', error);
    }
  };

  const [deleteConfirmReservation, setDeleteConfirmReservation] = useState<Reservation | null>(null);

  const handleDeleteReservation = async () => {
    if (!deleteConfirmReservation || !store) return;

    try {
      const result = await deleteReservation(deleteConfirmReservation.id);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete reservation');
      }

      // Use functional updates to immediately update UI
      setDayReservations(prev => prev.filter(r => r.id !== deleteConfirmReservation.id));
      setAllReservations(prev => prev.filter(r => r.id !== deleteConfirmReservation.id));
      setFilteredReservations(prev => prev.filter(r => r.id !== deleteConfirmReservation.id));

      setDeleteConfirmReservation(null);
    } catch (error) {
      console.error('Error deleting reservation:', error);
      alert('Failed to delete reservation');
    }
  };

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReservationSlot || !store) return;

    try {
      const selectedService = services.find(s => s.id === newReservationForm.service);
      if (!selectedService) return;

      const reservation = {
        name: newReservationForm.name,
        email: newReservationForm.email,
        phone: newReservationForm.phone,
        note: newReservationForm.note,
        date_time: toGreekISO(newReservationSlot.time.toJSDate()),
        service_duration: selectedService.duration,
        service_name: (selectedService as any).service_name || selectedService.serviceName,
        id_store: store.id,
        employee: newReservationSlot.employee,
        profession: selectedService.profession,
      };

      const { data: newReservation, error } = await supabase
        .from('reservations')
        .insert(reservation)
        .select()
        .single();

      if (error) throw error;

      // Add the new reservation to state
      if (newReservation) {
        setDayReservations(prev => [...prev, newReservation]);
        setAllReservations(prev => [...prev, newReservation]);
        setFilteredReservations(prev => [...prev, newReservation]);
      }

      setShowNewReservationModal(false);
      setNewReservationSlot(null);
      setNewReservationForm({
        name: '',
        email: '',
        phone: '',
        service: '',
        note: '',
      });
    } catch (error) {
      console.error('Error creating reservation:', error);
      alert('Failed to create reservation');
    }
  };

  const openEditReservation = (reservation: Reservation) => {
    setEditingReservation(reservation);

    // Find the service ID from services list
    const service = services.find(s =>
      (s.service_name || s.serviceName) === (reservation.service_name || reservation.serviceName)
    );

    setEditReservationForm({
      name: reservation.name,
      email: reservation.email,
      phone: reservation.phone,
      service: service?.id || '',
      note: reservation.note || '',
      dateTime: DateTime.fromISO(reservation.date_time).setZone('Europe/Athens').toFormat("yyyy-MM-dd'T'HH:mm"),
    });
  };

  const handleUpdateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReservation || !store) return;

    try {
      const selectedService = services.find(s => s.id === editReservationForm.service);
      if (!selectedService) return;

      const dateTimeISO = toGreekISO(new Date(editReservationForm.dateTime));
      if (!dateTimeISO) {
        throw new Error('Invalid date time');
      }

      const updates = {
        name: editReservationForm.name,
        email: editReservationForm.email,
        phone: editReservationForm.phone,
        note: editReservationForm.note,
        date_time: dateTimeISO,
        service_duration: selectedService.duration,
        service_name: (selectedService as any).service_name || selectedService.serviceName,
        profession: selectedService.profession,
      };

      const result = await updateReservation(editingReservation.id, updates);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update reservation');
      }

      // Update reservation in state
      const updatedReservation = { ...editingReservation, ...updates };
      setDayReservations(prev => prev.map(r => r.id === editingReservation.id ? updatedReservation : r));
      setAllReservations(prev => prev.map(r => r.id === editingReservation.id ? updatedReservation : r));
      setFilteredReservations(prev => prev.map(r => r.id === editingReservation.id ? updatedReservation : r));

      setEditingReservation(null);
      setEditReservationForm({
        name: '',
        email: '',
        phone: '',
        service: '',
        note: '',
        dateTime: '',
      });
    } catch (error) {
      console.error('Error updating reservation:', error);
      alert('Failed to update reservation');
    }
  };

  // Services handlers
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!store?.id) {
      alert('Store not found');
      return;
    }

    try {
      // Transform camelCase form data to snake_case for database
      const dbData = {
        service_name: serviceFormData.serviceName,
        profession: serviceFormData.profession,
        category: serviceFormData.category,
        duration: serviceFormData.duration,
        price: serviceFormData.price,
        description: serviceFormData.description,
      };

      let result;
      if (editingService) {
        result = await updateService(editingService.id, dbData);
      } else {
        result = await createService(store.id, dbData, services.length);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to save service');
      }

      await fetchAllData();
      setShowServiceModal(false);
      resetServiceForm();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service. Please try again.');
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const result = await deleteService(serviceId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete service');
      }

      await fetchAllData();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service. Please try again.');
    }
  };

  const resetServiceForm = () => {
    setServiceFormData({
      serviceName: '',
      profession: '',
      category: '',
      duration: 30,
      price: 0,
      description: '',
    });
    setEditingService(null);
    setIsAddingNewProfession(false);
    setIsAddingNewCategory(false);
  };

  // Get unique professions and categories from existing services
  const existingProfessions = Array.from(new Set(services.map(s => s.profession).filter(Boolean)));
  const existingCategories = Array.from(new Set(services.map(s => s.category).filter(Boolean)));

  const openEditServiceModal = (service: Service) => {
    setEditingService(service);
    // Handle both snake_case (from DB) and camelCase field names
    const serviceName = (service as any).service_name || service.serviceName || '';
    setServiceFormData({
      serviceName,
      profession: service.profession,
      category: service.category,
      duration: service.duration,
      price: service.price,
      description: service.description || '',
    });
    // Check if profession/category are in the existing lists
    const professionExists = existingProfessions.includes(service.profession);
    const categoryExists = existingCategories.includes(service.category);
    setIsAddingNewProfession(!professionExists);
    setIsAddingNewCategory(!categoryExists);
    setShowServiceModal(true);
  };

  // Settings handlers
  const handleAddEmail = () => {
    if (newEmail && !whitelist.includes(newEmail)) {
      setWhitelist([...whitelist, newEmail]);
      setNewEmail('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setWhitelist(whitelist.filter((e) => e !== email));
  };

  const handleBlockDate = () => {
    if (blockedDate && store) {
      const currentBlockedDates = store.blocked_dates || store.blockedDates || [];
      const parsedDates = currentBlockedDates.map(parseBlockedDateItem);
      // Preserve employee closures (objects)
      const empClosures = parsedDates.filter((item: any) => typeof item === 'object' && item.employeeEmail);
      const storeClosures = parsedDates.filter((item: any) => typeof item === 'string');
      // For text[] column, stringify objects
      const newBlockedDates = [...storeClosures, blockedDate, ...empClosures.map((c: any) => JSON.stringify(c))];
      setStore({ ...store, blockedDates: newBlockedDates, blocked_dates: newBlockedDates });
      setBlockedDate('');
    }
  };

  const handleUnblockDate = (date: string) => {
    if (store) {
      const currentBlockedDates = store.blocked_dates || store.blockedDates || [];
      const parsedDates = currentBlockedDates.map(parseBlockedDateItem);
      // Preserve employee closures (objects)
      const empClosures = parsedDates.filter((item: any) => typeof item === 'object' && item.employeeEmail);
      const storeClosures = parsedDates.filter((item: any) => typeof item === 'string');
      const newStoreClosures = storeClosures.filter((d: string) => d !== date);
      // For text[] column, stringify objects
      const newBlockedDates = [...newStoreClosures, ...empClosures.map((c: any) => JSON.stringify(c))];
      setStore({ ...store, blockedDates: newBlockedDates, blocked_dates: newBlockedDates });
    }
  };

  const handleSaveSettings = async () => {
    if (!store) return;

    setSaving(true);
    try {
      // Get the full blocked_dates array (including employee closures)
      const blockedDates = store.blocked_dates || store.blockedDates || [];

      const result = await updateStoreSettings(store.id, {
        whitelist,
        blocked_dates: blockedDates,
        theme_colors: colorForm,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setColors(colorForm);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading fullScreen />;
  if (!store) return <div>Store not found</div>;

  // Generate time slots for the day (supports two time ranges per day)
  const generateTimeSlots = () => {
    const dayName = selectedDate.toFormat('EEEE');
    const workDays = store.work_days || store.workDays || [];
    const workDay = workDays.find(wd => wd.day === dayName);

    if (!workDay || !workDay.enabled) return { slots: [], isOpen: false };

    const slots: DateTime[] = [];

    // First time range
    const [startHour, startMin] = workDay.startTime.split(':').map(Number);
    const [endHour, endMin] = workDay.endTime.split(':').map(Number);

    let current = selectedDate.set({ hour: startHour, minute: startMin });
    const end = selectedDate.set({ hour: endHour, minute: endMin });

    while (current < end) {
      slots.push(current);
      current = current.plus({ minutes: 15 });
    }

    // Second time range (if exists - e.g., after lunch break)
    if (workDay.startTime2 && workDay.endTime2) {
      const [startHour2, startMin2] = workDay.startTime2.split(':').map(Number);
      const [endHour2, endMin2] = workDay.endTime2.split(':').map(Number);

      let current2 = selectedDate.set({ hour: startHour2, minute: startMin2 });
      const end2 = selectedDate.set({ hour: endHour2, minute: endMin2 });

      while (current2 < end2) {
        slots.push(current2);
        current2 = current2.plus({ minutes: 15 });
      }
    }

    return { slots, isOpen: true };
  };

  const { slots: timeSlots, isOpen } = generateTimeSlots();


  // Get all reservations that overlap at a specific time slot for an employee
  const getReservationsAtSlot = (employeeEmail: string, slotTime: DateTime): Reservation[] => {
    return dayReservations.filter(r => {
      if (r.employee !== employeeEmail) return false;
      const resStart = DateTime.fromISO(r.date_time).setZone('Europe/Athens');
      const resEnd = resStart.plus({ minutes: r.service_duration || r.serviceDuration || 0 });
      return slotTime >= resStart && slotTime < resEnd;
    });
  };

  // Check if a time slot has a reservation for an employee (backwards compatibility)
  const getReservationAtSlot = (employeeEmail: string, slotTime: DateTime) => {
    const reservations = getReservationsAtSlot(employeeEmail, slotTime);
    return reservations.length > 0 ? reservations[0] : undefined;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text">{store.title || store.store_name}</h1>
      </div>


      {/* Schedule Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Date Navigation */}
          <div className="bg-surface rounded-xl border border-border p-4 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedDate(selectedDate.minus({ days: 1 }))}
                  className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text"
                  title="Previous day"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="text-center min-w-[200px]">
                  <p className="text-2xl font-bold text-text">{selectedDate.toFormat('d MMMM')}</p>
                  <p className="text-sm text-text-secondary">{selectedDate.toFormat('EEEE, yyyy')}</p>
                </div>
                <button
                  onClick={() => setSelectedDate(selectedDate.plus({ days: 1 }))}
                  className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary hover:text-text"
                  title="Next day"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  type="date"
                  value={selectedDate.toFormat('yyyy-MM-dd')}
                  onChange={(e) => setSelectedDate(DateTime.fromISO(e.target.value).setZone('Europe/Athens'))}
                  className="w-auto text-sm"
                />
                <Button
                  variant={selectedDate.hasSame(DateTime.now(), 'day') ? 'secondary' : 'primary'}
                  size="sm"
                  onClick={() => setSelectedDate(DateTime.now().setZone('Europe/Athens'))}
                >
                  Today
                </Button>
              </div>
            </div>
          </div>

          {/* Schedule Grid */}
          {!isOpen ? (
            <div className="bg-surface rounded-xl border border-border p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary flex items-center justify-center">
                <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">Store Closed</h3>
              <p className="text-text-secondary">The store is closed on {selectedDate.toFormat('EEEE')}s.</p>
            </div>
          ) : employees.length === 0 ? (
            <div className="bg-surface rounded-xl border border-border p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-secondary flex items-center justify-center">
                <svg className="w-8 h-8 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-text mb-2">No Employees</h3>
              <p className="text-text-secondary">Add employees to start managing the schedule.</p>
            </div>
          ) : (
            <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <div style={{ minWidth: `${70 + employees.length * 400}px` }}>
                  <div className="grid gap-0" style={{ gridTemplateColumns: `70px repeat(${employees.length}, 400px)` }}>
                    {/* Header Row */}
                    <div className="bg-gradient-to-b from-surface-secondary to-surface border-b-2 border-border p-3 font-semibold text-xs text-text-secondary uppercase tracking-wider sticky top-0 z-20">
                      Time
                    </div>
                    {employees.map((employee) => {
                      const employeeClosed = isEmployeeClosedOnDate(employee.email, selectedDate);
                      return (
                        <div
                          key={employee.id}
                          className={`bg-gradient-to-b ${employeeClosed ? 'from-red-500/20 to-red-500/10' : 'from-surface-secondary to-surface'} border-b-2 border-l border-border last:border-r-0 p-3 sticky top-0 z-20`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`w-8 h-8 rounded-full ${employeeClosed ? 'bg-red-500/20 text-red-500' : 'bg-primary/10 text-primary'} flex items-center justify-center font-semibold text-sm`}>
                              {employee.email.split('@')[0].charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-sm text-text truncate">
                                {employee.email.split('@')[0]}
                              </p>
                              <p className="text-xs text-text-secondary truncate">{employee.category}</p>
                            </div>
                            {employeeClosed && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                                OFF
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Time Slots */}
                    {timeSlots.length > 0 ? (
                    timeSlots.map((slot, slotIndex) => {
                      const isHour = slot.minute === 0;
                      const isHalfHour = slot.minute === 30;
                      return (
                        <React.Fragment key={`row-${slot.toISO()}`}>
                          {/* Time Label */}
                          <div
                            className={`border-l border-border px-2 py-1 text-xs flex items-center justify-center ${
                              isHour
                                ? 'font-bold text-text border-t-2 border-t-border bg-surface-secondary/50'
                                : isHalfHour
                                  ? 'text-text-secondary border-t border-t-border/50'
                                  : 'text-text-secondary/50 border-t border-t-border/20'
                            }`}
                          >
                            {isHour ? slot.toFormat('HH:mm') : isHalfHour ? slot.toFormat('HH:mm') : ''}
                          </div>

                          {/* Employee Slots */}
                          {employees.map((employee) => {
                            const reservations = getReservationsAtSlot(employee.email, slot);
                            const hasReservations = reservations.length > 0;
                            const isClosed = isEmployeeClosedOnDate(employee.email, selectedDate);

                            // Constants for calculations
                            const slotHeight = 48; // pixels per 15-minute slot
                            const slotDuration = 15; // minutes

                            return (
                              <div
                                key={`slot-${employee.id}-${slot.toISO()}`}
                                className={`border-l border-border ${
                                  isHour
                                    ? 'border-t-2 border-t-border'
                                    : isHalfHour
                                      ? 'border-t border-t-border/50'
                                      : 'border-t border-t-border/20'
                                } ${isClosed ? 'bg-red-500/10' : hasReservations ? '' : 'hover:bg-primary/5'} relative group`}
                                style={{ height: '48px' }}
                              >
                                {hasReservations ? (
                                  <>
                                    {reservations.map((reservation, index) => {
                                      // Check if this slot is the start of this reservation
                                      const resStart = DateTime.fromISO(reservation.date_time).setZone('Europe/Athens');
                                      const isStartOfReservation = slot.hour === resStart.hour && slot.minute === resStart.minute;

                                      if (!isStartOfReservation) return null;

                                      // Calculate height and width
                                      const numSlots = Math.ceil((reservation.service_duration || reservation.serviceDuration || 0) / slotDuration);
                                      const reservationHeight = numSlots * slotHeight;
                                      const widthPercent = 100 / reservations.length;
                                      const leftPercent = (index / reservations.length) * 100;

                                      const nameColor = stringToColor(reservation.name);

                                      return (
                                        <div
                                          key={`res-${reservation.id}`}
                                          onClick={() => openEditReservation(reservation)}
                                          className="text-white rounded-lg p-2 text-xs absolute z-10 shadow-lg flex flex-col cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] overflow-hidden"
                                          style={{
                                            top: '3px',
                                            height: `${reservationHeight - 6}px`,
                                            width: `calc(${widthPercent}% - 4px)`,
                                            left: `calc(${leftPercent}% + 2px)`,
                                            backgroundColor: nameColor.bg,
                                          }}
                                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = nameColor.hover}
                                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = nameColor.bg}
                                        >
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setDeleteConfirmReservation(reservation);
                                            }}
                                            className="absolute top-1.5 right-1.5 w-5 h-5 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/30 transition-colors z-20"
                                            title="Delete reservation"
                                          >
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                          </button>
                                          <p className="font-semibold truncate pr-6 leading-tight">{reservation.name}</p>
                                          <p className="text-white/80 truncate text-[10px] mt-1 leading-tight">
                                            {reservation.service_name || reservation.serviceName}
                                          </p>
                                          <p className="text-white/60 text-[10px] mt-auto leading-tight">
                                            {reservation.service_duration || reservation.serviceDuration} min
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </>
                                ) : isClosed ? (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-red-400 text-xs font-medium">Closed</span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setNewReservationSlot({ employee: employee.email, time: slot });
                                      setShowNewReservationModal(true);
                                    }}
                                    className="w-full h-full flex items-center justify-center text-transparent group-hover:text-primary/50 hover:!text-primary transition-all duration-200"
                                    title="Add reservation"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </React.Fragment>
                      );
                    })
                    ) : (
                      <div className="col-span-full p-12 text-center">
                        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-secondary flex items-center justify-center">
                          <svg className="w-6 h-6 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                        <p className="text-text-secondary">No time slots configured.</p>
                        <p className="text-sm text-text-secondary/70 mt-1">Set up work hours in Settings.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reservations Tab */}
      {activeTab === 'reservations' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text">All Reservations</h2>
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
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-text">Services</h2>
              <p className="text-text-secondary">Manage your service offerings</p>
            </div>
            <Button
              onClick={() => {
                resetServiceForm();
                setShowServiceModal(true);
              }}
            >
              Add Service
            </Button>
          </div>

          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div key={service.id} className="relative group">
                  <ServiceCard service={service} hideAddButton />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEditServiceModal(service)}>
                      Edit
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteService(service.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-text-secondary">
              No services yet. Add your first service!
            </div>
          )}
        </div>
      )}

      {/* Closures Tab */}
      {activeTab === 'closures' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-text">Closures</h2>
            <p className="text-text-secondary">Click on dates to toggle them open/closed</p>
          </div>

          {/* Employee Selector */}
          <Card>
            <CardContent className="py-4">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setClosureSelectedEmployee('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    closureSelectedEmployee === 'all'
                      ? 'bg-primary text-white'
                      : 'bg-surface-secondary text-text hover:bg-primary/10'
                  }`}
                >
                  Entire Store
                </button>
                {employees.map((emp) => (
                  <button
                    key={emp.id}
                    onClick={() => setClosureSelectedEmployee(emp.email)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      closureSelectedEmployee === emp.email
                        ? 'bg-primary text-white'
                        : 'bg-surface-secondary text-text hover:bg-primary/10'
                    }`}
                  >
                    {emp.email.split('@')[0]}
                  </button>
                ))}
              </div>
              <p className="text-sm text-text-secondary mt-2">
                {closureSelectedEmployee === 'all'
                  ? 'Managing closures for the entire store'
                  : `Managing days off for ${closureSelectedEmployee.split('@')[0]}`}
              </p>
            </CardContent>
          </Card>

          {/* Calendar View */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClosureMonth(closureMonth.minus({ months: 1 }))}
                >
                  Previous
                </Button>
                <CardTitle>{closureMonth.toFormat('MMMM yyyy')}</CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setClosureMonth(closureMonth.plus({ months: 1 }))}
                >
                  Next
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Week day headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-text-secondary py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {(() => {
                  const startOfMonth = closureMonth.startOf('month');
                  const endOfMonth = closureMonth.endOf('month');
                  const startDay = startOfMonth.weekday % 7;
                  const days: (DateTime | null)[] = [];

                  // Empty cells before month starts
                  for (let i = 0; i < startDay; i++) {
                    days.push(null);
                  }

                  // Days of the month
                  for (let i = 1; i <= endOfMonth.day; i++) {
                    days.push(startOfMonth.set({ day: i }));
                  }

                  return days.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="aspect-square" />;
                    }

                    const dateStr = day.toFormat('yyyy-MM-dd');
                    const isPast = day < DateTime.now().startOf('day');
                    const isToday = day.hasSame(DateTime.now(), 'day');

                    // Check if this date is closed
                    const allBlockedDates = store?.blocked_dates || store?.blockedDates || [];
                    // Store closures are string entries only (parse first for stringified JSON)
                    const parsedBlockedDates = allBlockedDates.map(parseBlockedDateItem);
                    const storeBlockedDates = parsedBlockedDates.filter((item: any) => typeof item === 'string');
                    const isStoreClosed = storeBlockedDates.includes(dateStr);
                    const isEmployeeClosed = employeeClosures.some(
                      c => c.employeeEmail === closureSelectedEmployee && c.date === dateStr
                    );

                    const isClosed = closureSelectedEmployee === 'all'
                      ? isStoreClosed
                      : isEmployeeClosed || isStoreClosed;

                    // Check work days
                    const dayName = day.toFormat('EEEE');
                    const workDays = store?.work_days || store?.workDays || [];
                    const workDay = workDays.find((wd: any) => wd.day === dayName);
                    const isWorkDay = workDay?.enabled !== false;

                    const handleClick = async () => {
                      if (isPast || !store) return;

                      const currentBlockedDates = store.blocked_dates || store.blockedDates || [];
                      const parsedDates = currentBlockedDates.map(parseBlockedDateItem);
                      // Separate store closures (strings) from employee closures (objects)
                      const storeClosures = parsedDates.filter((item: any) => typeof item === 'string');
                      const empClosures = parsedDates.filter((item: any) => typeof item === 'object' && item.employeeEmail);

                      console.log('handleClick - closureSelectedEmployee:', closureSelectedEmployee);
                      console.log('handleClick - dateStr:', dateStr);
                      console.log('handleClick - currentBlockedDates:', currentBlockedDates);

                      if (closureSelectedEmployee === 'all') {
                        // Toggle store closure
                        let newStoreClosures: string[];

                        if (isStoreClosed) {
                          newStoreClosures = storeClosures.filter((d: string) => d !== dateStr);
                        } else {
                          newStoreClosures = [...storeClosures, dateStr];
                        }

                        // Combine store closures with employee closures (stringify objects for text[] column)
                        const newBlockedDates = [...newStoreClosures, ...empClosures.map((c: any) => JSON.stringify(c))];

                        console.log('Saving store closure - newBlockedDates:', newBlockedDates);

                        const result = await updateStoreBlockedDates(store.id, newBlockedDates);

                        console.log('Store closure save result:', result);

                        if (result.success) {
                          setStore({ ...store, blockedDates: newBlockedDates, blocked_dates: newBlockedDates });
                        } else {
                          console.error('Failed to save store closure:', result.error);
                          alert('Failed to save closure: ' + result.error);
                        }
                      } else {
                        // Toggle employee closure - save to database
                        let newEmpClosures: any[];

                        if (isEmployeeClosed) {
                          // Remove this employee closure
                          newEmpClosures = empClosures.filter((c: any) =>
                            !(c.employeeEmail === closureSelectedEmployee && c.date === dateStr)
                          );
                        } else {
                          // Add new employee closure
                          newEmpClosures = [...empClosures, {
                            employeeEmail: closureSelectedEmployee,
                            date: dateStr,
                          }];
                        }

                        // Combine store closures with employee closures (stringify objects for text[] column)
                        const newBlockedDates = [...storeClosures, ...newEmpClosures.map((c: any) => JSON.stringify(c))];

                        console.log('Saving employee closure - newBlockedDates:', newBlockedDates);

                        const result = await updateStoreBlockedDates(store.id, newBlockedDates);

                        console.log('Employee closure save result:', result);

                        if (result.success) {
                          setStore({ ...store, blockedDates: newBlockedDates, blocked_dates: newBlockedDates });
                          // Also update local state for immediate UI update
                          const updatedEmpClosures = newEmpClosures.map((item: any) => ({
                            id: `${item.employeeEmail}-${item.date}`,
                            employeeEmail: item.employeeEmail,
                            date: item.date,
                            reason: item.reason,
                          }));
                          setEmployeeClosures(updatedEmpClosures);
                        } else {
                          console.error('Failed to save employee closure:', result.error);
                          alert('Failed to save closure: ' + result.error);
                        }
                      }
                    };

                    return (
                      <button
                        key={dateStr}
                        onClick={handleClick}
                        disabled={isPast}
                        className={`
                          aspect-square rounded-lg flex flex-col items-center justify-center text-sm font-medium transition-all relative
                          ${isPast
                            ? 'bg-surface-secondary/50 text-text-secondary/30 cursor-not-allowed'
                            : isClosed
                              ? 'bg-red-500 text-white hover:bg-red-600 cursor-pointer'
                              : !isWorkDay
                                ? 'bg-gray-400 text-white cursor-pointer'
                                : 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                          }
                          ${isToday ? 'ring-2 ring-primary ring-offset-2' : ''}
                        `}
                      >
                        <span className="text-lg">{day.day}</span>
                        <span className="text-[10px] opacity-80">
                          {isPast ? '' : isClosed ? 'Closed' : !isWorkDay ? 'Off' : 'Open'}
                        </span>
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-4 mt-6 pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-sm text-text-secondary">Open</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span className="text-sm text-text-secondary">Closed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-400"></div>
                  <span className="text-sm text-text-secondary">Regular Day Off</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-surface-secondary/50"></div>
                  <span className="text-sm text-text-secondary">Past</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Closures List */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Closures</CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const allBlockedDates = store?.blocked_dates || store?.blockedDates || [];
                const parsedBlockedDates = allBlockedDates.map(parseBlockedDateItem);
                // Only get string dates (store-wide closures)
                const storeBlockedDates = parsedBlockedDates
                  .filter((item: any) => typeof item === 'string')
                  .filter((d: string) => d >= DateTime.now().toFormat('yyyy-MM-dd'))
                  .sort();
                const upcomingEmployeeClosures = employeeClosures
                  .filter(c => c.date >= DateTime.now().toFormat('yyyy-MM-dd'))
                  .sort((a, b) => a.date.localeCompare(b.date));

                if (storeBlockedDates.length === 0 && upcomingEmployeeClosures.length === 0) {
                  return <p className="text-text-secondary text-center py-4">No upcoming closures</p>;
                }

                return (
                  <div className="space-y-2">
                    {storeBlockedDates.map((date: string) => (
                      <div key={`store-${date}`} className="flex items-center justify-between bg-red-500/10 p-3 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center text-white font-bold">
                            {DateTime.fromISO(date).day}
                          </div>
                          <div>
                            <p className="font-medium text-text">
                              {DateTime.fromISO(date).toFormat('EEEE, MMMM d, yyyy')}
                            </p>
                            <p className="text-sm text-red-500 font-medium">Store Closed</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {upcomingEmployeeClosures.map((closure) => {
                      const employee = employees.find(e => e.email === closure.employeeEmail);
                      return (
                        <div key={closure.id} className="flex items-center justify-between bg-amber-500/10 p-3 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold">
                              {DateTime.fromISO(closure.date).day}
                            </div>
                            <div>
                              <p className="font-medium text-text">
                                {DateTime.fromISO(closure.date).toFormat('EEEE, MMMM d, yyyy')}
                              </p>
                              <p className="text-sm text-amber-600 font-medium">
                                {employee?.email.split('@')[0] || closure.employeeEmail} - Day Off
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6 max-w-4xl">
          <div>
            <h2 className="text-2xl font-bold text-text">Settings</h2>
            <p className="text-text-secondary">Manage your store configuration</p>
          </div>

          {/* Whitelist */}
          <Card>
            <CardHeader>
              <CardTitle>Email Whitelist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Only whitelisted emails can create accounts for your store
              </p>

              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="email@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                />
                <Button onClick={handleAddEmail}>Add</Button>
              </div>

              <div className="space-y-2">
                {whitelist.map((email) => (
                  <div key={email} className="flex items-center justify-between bg-surface p-2 rounded">
                    <span className="text-text">{email}</span>
                    <Button size="sm" variant="danger" onClick={() => handleRemoveEmail(email)}>
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Blocked Dates */}
          <Card>
            <CardHeader>
              <CardTitle>Blocked Dates</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Block specific dates when your store is closed
              </p>

              <div className="flex gap-2">
                <Input
                  type="date"
                  value={blockedDate}
                  onChange={(e) => setBlockedDate(e.target.value)}
                />
                <Button onClick={handleBlockDate}>Block Date</Button>
              </div>

              <div className="space-y-2">
                {(store.blocked_dates || store.blockedDates || [])
                  .map(parseBlockedDateItem)
                  .filter((item: any) => typeof item === 'string')
                  .map((date: string) => (
                  <div key={date} className="flex items-center justify-between bg-surface p-2 rounded">
                    <span className="text-text">{date}</span>
                    <Button size="sm" variant="danger" onClick={() => handleUnblockDate(date)}>
                      Unblock
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Theme Colors */}
          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-text-secondary">
                Customize your store's color scheme
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text mb-1">Primary Color</label>
                  <input
                    type="color"
                    value={colorForm.primary}
                    onChange={(e) => setColorForm({ ...colorForm, primary: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">Primary Hover</label>
                  <input
                    type="color"
                    value={colorForm.primaryHover}
                    onChange={(e) => setColorForm({ ...colorForm, primaryHover: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">Primary Light</label>
                  <input
                    type="color"
                    value={colorForm.primaryLight}
                    onChange={(e) => setColorForm({ ...colorForm, primaryLight: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">Secondary Color</label>
                  <input
                    type="color"
                    value={colorForm.secondary}
                    onChange={(e) => setColorForm({ ...colorForm, secondary: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text mb-1">Accent Color</label>
                  <input
                    type="color"
                    value={colorForm.accent}
                    onChange={(e) => setColorForm({ ...colorForm, accent: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSaveSettings} isLoading={saving} size="lg">
            Save Settings
          </Button>
        </div>
      )}

      {/* Cancel Reservation Modal */}
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmReservation}
        onClose={() => setDeleteConfirmReservation(null)}
        title="Delete Reservation"
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmReservation(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteReservation}>
              Delete
            </Button>
          </div>
        }
      >
        <div className="text-text">
          <p className="mb-2">
            Are you sure you want to delete this reservation?
          </p>
          {deleteConfirmReservation && (
            <div className="bg-surface-secondary p-3 rounded-md mt-3">
              <p className="font-semibold">{deleteConfirmReservation.name}</p>
              <p className="text-sm text-text-secondary mt-1">
                {deleteConfirmReservation.service_name || deleteConfirmReservation.serviceName}
              </p>
              <p className="text-sm text-text-secondary">
                {DateTime.fromISO(deleteConfirmReservation.date_time).setZone('Europe/Athens').toFormat('MMM d, yyyy - HH:mm')}
              </p>
            </div>
          )}
          <p className="text-sm text-text-secondary mt-3">
            This action cannot be undone.
          </p>
        </div>
      </Modal>

      {/* Service Modal */}
      <Modal
        isOpen={showServiceModal}
        onClose={() => {
          setShowServiceModal(false);
          resetServiceForm();
        }}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        size="lg"
      >
        <form onSubmit={handleServiceSubmit} className="space-y-4">
          <Input
            label="Service Name"
            value={serviceFormData.serviceName}
            onChange={(e) => setServiceFormData({ ...serviceFormData, serviceName: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Profession dropdown or input */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">Profession</label>
              {isAddingNewProfession ? (
                <div className="flex gap-2">
                  <Input
                    value={serviceFormData.profession}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, profession: e.target.value })}
                    placeholder="Enter new profession"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingNewProfession(false);
                      setServiceFormData({ ...serviceFormData, profession: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <select
                  value={serviceFormData.profession}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingNewProfession(true);
                      setServiceFormData({ ...serviceFormData, profession: '' });
                    } else {
                      setServiceFormData({ ...serviceFormData, profession: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select profession</option>
                  {existingProfessions.map((prof) => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))}
                  <option value="__add_new__">+ Add new profession</option>
                </select>
              )}
            </div>

            {/* Category dropdown or input */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">Category</label>
              {isAddingNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={serviceFormData.category}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, category: e.target.value })}
                    placeholder="Enter new category"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsAddingNewCategory(false);
                      setServiceFormData({ ...serviceFormData, category: '' });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <select
                  value={serviceFormData.category}
                  onChange={(e) => {
                    if (e.target.value === '__add_new__') {
                      setIsAddingNewCategory(true);
                      setServiceFormData({ ...serviceFormData, category: '' });
                    } else {
                      setServiceFormData({ ...serviceFormData, category: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">Select category</option>
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__add_new__">+ Add new category</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (minutes)"
              type="number"
              value={serviceFormData.duration}
              onChange={(e) => setServiceFormData({ ...serviceFormData, duration: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Price (€)"
              type="number"
              step="0.01"
              value={serviceFormData.price}
              onChange={(e) => setServiceFormData({ ...serviceFormData, price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <Input
            label="Description"
            value={serviceFormData.description}
            onChange={(e) => setServiceFormData({ ...serviceFormData, description: e.target.value })}
          />

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowServiceModal(false);
                resetServiceForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingService ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Reservation Modal */}
      <Modal
        isOpen={showNewReservationModal}
        onClose={() => {
          setShowNewReservationModal(false);
          setNewReservationSlot(null);
          setNewReservationForm({
            name: '',
            email: '',
            phone: '',
            service: '',
            note: '',
          });
        }}
        title="New Reservation"
        size="lg"
      >
        {newReservationSlot && (
          <form onSubmit={handleCreateReservation} className="space-y-4">
            <div className="bg-surface-secondary p-3 rounded-lg">
              <p className="text-sm text-text-secondary">Time:</p>
              <p className="font-semibold text-text">
                {newReservationSlot.time.toFormat('EEEE, MMMM d, yyyy · HH:mm')}
              </p>
              <p className="text-sm text-text-secondary mt-1">Employee:</p>
              <p className="font-semibold text-text">
                {newReservationSlot.employee.split('@')[0]}
              </p>
            </div>

            <Input
              label="Client Name"
              placeholder="John Doe"
              value={newReservationForm.name}
              onChange={(e) => setNewReservationForm({ ...newReservationForm, name: e.target.value })}
              required
            />

            <Input
              type="email"
              label="Email"
              placeholder="john@example.com"
              value={newReservationForm.email}
              onChange={(e) => setNewReservationForm({ ...newReservationForm, email: e.target.value })}
              required
            />

            <Input
              type="tel"
              label="Phone"
              placeholder="+30 123 456 7890"
              value={newReservationForm.phone}
              onChange={(e) => setNewReservationForm({ ...newReservationForm, phone: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text mb-1">Service</label>
              <select
                value={newReservationForm.service}
                onChange={(e) => setNewReservationForm({ ...newReservationForm, service: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select a service</option>
                {(() => {
                  const employee = employees.find(e => e.email === newReservationSlot?.employee);
                  const filteredServices = employee
                    ? services.filter(s => s.profession === employee.category)
                    : services;

                  return filteredServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {(service as any).service_name || service.serviceName} - {service.duration} min - €{service.price}
                    </option>
                  ));
                })()}
              </select>
            </div>

            <Textarea
              label="Notes (Optional)"
              placeholder="Any special requests..."
              value={newReservationForm.note}
              onChange={(e) => setNewReservationForm({ ...newReservationForm, note: e.target.value })}
              rows={3}
            />

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowNewReservationModal(false);
                  setNewReservationSlot(null);
                  setNewReservationForm({
                    name: '',
                    email: '',
                    phone: '',
                    service: '',
                    note: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Create Reservation
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Edit Reservation Modal */}
      <Modal
        isOpen={!!editingReservation}
        onClose={() => {
          setEditingReservation(null);
          setEditReservationForm({
            name: '',
            email: '',
            phone: '',
            service: '',
            note: '',
            dateTime: '',
          });
        }}
        title="Edit Reservation"
        size="lg"
      >
        {editingReservation && (
          <form onSubmit={handleUpdateReservation} className="space-y-4">
            <Input
              label="Client Name"
              placeholder="John Doe"
              value={editReservationForm.name}
              onChange={(e) => setEditReservationForm({ ...editReservationForm, name: e.target.value })}
              required
            />

            <Input
              type="email"
              label="Email"
              placeholder="john@example.com"
              value={editReservationForm.email}
              onChange={(e) => setEditReservationForm({ ...editReservationForm, email: e.target.value })}
              required
            />

            <Input
              type="tel"
              label="Phone"
              placeholder="+30 123 456 7890"
              value={editReservationForm.phone}
              onChange={(e) => setEditReservationForm({ ...editReservationForm, phone: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text mb-1">Service</label>
              <select
                value={editReservationForm.service}
                onChange={(e) => setEditReservationForm({ ...editReservationForm, service: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Select a service</option>
                {(() => {
                  const employee = employees.find(e => e.email === editingReservation?.employee);
                  const filteredServices = employee
                    ? services.filter(s => s.profession === employee.category)
                    : services;

                  return filteredServices.map((service) => (
                    <option key={service.id} value={service.id}>
                      {(service as any).service_name || service.serviceName} - {service.duration} min - €{service.price}
                    </option>
                  ));
                })()}
              </select>
            </div>

            <Input
              type="datetime-local"
              label="Date & Time"
              value={editReservationForm.dateTime}
              onChange={(e) => setEditReservationForm({ ...editReservationForm, dateTime: e.target.value })}
              required
            />

            <Textarea
              label="Notes (Optional)"
              placeholder="Any special requests..."
              value={editReservationForm.note}
              onChange={(e) => setEditReservationForm({ ...editReservationForm, note: e.target.value })}
              rows={3}
            />

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditingReservation(null);
                  setEditReservationForm({
                    name: '',
                    email: '',
                    phone: '',
                    service: '',
                    note: '',
                    dateTime: '',
                  });
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                Update Reservation
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
