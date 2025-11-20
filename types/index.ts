export interface User {
  id: string;
  role: 'owner' | 'admin' | 'employee';
  category?: string;
  storeName?: string;
  id_store?: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface Reservation {
  id: string;
  name: string;
  email: string;
  phone: string;
  note?: string;
  date_time: string;
  serviceDuration: number;
  service_duration?: number; // Database field name
  serviceName: string;
  service_name?: string; // Database field name
  id_store: string;
  employee?: string;
  profession: string;
  created_at: string;
}

export interface Service {
  id: string;
  id_store: string;
  index: number;
  serviceName: string;
  duration: number;
  price: number;
  description?: string;
  profession: string;
  category: string;
}

export interface Store {
  id: string;
  address: string;
  reviews?: number;
  photos?: string[];
  storeName: string;
  store_name?: string; // Database field name
  title: string;
  workDays: WorkDay[];
  work_days?: WorkDay[]; // Database field name
  categories: string[];
  blockedDates: string[];
  blocked_dates?: string[]; // Database field name
  whitelist: string[];
  themeColors?: ThemeColors;
  theme_colors?: ThemeColors; // Database field name
  created_at: string;
}

export interface WorkDay {
  day: string;
  startTime: string;
  endTime: string;
  enabled: boolean;
}

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  secondary: string;
  accent: string;
}

export interface CartItem {
  service: Service;
  employee?: string;
  dateTime?: string;
}
