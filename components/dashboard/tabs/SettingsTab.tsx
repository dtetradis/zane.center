'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface SettingsTabProps {
  t: (key: string) => string;
  whitelist: string[];
  newEmail: string;
  setNewEmail: (email: string) => void;
  handleAddEmail: () => void;
  handleRemoveEmail: (email: string) => void;
  carouselPhotos: string[];
  uploadingPhoto: boolean;
  handlePhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  draggedPhotoIndex: number | null;
  handlePhotoDragStart: (index: number) => void;
  handlePhotoDragOver: (e: React.DragEvent, index: number) => void;
  handlePhotoDragEnd: () => void;
  handlePhotoDelete: (index: number) => void;
  selectedDateIcon: string;
  setSelectedDateIcon: (icon: string) => void;
  colorForm: {
    primary: string;
    primaryHover: string;
    primaryLight: string;
    secondary: string;
    accent: string;
  };
  setColorForm: (colors: any) => void;
  handleSaveSettings: () => void;
  saving: boolean;
}

export default function SettingsTab({
  t,
  whitelist,
  newEmail,
  setNewEmail,
  handleAddEmail,
  handleRemoveEmail,
  carouselPhotos,
  uploadingPhoto,
  handlePhotoUpload,
  draggedPhotoIndex,
  handlePhotoDragStart,
  handlePhotoDragOver,
  handlePhotoDragEnd,
  handlePhotoDelete,
  selectedDateIcon,
  setSelectedDateIcon,
  colorForm,
  setColorForm,
  handleSaveSettings,
  saving,
}: SettingsTabProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-text">{t('dashboard.settingsTab.title')}</h2>
        <p className="text-text-secondary">{t('dashboard.settingsTab.subtitle')}</p>
      </div>

      {/* Whitelist */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.settingsTab.emailWhitelist')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            {t('dashboard.settingsTab.whitelistDescription')}
          </p>

          <div className="flex gap-2">
            <Input
              type="email"
              placeholder={t('dashboard.settingsTab.emailPlaceholder')}
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
            />
            <Button onClick={handleAddEmail}>{t('dashboard.settingsTab.add')}</Button>
          </div>

          <div className="space-y-2">
            {whitelist.map((email) => (
              <div key={email} className="flex items-center justify-between bg-surface p-2 rounded">
                <span className="text-text">{email}</span>
                <Button size="sm" variant="danger" onClick={() => handleRemoveEmail(email)}>
                  {t('dashboard.settingsTab.remove')}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Carousel Images */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.settingsTab.carouselImages')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            {t('dashboard.settingsTab.carouselDescription')}
          </p>

          {/* Upload Button */}
          <div className="flex gap-2">
            <label className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={uploadingPhoto}
                className="hidden"
              />
              <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                {uploadingPhoto ? (
                  <>
                    <svg className="w-5 h-5 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-text-secondary">{t('dashboard.settingsTab.uploading')}</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span className="text-text-secondary">{t('dashboard.settingsTab.clickToUpload')}</span>
                  </>
                )}
              </div>
            </label>
          </div>

          {/* Photo Grid */}
          {carouselPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {carouselPhotos.map((photo, index) => (
                <div
                  key={`${photo}-${index}`}
                  draggable
                  onDragStart={() => handlePhotoDragStart(index)}
                  onDragOver={(e) => handlePhotoDragOver(e, index)}
                  onDragEnd={handlePhotoDragEnd}
                  className={`relative aspect-video rounded-lg overflow-hidden border-2 cursor-move group ${
                    draggedPhotoIndex === index ? 'border-primary opacity-50' : 'border-border hover:border-primary'
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Carousel image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {/* Order badge */}
                  <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={() => handlePhotoDelete(index)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                  {/* Drag handle */}
                  <div className="absolute bottom-2 right-2 text-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-text-secondary">
              {t('dashboard.settingsTab.noCarouselImages')}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Date Icon */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.settingsTab.dateIcon')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            {t('dashboard.settingsTab.dateIconDescription')}
          </p>

          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {[
              { id: 'calendar', label: t('dashboard.settingsTab.calendar'), path: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
              { id: 'scissors', label: t('dashboard.settingsTab.scissors'), path: 'M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z' },
              { id: 'sparkles', label: t('dashboard.settingsTab.sparkles'), path: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z' },
              { id: 'heart', label: t('dashboard.settingsTab.heart'), path: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              { id: 'star', label: t('dashboard.settingsTab.star'), path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
              { id: 'clock', label: t('dashboard.settingsTab.clock'), path: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            ].map((icon) => (
              <button
                key={icon.id}
                onClick={() => setSelectedDateIcon(icon.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  selectedDateIcon === icon.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <svg
                  className={`w-8 h-8 ${
                    selectedDateIcon === icon.id ? 'text-primary' : 'text-text-secondary'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon.path} />
                </svg>
                <span className="text-xs text-text">{icon.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Theme Colors */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.settingsTab.themeColors')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            {t('dashboard.settingsTab.themeColorsDescription')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text mb-1">{t('dashboard.settingsTab.primaryColor')}</label>
              <input
                type="color"
                value={colorForm.primary}
                onChange={(e) => setColorForm({ ...colorForm, primary: e.target.value })}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">{t('dashboard.settingsTab.primaryHover')}</label>
              <input
                type="color"
                value={colorForm.primaryHover}
                onChange={(e) => setColorForm({ ...colorForm, primaryHover: e.target.value })}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">{t('dashboard.settingsTab.primaryLight')}</label>
              <input
                type="color"
                value={colorForm.primaryLight}
                onChange={(e) => setColorForm({ ...colorForm, primaryLight: e.target.value })}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">{t('dashboard.settingsTab.secondaryColor')}</label>
              <input
                type="color"
                value={colorForm.secondary}
                onChange={(e) => setColorForm({ ...colorForm, secondary: e.target.value })}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1">{t('dashboard.settingsTab.accentColor')}</label>
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
        {t('dashboard.settingsTab.saveSettings')}
      </Button>
    </div>
  );
}
