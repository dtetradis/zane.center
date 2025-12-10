-- Add date_icon column to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS date_icon TEXT DEFAULT 'calendar';
