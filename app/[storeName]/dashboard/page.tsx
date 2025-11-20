'use client';

import { useEffect, useState } from 'react';
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

type Tab = 'overview' | 'reservations' | 'services' | 'settings';

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
  }, []);

  useEffect(() => {
    if (store) {
      fetchDayReservations();
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

  const fetchDayReservations = async () => {
    if (!store) return;

    try {
      const dayStart = selectedDate.startOf('day').toISO();
      const dayEnd = selectedDate.plus({ days: 1 }).startOf('day').toISO();

      const { data } = await supabase
        .from('reservations')
        .select('*')
        .eq('id_store', store.id)
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

      setAllReservations(allReservations.filter((r) => r.id !== selectedReservation.id));
      setDayReservations(dayReservations.filter((r) => r.id !== selectedReservation.id));
      setShowCancelModal(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error canceling reservation:', error);
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

      const { error } = await supabase
        .from('reservations')
        .insert(reservation);

      if (error) throw error;

      // Refresh reservations
      await fetchDayReservations();
      await fetchAllData();

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

  // Services handlers
  const handleServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceFormData)
          .eq('id', editingService.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('services').insert({
          ...serviceFormData,
          id_store: store?.id,
          index: services.length,
        });

        if (error) throw error;
      }

      await fetchAllData();
      setShowServiceModal(false);
      resetServiceForm();
    } catch (error) {
      console.error('Error saving service:', error);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      await fetchAllData();
    } catch (error) {
      console.error('Error deleting service:', error);
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
  };

  const openEditServiceModal = (service: Service) => {
    setEditingService(service);
    setServiceFormData({
      serviceName: service.serviceName,
      profession: service.profession,
      category: service.category,
      duration: service.duration,
      price: service.price,
      description: service.description || '',
    });
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
      const newBlockedDates = [...currentBlockedDates, blockedDate];
      setStore({ ...store, blockedDates: newBlockedDates, blocked_dates: newBlockedDates });
      setBlockedDate('');
    }
  };

  const handleUnblockDate = (date: string) => {
    if (store) {
      const currentBlockedDates = store.blocked_dates || store.blockedDates || [];
      const newBlockedDates = currentBlockedDates.filter((d) => d !== date);
      setStore({ ...store, blockedDates: newBlockedDates, blocked_dates: newBlockedDates });
    }
  };

  const handleSaveSettings = async () => {
    if (!store) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('stores')
        .update({
          whitelist,
          blocked_dates: store.blockedDates,
          theme_colors: colorForm,
        })
        .eq('id', store.id);

      if (error) throw error;

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

  const tabs = [
    { id: 'overview', label: 'Schedule' },
    { id: 'reservations', label: 'Reservations' },
    { id: 'services', label: 'Services' },
    { id: 'settings', label: 'Settings' },
  ];

  // Generate time slots for the day
  const generateTimeSlots = () => {
    const dayName = selectedDate.toFormat('EEEE');
    const workDays = store.work_days || store.workDays || [];
    const workDay = workDays.find(wd => wd.day === dayName);

    if (!workDay || !workDay.enabled) return { slots: [], isOpen: false };

    const [startHour, startMin] = workDay.startTime.split(':').map(Number);
    const [endHour, endMin] = workDay.endTime.split(':').map(Number);

    const slots: DateTime[] = [];
    let current = selectedDate.set({ hour: startHour, minute: startMin });
    const end = selectedDate.set({ hour: endHour, minute: endMin });

    while (current < end) {
      slots.push(current);
      current = current.plus({ minutes: 15 });
    }

    return { slots, isOpen: true };
  };

  const { slots: timeSlots, isOpen } = generateTimeSlots();

  // Check if a time slot has a reservation for an employee
  const getReservationAtSlot = (employeeEmail: string, slotTime: DateTime) => {
    return dayReservations.find(r => {
      if (r.employee !== employeeEmail) return false;
      const resStart = DateTime.fromISO(r.date_time);
      const resEnd = resStart.plus({ minutes: r.service_duration || r.serviceDuration || 0 });
      return slotTime >= resStart && slotTime < resEnd;
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Dashboard</h1>
        <p className="text-text-secondary">Welcome to your store management panel</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`
                px-4 py-2 font-medium transition-all border-b-2
                ${activeTab === tab.id
                  ? 'text-primary border-primary'
                  : 'text-text-secondary border-transparent hover:text-text hover:border-border'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Date Picker */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => setSelectedDate(selectedDate.minus({ days: 1 }))}
            >
              ← Previous Day
            </Button>
            <Input
              type="date"
              value={selectedDate.toFormat('yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(DateTime.fromISO(e.target.value).setZone('Europe/Athens'))}
              className="w-auto"
            />
            <Button
              variant="outline"
              onClick={() => setSelectedDate(selectedDate.plus({ days: 1 }))}
            >
              Next Day →
            </Button>
            <Button
              onClick={() => setSelectedDate(DateTime.now().setZone('Europe/Athens'))}
            >
              Today
            </Button>
            <p className="text-text font-medium">{selectedDate.toFormat('EEEE, MMMM d, yyyy')}</p>
          </div>

          {/* Schedule Grid */}
          {!isOpen ? (
            <Card>
              <CardContent className="py-8 text-center text-text-secondary">
                Store is closed on this day.
              </CardContent>
            </Card>
          ) : employees.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-text-secondary">
                No employees found. Please add employees to manage schedule.
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="grid gap-0 border border-border rounded-lg overflow-hidden" style={{ gridTemplateColumns: `80px repeat(${employees.length}, minmax(150px, 1fr))` }}>
                  {/* Header Row */}
                  <div className="bg-surface-secondary border-b border-r border-border p-2 font-semibold text-sm sticky top-0 z-10">
                    Time
                  </div>
                  {employees.map((employee) => (
                    <div
                      key={employee.id}
                      className="bg-surface-secondary border-b border-r border-border last:border-r-0 p-2 sticky top-0 z-10"
                    >
                      <p className="font-semibold text-sm text-primary truncate">
                        {employee.email.split('@')[0]}
                      </p>
                      <p className="text-xs text-text-secondary truncate">{employee.category}</p>
                    </div>
                  ))}

                  {/* Time Slots */}
                  {timeSlots.length > 0 ? (
                    timeSlots.map((slot) => {
                      const isHour = slot.minute === 0;
                      return (
                        <>
                          {/* Time Label */}
                          <div
                            key={`time-${slot.toISO()}`}
                            className={`border-r border-border p-2 text-xs ${
                              isHour ? 'font-semibold border-t border-t-border' : 'border-t border-t-border/30'
                            }`}
                          >
                            {slot.toFormat('HH:mm')}
                          </div>

                          {/* Employee Slots */}
                          {employees.map((employee) => {
                            const reservation = getReservationAtSlot(employee.email, slot);
                            const isStartOfReservation = reservation && DateTime.fromISO(reservation.date_time).equals(slot);

                            return (
                              <div
                                key={`slot-${employee.id}-${slot.toISO()}`}
                                className={`border-r last:border-r-0 border-border p-1 ${
                                  isHour ? 'border-t border-t-border' : 'border-t border-t-border/30'
                                } ${reservation ? 'bg-primary/5' : ''}`}
                                style={{ minHeight: '40px' }}
                              >
                                {reservation ? (
                                  isStartOfReservation ? (
                                    <div className="bg-primary text-white rounded p-2 text-xs relative z-10" style={{ minHeight: '60px' }}>
                                      <p className="font-semibold truncate">{reservation.name}</p>
                                      <p className="text-white/90 truncate text-[10px] mt-0.5">
                                        {reservation.service_name || reservation.serviceName}
                                      </p>
                                      <p className="text-white/80 text-[10px] mt-0.5">
                                        {reservation.service_duration || reservation.serviceDuration} min
                                      </p>
                                    </div>
                                  ) : null
                                ) : (
                                  <button
                                    onClick={() => {
                                      setNewReservationSlot({ employee: employee.email, time: slot });
                                      setShowNewReservationModal(true);
                                    }}
                                    className="w-full h-full min-h-[38px] flex items-center justify-center text-text-secondary hover:text-primary hover:bg-surface-secondary rounded transition-colors"
                                    title="Add reservation"
                                  >
                                    <span className="text-xl">+</span>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </>
                      );
                    })
                  ) : (
                    <div className="col-span-full p-8 text-center text-text-secondary">
                      No time slots available. Please configure work hours in settings.
                    </div>
                  )}
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
                  <ServiceCard service={service} onAddToCart={() => {}} />
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
                {(store.blocked_dates || store.blockedDates || []).map((date) => (
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
            <Input
              label="Profession"
              value={serviceFormData.profession}
              onChange={(e) => setServiceFormData({ ...serviceFormData, profession: e.target.value })}
              required
            />
            <Input
              label="Category"
              value={serviceFormData.category}
              onChange={(e) => setServiceFormData({ ...serviceFormData, category: e.target.value })}
              required
            />
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
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {(service as any).service_name || service.serviceName} - {service.duration} min - €{service.price}
                  </option>
                ))}
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
    </div>
  );
}
