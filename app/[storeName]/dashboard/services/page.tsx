'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { ServiceCard } from '@/components/ServiceCard';
import { Loading } from '@/components/ui/Loading';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import type { Service } from '@/types';
import { createService, updateService, deleteService } from '@/app/actions/services';

export default function ServicesPage() {
  const params = useParams();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [storeId, setStoreId] = useState<string>('');
  const supabase = createClient();

  const [formData, setFormData] = useState({
    serviceName: '',
    profession: '',
    category: '',
    duration: 30,
    price: 0,
    description: '',
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      // TODO: Re-enable authentication for production
      // const { data: { user } } = await supabase.auth.getUser();
      // const { data: userData } = await supabase
      //   .from('users')
      //   .select('id_store')
      //   .eq('id', user?.id)
      //   .single();

      // Get store by name
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('store_name', params.storeName)
        .single();

      setStoreId(store?.id || '');

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id_store', store?.id)
        .order('index', { ascending: true });

      if (error) throw error;

      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeId) {
      alert('Store not found');
      return;
    }

    try {
      // Transform camelCase form data to snake_case for database
      const dbData = {
        service_name: formData.serviceName,
        profession: formData.profession,
        category: formData.category,
        duration: formData.duration,
        price: formData.price,
        description: formData.description,
      };

      let result;
      if (editingService) {
        result = await updateService(editingService.id, dbData);
      } else {
        result = await createService(storeId, dbData, services.length);
      }

      if (!result.success) {
        throw new Error(result.error || 'Failed to save service');
      }

      await fetchServices();
      setShowModal(false);
      resetForm();
    } catch (error) {
      console.error('Error saving service:', error);
      alert('Failed to save service. Please try again.');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const result = await deleteService(serviceId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete service');
      }

      await fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Failed to delete service. Please try again.');
    }
  };

  const resetForm = () => {
    setFormData({
      serviceName: '',
      profession: '',
      category: '',
      duration: 30,
      price: 0,
      description: '',
    });
    setEditingService(null);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    // Handle both snake_case (from DB) and camelCase field names
    const serviceName = (service as any).service_name || service.serviceName || '';
    setFormData({
      serviceName,
      profession: service.profession,
      category: service.category,
      duration: service.duration,
      price: service.price,
      description: service.description || '',
    });
    setShowModal(true);
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text">Services</h1>
          <p className="text-text-secondary">Manage your service offerings</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setShowModal(true);
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
                <Button size="sm" variant="outline" onClick={() => openEditModal(service)}>
                  Edit
                </Button>
                <Button size="sm" variant="danger" onClick={() => handleDelete(service.id)}>
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

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingService ? 'Edit Service' : 'Add New Service'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Service Name"
            value={formData.serviceName}
            onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Profession"
              value={formData.profession}
              onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
              required
            />
            <Input
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (minutes)"
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
              required
            />
            <Input
              label="Price (€)"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              required
            />
          </div>

          <Input
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="flex gap-2 justify-end pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                resetForm();
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
