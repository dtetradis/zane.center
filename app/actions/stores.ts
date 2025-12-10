'use server';

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function updateStoreSettings(
  storeId: string,
  settings: {
    whitelist?: string[];
    blocked_dates?: any[];
    theme_colors?: any;
    date_icon?: string;
  }
) {
  try {
    console.log('Server action: updating store settings for store', storeId);
    console.log('Server action: settings', settings);

    const { data, error } = await supabase
      .from('stores')
      .update(settings)
      .eq('id', storeId)
      .select();

    if (error) {
      console.error('Error updating store settings:', error);
      return { success: false, error: error.message };
    }

    console.log('Server action: settings updated successfully', data);
    return { success: true, data: data?.[0] };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateStoreBlockedDates(storeId: string, blockedDates: any[]) {
  try {
    console.log('Server action: updating blocked_dates for store', storeId);
    console.log('Server action: new blocked_dates', blockedDates);

    const { data, error } = await supabase
      .from('stores')
      .update({ blocked_dates: blockedDates })
      .eq('id', storeId)
      .select('blocked_dates');

    if (error) {
      console.error('Error updating blocked_dates:', error);
      return { success: false, error: error.message };
    }

    console.log('Server action: updated successfully', data);
    return { success: true, data: data?.[0]?.blocked_dates || blockedDates };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateStorePhotos(storeId: string, photos: string[]) {
  try {
    console.log('Server action: updating photos for store', storeId);
    console.log('Server action: new photos', photos);

    const { data, error } = await supabase
      .from('stores')
      .update({ photos })
      .eq('id', storeId)
      .select('photos');

    if (error) {
      console.error('Error updating photos:', error);
      return { success: false, error: error.message };
    }

    console.log('Server action: photos updated successfully', data);
    return { success: true, data: data?.[0]?.photos || photos };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function uploadStorePhoto(storeId: string, storeName: string, file: FormData) {
  try {
    const imageFile = file.get('file') as File;
    if (!imageFile) {
      return { success: false, error: 'No file provided' };
    }

    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${storeName}/${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('store-photos')
      .upload(fileName, imageFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Error uploading photo:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('store-photos')
      .getPublicUrl(fileName);

    return { success: true, url: urlData.publicUrl };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteStorePhoto(photoUrl: string) {
  try {
    // Extract path from URL
    const urlParts = photoUrl.split('/store-photos/');
    if (urlParts.length < 2) {
      return { success: false, error: 'Invalid photo URL' };
    }

    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from('store-photos')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting photo:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
