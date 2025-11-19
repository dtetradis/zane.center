-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'employee');

-- Stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  reviews DECIMAL(2,1) DEFAULT 0,
  photos TEXT[],
  store_name TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  work_days JSONB NOT NULL DEFAULT '[]'::jsonb,
  categories TEXT[] NOT NULL DEFAULT '{}',
  blocked_dates TEXT[] DEFAULT '{}',
  whitelist TEXT[] DEFAULT '{}',
  theme_colors JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Europe/Athens', NOW())
);

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'employee',
  category TEXT,
  store_name TEXT,
  id_store UUID REFERENCES stores(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Europe/Athens', NOW())
);

-- Services table
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_store UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  index INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  profession TEXT NOT NULL,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Europe/Athens', NOW()),
  UNIQUE(id_store, index)
);

-- Reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  note TEXT,
  date_time TIMESTAMP WITH TIME ZONE NOT NULL,
  service_duration INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  id_store UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  employee TEXT,
  profession TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('Europe/Athens', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_users_id_store ON users(id_store);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_services_id_store ON services(id_store);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_reservations_id_store ON reservations(id_store);
CREATE INDEX idx_reservations_date_time ON reservations(date_time);
CREATE INDEX idx_reservations_email ON reservations(email);
CREATE INDEX idx_stores_store_name ON stores(store_name);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Stores policies
CREATE POLICY "Public stores are viewable by everyone"
  ON stores FOR SELECT
  USING (true);

CREATE POLICY "Store owners can update their own store"
  ON stores FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = stores.id));

-- Users policies
CREATE POLICY "Users can view their own data"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Store owners can view users in their store"
  ON users FOR SELECT
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = users.id_store AND role IN ('owner', 'admin')));

-- Services policies
CREATE POLICY "Services are viewable by everyone"
  ON services FOR SELECT
  USING (true);

CREATE POLICY "Store owners can manage services"
  ON services FOR ALL
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = services.id_store AND role IN ('owner', 'admin')));

-- Reservations policies
CREATE POLICY "Anyone can create reservations"
  ON reservations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Store owners can view reservations for their store"
  ON reservations FOR SELECT
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = reservations.id_store));

CREATE POLICY "Store owners can update reservations for their store"
  ON reservations FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = reservations.id_store));

CREATE POLICY "Store owners can delete reservations for their store"
  ON reservations FOR DELETE
  USING (auth.uid() IN (SELECT id FROM users WHERE id_store = reservations.id_store));

-- Function to automatically create user record after signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (NEW.id, NEW.email, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function after user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
