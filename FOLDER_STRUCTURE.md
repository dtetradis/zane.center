# Zane Center - Complete Folder Structure

```
zane_center/
│
├── app/                                    # Next.js App Router
│   ├── layout.tsx                         # Root layout with ThemeProvider
│   ├── page.tsx                           # Landing page
│   ├── globals.css                        # Global styles with CSS variables
│   │
│   └── [storeName]/                       # Dynamic store routes
│       ├── layout.tsx                     # Store layout with StoreNav
│       ├── page.tsx                       # Store services listing
│       │
│       ├── reservation/                   # Reservation flow
│       │   ├── page.tsx                   # Cart page with date/time selection
│       │   └── [id]/                      # Dynamic reservation ID
│       │       └── page.tsx               # Confirmation page
│       │
│       ├── checkout/                      # Checkout flow
│       │   └── page.tsx                   # Customer info & final checkout
│       │
│       └── dashboard/                     # Store owner dashboard
│           ├── layout.tsx                 # Dashboard layout with auth check
│           ├── page.tsx                   # Dashboard overview with stats
│           │
│           ├── login/                     # Authentication
│           │   └── page.tsx               # Login page
│           │
│           ├── signup/                    # Registration
│           │   └── page.tsx               # Signup page (whitelist check)
│           │
│           ├── reservations/              # Manage bookings
│           │   └── page.tsx               # View/cancel reservations
│           │
│           ├── services/                  # Manage services
│           │   └── page.tsx               # Add/edit/delete services
│           │
│           └── settings/                  # Store settings
│               └── page.tsx               # Whitelist, blocked dates, theme
│
├── components/                            # React components
│   │
│   ├── ui/                                # Reusable UI components
│   │   ├── Button.tsx                     # Button with variants
│   │   ├── Input.tsx                      # Input & Textarea components
│   │   ├── Card.tsx                       # Card components
│   │   ├── Loading.tsx                    # Loading spinner
│   │   └── Modal.tsx                      # Modal dialog
│   │
│   ├── dashboard/                         # Dashboard-specific components
│   │   └── DashboardNav.tsx               # Dashboard navigation bar
│   │
│   ├── store/                             # Store-specific components
│   │   ├── StoreNav.tsx                   # Public store navigation
│   │   └── StoreServicesClient.tsx        # Services grid with filtering
│   │
│   ├── ServiceCard.tsx                    # Service display card
│   ├── ReservationCard.tsx                # Reservation display card
│   ├── ThemeToggle.tsx                    # Dark/light mode toggle
│   └── ThemeProvider.tsx                  # Client-side theme initialization
│
├── lib/                                   # Utility libraries
│   └── supabase/
│       ├── client.ts                      # Browser Supabase client
│       ├── server.ts                      # Server Supabase client
│       └── utils.ts                       # Date/time utilities (Greek TZ)
│
├── store/                                 # Zustand state management
│   ├── useCartStore.ts                    # Cart with localStorage
│   └── useThemeStore.ts                   # Theme preferences
│
├── types/                                 # TypeScript definitions
│   ├── index.ts                           # App-wide types
│   └── supabase.ts                        # Supabase database types
│
├── supabase/                              # Supabase configuration
│   └── schema.sql                         # Database schema with RLS
│
├── middleware.ts                          # Auth middleware for protected routes
├── tailwind.config.ts                     # Tailwind configuration
├── tsconfig.json                          # TypeScript configuration
├── next.config.js                         # Next.js configuration
├── postcss.config.js                      # PostCSS configuration
├── package.json                           # Dependencies
├── .env.local.example                     # Environment variables template
├── .gitignore                             # Git ignore rules
├── README.md                              # Project documentation
└── FOLDER_STRUCTURE.md                    # This file
```

## Key Directories Explained

### `/app` - Next.js App Router
Uses the new App Router architecture with nested layouts and server components by default.

**Dynamic Routes:**
- `[storeName]` - Store name parameter for multi-tenant support
- `[id]` - Reservation ID for confirmation pages

**Route Groups:**
- Public routes: Store pages, services, reservation flow
- Protected routes: Dashboard pages (require authentication)

### `/components` - React Components
Organized by functionality and reusability:

**UI Components** (`/ui`):
- Fully reusable across the app
- No business logic
- Accept props for customization

**Feature Components**:
- Dashboard components for admin features
- Store components for public-facing features
- Business logic integrated

### `/lib` - Utilities & Helpers
Supabase clients and helper functions:
- `client.ts` - For client components
- `server.ts` - For server components and API routes
- `utils.ts` - Greek timezone handling with Luxon

### `/store` - State Management
Zustand stores with persistence:
- **Cart Store**: Services, date/time, localStorage sync
- **Theme Store**: Dark mode, custom colors, preferences

### `/types` - TypeScript Types
Centralized type definitions:
- Application models (User, Store, Service, Reservation)
- Supabase database types (auto-generated)

### `/supabase` - Database
SQL schema with:
- Table definitions
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automation

## File Naming Conventions

- **Components**: PascalCase (e.g., `ServiceCard.tsx`)
- **Pages**: lowercase (e.g., `page.tsx`)
- **Utilities**: camelCase (e.g., `utils.ts`)
- **Types**: PascalCase interfaces (e.g., `User`, `Service`)

## Import Aliases

Configured in `tsconfig.json`:
```typescript
{
  "@/*": ["./*"]
}
```

Usage:
```typescript
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/store/useCartStore';
import type { Service } from '@/types';
```

## Route Structure

```
Public Routes:
├── /                                    # Landing page
├── /[storeName]                         # Store services
├── /[storeName]/reservation             # Cart & booking
├── /[storeName]/checkout                # Checkout
└── /[storeName]/reservation/[id]        # Confirmation

Protected Routes (require auth):
├── /[storeName]/dashboard               # Overview
├── /[storeName]/dashboard/reservations  # Manage bookings
├── /[storeName]/dashboard/services      # Manage services
└── /[storeName]/dashboard/settings      # Store settings

Auth Routes:
├── /[storeName]/dashboard/login         # Login
└── /[storeName]/dashboard/signup        # Signup
```

## Component Hierarchy

```
RootLayout (app/layout.tsx)
└── ThemeProvider
    └── StoreLayout (app/[storeName]/layout.tsx)
        └── StoreNav
            └── ThemeToggle
            └── Cart Icon
        └── Page Content
            └── StoreServicesClient
                └── ServiceCard[]
            └── Reservation Flow
            └── Checkout

DashboardLayout (app/[storeName]/dashboard/layout.tsx)
└── DashboardNav
    └── ThemeToggle
└── Dashboard Pages
    └── ReservationCard[]
    └── ServiceCard[]
    └── Settings Forms
```

## Data Flow

1. **Server Components** fetch data from Supabase
2. **Client Components** handle user interactions
3. **Zustand Stores** manage client-side state
4. **LocalStorage** persists cart and theme
5. **Middleware** protects routes and handles auth

## Best Practices

- Server Components by default (better performance)
- Client Components only when needed ('use client')
- Zustand for complex state (cart, theme)
- React state for local UI state (forms, modals)
- Supabase RLS for data security
- TypeScript for type safety
