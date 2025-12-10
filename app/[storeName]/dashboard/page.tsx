'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
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
import { updateStoreBlockedDates, updateStoreSettings, updateStorePhotos, uploadStorePhoto, deleteStorePhoto } from '@/app/actions/stores';
import { createService, updateService, deleteService } from '@/app/actions/services';
import OverviewTab from '@/components/dashboard/tabs/OverviewTab';
import ReservationsTab from '@/components/dashboard/tabs/ReservationsTab';
import ServicesTab from '@/components/dashboard/tabs/ServicesTab';
import ClosuresTab from '@/components/dashboard/tabs/ClosuresTab';
import SettingsTab from '@/components/dashboard/tabs/SettingsTab';
import NotificationBell from '@/components/dashboard/NotificationBell';

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
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [selectedDate, setSelectedDate] = useState(DateTime.now().setZone('Europe/Athens'));
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

  // Notification detail modal
  const [notificationDetailReservation, setNotificationDetailReservation] = useState<Reservation | null>(null);

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

  // Carousel photos state
  const [carouselPhotos, setCarouselPhotos] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [draggedPhotoIndex, setDraggedPhotoIndex] = useState<number | null>(null);
  const { colors, setColors } = useThemeStore();
  const [colorForm, setColorForm] = useState({
    primary: colors.primary,
    primaryHover: colors.primaryHover,
    primaryLight: colors.primaryLight,
    secondary: colors.secondary,
    accent: colors.accent,
  });

  // Date icon state
  const [selectedDateIcon, setSelectedDateIcon] = useState<string>('calendar');

  const supabase = createClient();

  // Polling interval in milliseconds (30 seconds)
  const POLLING_INTERVAL = 30000;

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

  // Polling for new reservations
  useEffect(() => {
    if (!store?.id) return;

    const pollReservations = async () => {
      try {
        const { data: reservationsData } = await supabase
          .from('reservations')
          .select('*')
          .eq('id_store', store.id)
          .order('date_time', { ascending: true });

        if (reservationsData) {
          setAllReservations(reservationsData);
          // Update filtered reservations based on current search term
          if (searchTerm) {
            const filtered = reservationsData.filter(
              (r) =>
                r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.phone.includes(searchTerm)
            );
            setFilteredReservations(filtered);
          } else {
            setFilteredReservations(reservationsData);
          }
          setTotalReservations(reservationsData.length);
        }
      } catch (error) {
        console.error('Error polling reservations:', error);
      }
    };

    // Set up polling interval
    const intervalId = setInterval(pollReservations, POLLING_INTERVAL);

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [store?.id, searchTerm]);

  // Derive dayReservations from allReservations based on selected date
  // This eliminates race conditions and ensures consistency
  const dayReservations = useMemo(() => {
    const dayStart = selectedDate.startOf('day');
    const dayEnd = selectedDate.plus({ days: 1 }).startOf('day');

    return allReservations.filter(r => {
      const resDateTime = DateTime.fromISO(r.date_time).setZone('Europe/Athens');
      return resDateTime >= dayStart && resDateTime < dayEnd;
    });
  }, [allReservations, selectedDate]);

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
        setCarouselPhotos(storeData.photos || []);
        const themeColors = storeData.theme_colors || storeData.themeColors;
        if (themeColors) {
          setColorForm(themeColors);
          setColors(themeColors);
        }
        setSelectedDateIcon(storeData.date_icon || storeData.dateIcon || 'calendar');

        // Fetch all data in parallel for better performance
        const [allReservationsResult, countResult, servicesResult, employeesResult] = await Promise.all([
          // Get all reservations
          supabase
            .from('reservations')
            .select('*')
            .eq('id_store', storeData.id)
            .order('date_time', { ascending: true }),

          // Get total reservations count
          supabase
            .from('reservations')
            .select('*', { count: 'exact', head: true })
            .eq('id_store', storeData.id),

          // Get services
          supabase
            .from('services')
            .select('*')
            .eq('id_store', storeData.id)
            .order('index', { ascending: true }),

          // Get employees
          supabase
            .from('users')
            .select('id, email, category, role')
            .eq('id_store', storeData.id)
            .in('role', ['employee', 'admin', 'owner']),
        ]);

        setAllReservations(allReservationsResult.data || []);
        setFilteredReservations(allReservationsResult.data || []);
        setTotalReservations(countResult.count || 0);
        setServices(servicesResult.data || []);
        setEmployees(employeesResult.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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

      // Use functional updates to avoid stale state (dayReservations is derived from allReservations)
      setAllReservations(prev => prev.filter((r) => r.id !== selectedReservation.id));
      setFilteredReservations(prev => prev.filter((r) => r.id !== selectedReservation.id));
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

      // Use functional updates to immediately update UI (dayReservations is derived from allReservations)
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

      // Add the new reservation to state (dayReservations is derived from allReservations)
      if (newReservation) {
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
      alert(t('dashboard.modals.failedToCreateReservation'));
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

      // Update reservation in state (dayReservations is derived from allReservations)
      const updatedReservation = { ...editingReservation, ...updates };
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
      alert(t('dashboard.modals.failedToUpdateReservation'));
    }
  };

  const handleReservationDrop = async (reservationId: string, newDateTime: DateTime, newEmployeeEmail: string) => {
    try {
      // Find the reservation
      const reservation = allReservations.find(r => r.id === reservationId);
      if (!reservation) return;

      // Convert DateTime to ISO string for database
      const dateTimeISO = toGreekISO(newDateTime.toJSDate());
      if (!dateTimeISO) {
        throw new Error('Invalid date time');
      }

      // Update with all required fields - only changing date_time
      const updates = {
        name: reservation.name,
        email: reservation.email,
        phone: reservation.phone,
        note: reservation.note || '',
        date_time: dateTimeISO,
        service_duration: reservation.service_duration || reservation.serviceDuration || 0,
        service_name: reservation.service_name || reservation.serviceName || '',
        profession: reservation.profession || '',
      };

      const result = await updateReservation(reservationId, updates);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update reservation');
      }

      // Update reservation in state
      const updatedReservation = { ...reservation, date_time: dateTimeISO };
      setAllReservations(prev => prev.map(r => r.id === reservationId ? updatedReservation : r));
      setFilteredReservations(prev => prev.map(r => r.id === reservationId ? updatedReservation : r));
    } catch (error) {
      console.error('Error moving reservation:', error);
      alert('Failed to move reservation. Please try again.');
    }
  };

  // Services handlers
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!store?.id) {
      alert(t('dashboard.modals.storeNotFound'));
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
      alert(t('dashboard.modals.failedToSaveService'));
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm(t('dashboard.servicesTab.confirmDelete'))) return;

    try {
      const result = await deleteService(serviceId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete service');
      }

      await fetchAllData();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert(t('dashboard.modals.failedToDeleteService'));
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

  // Photo handlers
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !store) return;

    const file = e.target.files[0];
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const result = await uploadStorePhoto(store.id, params.storeName, formData);

      if (!result.success) {
        throw new Error(result.error);
      }

      const newPhotos = [...carouselPhotos, result.url!];
      setCarouselPhotos(newPhotos);

      // Save to database
      await updateStorePhotos(store.id, newPhotos);
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      e.target.value = ''; // Reset input
    }
  };

  const handlePhotoDelete = async (index: number) => {
    if (!store) return;

    const photoUrl = carouselPhotos[index];

    try {
      await deleteStorePhoto(photoUrl);

      const newPhotos = carouselPhotos.filter((_, i) => i !== index);
      setCarouselPhotos(newPhotos);

      // Save to database
      await updateStorePhotos(store.id, newPhotos);
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo');
    }
  };

  const handlePhotoDragStart = (index: number) => {
    setDraggedPhotoIndex(index);
  };

  const handlePhotoDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedPhotoIndex === null || draggedPhotoIndex === index) return;

    const newPhotos = [...carouselPhotos];
    const draggedPhoto = newPhotos[draggedPhotoIndex];
    newPhotos.splice(draggedPhotoIndex, 1);
    newPhotos.splice(index, 0, draggedPhoto);

    setCarouselPhotos(newPhotos);
    setDraggedPhotoIndex(index);
  };

  const handlePhotoDragEnd = async () => {
    setDraggedPhotoIndex(null);

    // Save new order to database
    if (store) {
      await updateStorePhotos(store.id, carouselPhotos);
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
        date_icon: selectedDateIcon,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      setColors(colorForm);
      alert(t('dashboard.settingsTab.settingsSavedSuccess'));
    } catch (error) {
      console.error('Error saving settings:', error);
      alert(t('dashboard.settingsTab.failedToSaveSettings'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading fullScreen />;
  if (!store) return <div>{t('dashboard.overviewTab.storeNotFound')}</div>;

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
    const slotEnd = slotTime.plus({ minutes: 15 });
    return dayReservations.filter(r => {
      if (r.employee !== employeeEmail) return false;
      const resStart = DateTime.fromISO(r.date_time).setZone('Europe/Athens');
      const resEnd = resStart.plus({ minutes: r.service_duration || r.serviceDuration || 0 });
      // Check if reservation overlaps with this slot (slot starts before res ends AND slot ends after res starts)
      return slotTime < resEnd && slotEnd > resStart;
    });
  };

  // Check if a time slot has a reservation for an employee (backwards compatibility)
  const getReservationAtSlot = (employeeEmail: string, slotTime: DateTime) => {
    const reservations = getReservationsAtSlot(employeeEmail, slotTime);
    return reservations.length > 0 ? reservations[0] : undefined;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text">{store.title || store.store_name}</h1>
        <NotificationBell
          reservations={allReservations}
          onNotificationClick={(reservation) => setNotificationDetailReservation(reservation)}
        />
      </div>


      {/* Schedule Tab */}
      {activeTab === 'overview' && (
        <OverviewTab
          t={t}
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          isOpen={isOpen}
          employees={employees}
          timeSlots={timeSlots}
          dayReservations={dayReservations}
          isEmployeeClosedOnDate={isEmployeeClosedOnDate}
          getReservationsAtSlot={getReservationsAtSlot}
          setNewReservationSlot={setNewReservationSlot}
          setShowNewReservationModal={setShowNewReservationModal}
          openEditReservation={openEditReservation}
          setDeleteConfirmReservation={setDeleteConfirmReservation}
          stringToColor={stringToColor}
          onReservationDrop={handleReservationDrop}
        />
      )}

      {/* Reservations Tab */}
      {activeTab === 'reservations' && (
        <ReservationsTab
          t={t}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filteredReservations={filteredReservations}
          setSelectedReservation={setSelectedReservation}
          setShowCancelModal={setShowCancelModal}
        />
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <ServicesTab
          t={t}
          services={services}
          resetServiceForm={resetServiceForm}
          setShowServiceModal={setShowServiceModal}
          openEditServiceModal={openEditServiceModal}
          handleDeleteService={handleDeleteService}
        />
      )}

      {/* Closures Tab */}
      {activeTab === 'closures' && (
        <ClosuresTab
          t={t}
          store={store}
          employees={employees}
          employeeClosures={employeeClosures}
          closureSelectedEmployee={closureSelectedEmployee}
          setClosureSelectedEmployee={setClosureSelectedEmployee}
          closureMonth={closureMonth}
          setClosureMonth={setClosureMonth}
          parseBlockedDateItem={parseBlockedDateItem}
          updateStoreBlockedDates={updateStoreBlockedDates}
          setStore={setStore}
          setEmployeeClosures={setEmployeeClosures}
        />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <SettingsTab
          t={t}
          whitelist={whitelist}
          newEmail={newEmail}
          setNewEmail={setNewEmail}
          handleAddEmail={handleAddEmail}
          handleRemoveEmail={handleRemoveEmail}
          carouselPhotos={carouselPhotos}
          uploadingPhoto={uploadingPhoto}
          handlePhotoUpload={handlePhotoUpload}
          draggedPhotoIndex={draggedPhotoIndex}
          handlePhotoDragStart={handlePhotoDragStart}
          handlePhotoDragOver={handlePhotoDragOver}
          handlePhotoDragEnd={handlePhotoDragEnd}
          handlePhotoDelete={handlePhotoDelete}
          selectedDateIcon={selectedDateIcon}
          setSelectedDateIcon={setSelectedDateIcon}
          colorForm={colorForm}
          setColorForm={setColorForm}
          handleSaveSettings={handleSaveSettings}
          saving={saving}
        />
      )}

      {/* Cancel Reservation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={t('dashboard.modals.cancelReservation')}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              {t('dashboard.modals.keepReservation')}
            </Button>
            <Button variant="danger" onClick={handleCancelReservation}>
              {t('dashboard.modals.cancelReservationButton')}
            </Button>
          </div>
        }
      >
        <p className="text-text">
          {t('dashboard.modals.cancelReservationConfirm')}{' '}
          <strong>{selectedReservation?.name}</strong>?
        </p>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirmReservation}
        onClose={() => setDeleteConfirmReservation(null)}
        title={t('dashboard.modals.deleteReservation')}
        footer={
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setDeleteConfirmReservation(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeleteReservation}>
              {t('common.delete')}
            </Button>
          </div>
        }
      >
        <div className="text-text">
          <p className="mb-2">
            {t('dashboard.modals.deleteReservationConfirm')}
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
            {t('dashboard.modals.deleteReservationWarning')}
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
        title={editingService ? t('dashboard.modals.editService') : t('dashboard.modals.addNewService')}
        size="lg"
      >
        <form onSubmit={handleServiceSubmit} className="space-y-4">
          <Input
            label={t('dashboard.modals.serviceName')}
            value={serviceFormData.serviceName}
            onChange={(e) => setServiceFormData({ ...serviceFormData, serviceName: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            {/* Profession dropdown or input */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">{t('dashboard.modals.profession')}</label>
              {isAddingNewProfession ? (
                <div className="flex gap-2">
                  <Input
                    value={serviceFormData.profession}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, profession: e.target.value })}
                    placeholder={t('dashboard.modals.enterNewProfession')}
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
                    {t('common.cancel')}
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
                  <option value="">{t('dashboard.modals.selectProfession')}</option>
                  {existingProfessions.map((prof) => (
                    <option key={prof} value={prof}>{prof}</option>
                  ))}
                  <option value="__add_new__">{t('dashboard.modals.addNewProfession')}</option>
                </select>
              )}
            </div>

            {/* Category dropdown or input */}
            <div>
              <label className="block text-sm font-medium text-text mb-1">{t('dashboard.modals.category')}</label>
              {isAddingNewCategory ? (
                <div className="flex gap-2">
                  <Input
                    value={serviceFormData.category}
                    onChange={(e) => setServiceFormData({ ...serviceFormData, category: e.target.value })}
                    placeholder={t('dashboard.modals.enterNewCategory')}
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
                    {t('common.cancel')}
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
                  <option value="">{t('dashboard.modals.selectCategory')}</option>
                  {existingCategories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__add_new__">{t('dashboard.modals.addNewCategory')}</option>
                </select>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('dashboard.modals.duration')}
              type="number"
              value={serviceFormData.duration}
              onChange={(e) => setServiceFormData({ ...serviceFormData, duration: parseInt(e.target.value) })}
              required
            />
            <Input
              label={t('dashboard.modals.price')}
              type="number"
              step="0.01"
              value={serviceFormData.price}
              onChange={(e) => setServiceFormData({ ...serviceFormData, price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <Input
            label={t('dashboard.modals.description')}
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
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {editingService ? t('dashboard.modals.updateService') : t('dashboard.modals.createService')}
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
        title={t('dashboard.modals.newReservation')}
        size="lg"
      >
        {newReservationSlot && (
          <form onSubmit={handleCreateReservation} className="space-y-4">
            <div className="bg-surface-secondary p-3 rounded-lg">
              <p className="text-sm text-text-secondary">{t('dashboard.modals.time')}:</p>
              <p className="font-semibold text-text">
                {newReservationSlot.time.toFormat('EEEE, MMMM d, yyyy · HH:mm')}
              </p>
              <p className="text-sm text-text-secondary mt-1">{t('dashboard.modals.employee')}:</p>
              <p className="font-semibold text-text">
                {newReservationSlot.employee.split('@')[0]}
              </p>
            </div>

            <Input
              label={t('dashboard.modals.clientName')}
              placeholder={t('dashboard.modals.clientNamePlaceholder')}
              value={newReservationForm.name}
              onChange={(e) => setNewReservationForm({ ...newReservationForm, name: e.target.value })}
              required
            />

            <Input
              type="email"
              label={t('dashboard.modals.email')}
              placeholder={t('dashboard.modals.emailPlaceholder')}
              value={newReservationForm.email}
              onChange={(e) => setNewReservationForm({ ...newReservationForm, email: e.target.value })}
              required
            />

            <Input
              type="tel"
              label={t('dashboard.modals.phone')}
              placeholder={t('dashboard.modals.phonePlaceholder')}
              value={newReservationForm.phone}
              onChange={(e) => setNewReservationForm({ ...newReservationForm, phone: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text mb-1">{t('dashboard.modals.service')}</label>
              <select
                value={newReservationForm.service}
                onChange={(e) => setNewReservationForm({ ...newReservationForm, service: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">{t('dashboard.modals.selectService')}</option>
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
              label={t('dashboard.modals.notesOptional')}
              placeholder={t('dashboard.modals.notesPlaceholder')}
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
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {t('dashboard.modals.createReservation')}
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
        title={t('dashboard.modals.editReservation')}
        size="lg"
      >
        {editingReservation && (
          <form onSubmit={handleUpdateReservation} className="space-y-4">
            <Input
              label={t('dashboard.modals.clientName')}
              placeholder={t('dashboard.modals.clientNamePlaceholder')}
              value={editReservationForm.name}
              onChange={(e) => setEditReservationForm({ ...editReservationForm, name: e.target.value })}
              required
            />

            <Input
              type="email"
              label={t('dashboard.modals.email')}
              placeholder={t('dashboard.modals.emailPlaceholder')}
              value={editReservationForm.email}
              onChange={(e) => setEditReservationForm({ ...editReservationForm, email: e.target.value })}
              required
            />

            <Input
              type="tel"
              label={t('dashboard.modals.phone')}
              placeholder={t('dashboard.modals.phonePlaceholder')}
              value={editReservationForm.phone}
              onChange={(e) => setEditReservationForm({ ...editReservationForm, phone: e.target.value })}
              required
            />

            <div>
              <label className="block text-sm font-medium text-text mb-1">{t('dashboard.modals.service')}</label>
              <select
                value={editReservationForm.service}
                onChange={(e) => setEditReservationForm({ ...editReservationForm, service: e.target.value })}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">{t('dashboard.modals.selectService')}</option>
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
              label={t('dashboard.modals.dateTime')}
              value={editReservationForm.dateTime}
              onChange={(e) => setEditReservationForm({ ...editReservationForm, dateTime: e.target.value })}
              required
            />

            <Textarea
              label={t('dashboard.modals.notesOptional')}
              placeholder={t('dashboard.modals.notesPlaceholder')}
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
                {t('common.cancel')}
              </Button>
              <Button type="submit">
                {t('dashboard.modals.updateReservation')}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Notification Detail Modal */}
      <Modal
        isOpen={!!notificationDetailReservation}
        onClose={() => setNotificationDetailReservation(null)}
        title={t('dashboard.notifications.reservationDetails')}
        size="lg"
      >
        {notificationDetailReservation && (
          <div className="space-y-4">
            {/* Client Info */}
            <div className="bg-surface-secondary p-4 rounded-lg">
              <h3 className="font-semibold text-text mb-3">{t('dashboard.notifications.clientInfo')}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="text-text font-medium">{notificationDetailReservation.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-text-secondary">{notificationDetailReservation.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-text-secondary">{notificationDetailReservation.phone}</span>
                </div>
              </div>
            </div>

            {/* Appointment Info */}
            <div className="bg-surface-secondary p-4 rounded-lg">
              <h3 className="font-semibold text-text mb-3">{t('dashboard.notifications.appointmentInfo')}</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  <span className="text-text font-medium">
                    {notificationDetailReservation.service_name || notificationDetailReservation.serviceName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-text-secondary">
                    {DateTime.fromISO(notificationDetailReservation.date_time).setZone('Europe/Athens').toFormat('EEEE, MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-text-secondary">
                    {DateTime.fromISO(notificationDetailReservation.date_time).setZone('Europe/Athens').toFormat('HH:mm')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-text-secondary">
                    {notificationDetailReservation.service_duration || notificationDetailReservation.serviceDuration} {t('store.minutes')}
                  </span>
                </div>
                {notificationDetailReservation.employee && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-text-secondary">
                      {t('dashboard.modals.employee')}: {notificationDetailReservation.employee.split('@')[0]}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Notes */}
            {notificationDetailReservation.note && (
              <div className="bg-surface-secondary p-4 rounded-lg">
                <h3 className="font-semibold text-text mb-2">{t('dashboard.modals.notesOptional')}</h3>
                <p className="text-text-secondary">{notificationDetailReservation.note}</p>
              </div>
            )}

            {/* Created At */}
            <div className="text-xs text-text-secondary text-center">
              {t('dashboard.notifications.createdAt')}: {DateTime.fromISO(notificationDetailReservation.created_at).toRelative()}
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                onClick={() => setNotificationDetailReservation(null)}
              >
                {t('common.close')}
              </Button>
              <Button
                onClick={() => {
                  openEditReservation(notificationDetailReservation);
                  setNotificationDetailReservation(null);
                }}
              >
                {t('common.edit')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
