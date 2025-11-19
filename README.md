# Zane Center - Beauty & Wellness Reservation System

A full-stack reservation system built with Next.js, Supabase, and TailwindCSS for beauty salons, barbers, and wellness centers.

## Features

- **Multi-store Support**: Each store has its own branded page with customizable colors
- **Authentication**: Secure email/password authentication for store owners and employees
- **Reservation Management**: Complete booking system with cart functionality
- **Service Management**: Add, edit, and organize services by category
- **Dashboard**: Store owners can manage reservations, services, and settings
- **Theme Customization**: Light/dark mode with customizable brand colors
- **Date Blocking**: Block specific dates when the store is closed
- **Email Whitelist**: Control who can create accounts for your store
- **Greek Timezone**: All dates/times handled in Europe/Athens timezone using Luxon

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: TailwindCSS
- **Database & Auth**: Supabase
- **State Management**: Zustand with localStorage persistence
- **Date/Time**: Luxon (Greek timezone)
- **Language**: TypeScript

## Project Structure

```
zane_center/
├── app/
│   ├── layout.tsx                    # Root layout with theme provider
│   ├── page.tsx                      # Landing page
│   ├── globals.css                   # Global styles with CSS variables
│   └── [storeName]/
│       ├── layout.tsx                # Store layout with navigation
│       ├── page.tsx                  # Store services page
│       ├── reservation/
│       │   ├── page.tsx              # Cart & booking page
│       │   └── [id]/
│       │       └── page.tsx          # Confirmation page
│       ├── checkout/
│       │   └── page.tsx              # Checkout with customer info
│       └── dashboard/
│           ├── layout.tsx            # Dashboard layout
│           ├── page.tsx              # Dashboard overview
│           ├── login/
│           │   └── page.tsx          # Login page
│           ├── signup/
│           │   └── page.tsx          # Signup page
│           ├── reservations/
│           │   └── page.tsx          # Manage reservations
│           ├── services/
│           │   └── page.tsx          # Manage services
│           └── settings/
│               └── page.tsx          # Store settings
├── components/
│   ├── ui/
│   │   ├── Button.tsx                # Button component
│   │   ├── Input.tsx                 # Input & Textarea components
│   │   ├── Card.tsx                  # Card components
│   │   ├── Loading.tsx               # Loading spinner
│   │   └── Modal.tsx                 # Modal component
│   ├── dashboard/
│   │   └── DashboardNav.tsx          # Dashboard navigation
│   ├── store/
│   │   ├── StoreNav.tsx              # Public store navigation
│   │   └── StoreServicesClient.tsx   # Services display with filters
│   ├── ServiceCard.tsx               # Service display card
│   ├── ReservationCard.tsx           # Reservation display card
│   ├── ThemeToggle.tsx               # Dark/light theme toggle
│   └── ThemeProvider.tsx             # Theme initialization
├── lib/
│   └── supabase/
│       ├── client.ts                 # Client-side Supabase
│       ├── server.ts                 # Server-side Supabase
│       └── utils.ts                  # Date/time utilities
├── store/
│   ├── useCartStore.ts               # Cart state management
│   └── useThemeStore.ts              # Theme state management
├── types/
│   ├── index.ts                      # TypeScript types
│   └── supabase.ts                   # Supabase database types
├── supabase/
│   └── schema.sql                    # Database schema
├── middleware.ts                     # Auth middleware
├── tailwind.config.ts                # Tailwind configuration
├── tsconfig.json                     # TypeScript configuration
├── next.config.js                    # Next.js configuration
└── package.json                      # Dependencies
```

## Setup Instructions

### 1. Clone and Install

```bash
npm install
```

### 2. Set up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL schema from `supabase/schema.sql` in the Supabase SQL Editor
3. Copy your project URL and anon key

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Create a Demo Store

Run this SQL in your Supabase SQL Editor to create a demo store:

```sql
INSERT INTO stores (store_name, title, address, work_days, categories, whitelist)
VALUES (
  'demo',
  'Demo Beauty Salon',
  '123 Main St, Athens, Greece',
  '[
    {"day": "Monday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Tuesday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Wednesday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Thursday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Friday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Saturday", "startTime": "10:00", "endTime": "16:00", "enabled": true},
    {"day": "Sunday", "startTime": "00:00", "endTime": "00:00", "enabled": false}
  ]'::jsonb,
  ARRAY['Beauty', 'Haircut', 'Spa'],
  ARRAY['your-email@example.com']
);
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

- Visit `http://localhost:3000/demo` to see the demo store
- Visit `http://localhost:3000/demo/dashboard/signup` to create an account (use whitelisted email)

## User Flows

### Customer Flow
1. Visit store page (`/[storeName]`)
2. Browse services and add to cart
3. Go to reservation page to select date/time
4. Proceed to checkout and enter contact info
5. Receive confirmation with reservation details

### Store Owner Flow
1. Visit dashboard login (`/[storeName]/dashboard/login`)
2. Sign up with whitelisted email or login
3. View dashboard with today's reservations
4. Manage services (add, edit, delete)
5. View and manage all reservations
6. Configure settings (whitelist, blocked dates, theme colors)

## Key Features

### Cart System
- Persists in localStorage
- Add multiple services
- Select date/time for each service
- Specify preferred employee

### Theme System
- Light/dark mode toggle
- Customizable brand colors per store
- CSS variables for easy theming
- Colors saved in store settings

### Date/Time Handling
- All times in Greek (Europe/Athens) timezone
- Luxon for timezone-aware operations
- Block specific dates
- Validate against blocked dates

### Row Level Security
- Users can only access their own store's data
- Public can view stores and services
- Public can create reservations
- Store owners manage their reservations

## Database Schema

### Tables
- `users` - Store owners and employees (extends auth.users)
- `stores` - Store information and settings
- `services` - Services offered by each store
- `reservations` - Customer bookings

See `supabase/schema.sql` for complete schema with RLS policies.

## Development

```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Deployment

1. Deploy to Vercel or your preferred platform
2. Set environment variables in deployment settings
3. Ensure Supabase project is production-ready
4. Update `next.config.js` with your Supabase domain for image support

## Future Enhancements

- Email notifications for reservations
- SMS reminders
- Payment integration
- Reviews and ratings
- Employee scheduling
- Analytics dashboard
- Multi-language support
- Mobile app

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
