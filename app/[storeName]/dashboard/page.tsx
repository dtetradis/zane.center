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
import { getGreekDateTime } from '@/lib/supabase/utils';
import type { Service, Store, Reservation } from '@/types';

type Tab = 'overview' | 'reservations' | 'services' | 'settings';

export default function DashboardPage({ params }: { params: { storeName: string } }) {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [store, setStore] = useState<Store | null>(null);
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [totalReservations, setTotalReservations] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

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
        if (storeData.theme_colors) {
          setColorForm(storeData.theme_colors);
          setColors(storeData.theme_colors);
        }

        // Get today's reservations
        const today = getGreekDateTime().startOf('day').toISO();
        const tomorrow = getGreekDateTime().plus({ days: 1 }).startOf('day').toISO();

        const { data: todayData } = await supabase
          .from('reservations')
          .select('*')
          .eq('id_store', storeData.id)
          .gte('date_time', today)
          .lt('date_time', tomorrow)
          .order('date_time', { ascending: true });

        setTodayReservations(todayData || []);

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

      setAllReservations(allReservations.filter((r) => r.id !== selectedReservation.id));
      setTodayReservations(todayReservations.filter((r) => r.id !== selectedReservation.id));
      setShowCancelModal(false);
      setSelectedReservation(null);
    } catch (error) {
      console.error('Error canceling reservation:', error);
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
      const newBlockedDates = [...(store.blockedDates || []), blockedDate];
      setStore({ ...store, blockedDates: newBlockedDates });
      setBlockedDate('');
    }
  };

  const handleUnblockDate = (date: string) => {
    if (store) {
      const newBlockedDates = store.blockedDates.filter((d) => d !== date);
      setStore({ ...store, blockedDates: newBlockedDates });
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
    { id: 'overview', label: 'Overview' },
    { id: 'reservations', label: 'Reservations' },
    { id: 'services', label: 'Services' },
    { id: 'settings', label: 'Settings' },
  ];

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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-text-secondary">Today's Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{todayReservations.length}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-text-secondary">Total Reservations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{totalReservations}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-text-secondary">Active Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-primary">{services.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Today's Reservations */}
          <div>
            <h2 className="text-2xl font-bold text-text mb-4">Today's Reservations</h2>
            {todayReservations.length > 0 ? (
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
                {store.blockedDates?.map((date) => (
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
    </div>
  );
}
