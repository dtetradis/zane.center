'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Loading } from '@/components/ui/Loading';
import { useThemeStore } from '@/store/useThemeStore';
import type { Store } from '@/types';

export default function SettingsPage() {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [whitelist, setWhitelist] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [blockedDate, setBlockedDate] = useState('');
  const supabase = createClient();
  const { colors, setColors } = useThemeStore();

  const [colorForm, setColorForm] = useState({
    primary: colors.primary,
    primaryHover: colors.primaryHover,
    primaryLight: colors.primaryLight,
    secondary: colors.secondary,
    accent: colors.accent,
  });

  useEffect(() => {
    fetchStore();
  }, []);

  const fetchStore = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { data: userData } = await supabase
        .from('users')
        .select('id_store')
        .eq('id', user?.id)
        .single();

      const { data: storeData, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', userData?.id_store)
        .single();

      if (error) throw error;

      setStore(storeData);
      setWhitelist(storeData.whitelist || []);

      if (storeData.theme_colors) {
        setColorForm(storeData.theme_colors);
        setColors(storeData.theme_colors);
      }
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-text">Settings</h1>
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
  );
}
