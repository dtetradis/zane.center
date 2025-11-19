# Quick Setup Guide

Follow these steps to get Zane Center up and running.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier is fine)
- Git (optional)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

#### 2.1 Create a New Project
1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in the details and wait for the project to be created

#### 2.2 Run the Database Schema
1. In your Supabase project, go to the **SQL Editor**
2. Create a new query
3. Copy the entire contents of `supabase/schema.sql`
4. Paste and click "Run"
5. You should see success messages

#### 2.3 Add Sample Data (Optional)
1. In the SQL Editor, create another new query
2. Copy the contents of `supabase/sample-data.sql`
3. Paste and click "Run"
4. This creates a demo store with sample services

### 3. Configure Environment Variables

#### 3.1 Get Your Supabase Credentials
1. In Supabase, go to **Project Settings** → **API**
2. Copy the **Project URL** (looks like `https://xxxxx.supabase.co`)
3. Copy the **anon/public** key

#### 3.2 Create .env.local File
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Start the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## First Steps

### Access the Demo Store

1. Navigate to [http://localhost:3000/demo](http://localhost:3000/demo)
2. You'll see the demo store with sample services
3. Try adding services to cart and making a reservation

### Create a Store Owner Account

1. Go to [http://localhost:3000/demo/dashboard/signup](http://localhost:3000/demo/dashboard/signup)
2. Use one of the whitelisted emails:
   - `demo@example.com`
   - `owner@example.com`
3. Create a password (min 6 characters)
4. You'll be redirected to the dashboard

### Update User Role to Owner

After signing up, you need to make yourself an owner:

1. Go to Supabase → **Table Editor** → **users**
2. Find your newly created user
3. Click edit and change:
   - `role` to `owner`
   - `id_store` to the demo store's ID
4. Save

Now you have full access to the dashboard!

## Creating Your Own Store

### Option 1: Using SQL

Run this in Supabase SQL Editor (replace values):

```sql
INSERT INTO stores (store_name, title, address, work_days, categories, whitelist)
VALUES (
  'my-store',                              -- URL-friendly name (no spaces)
  'My Beauty Salon',                       -- Display name
  'Your Address Here',
  '[
    {"day": "Monday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Tuesday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Wednesday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Thursday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Friday", "startTime": "09:00", "endTime": "18:00", "enabled": true},
    {"day": "Saturday", "startTime": "10:00", "endTime": "16:00", "enabled": true},
    {"day": "Sunday", "startTime": "00:00", "endTime": "00:00", "enabled": false}
  ]'::jsonb,
  ARRAY['Category1', 'Category2'],         -- Your service categories
  ARRAY['your-email@example.com']          -- Your email for signup
);
```

### Option 2: Using Supabase Table Editor

1. Go to **Table Editor** → **stores**
2. Click **Insert** → **Insert row**
3. Fill in the fields manually

## Common Tasks

### Add Services

1. Login to dashboard
2. Go to **Services** tab
3. Click **Add Service**
4. Fill in the form and save

### Manage Reservations

1. Go to **Reservations** tab
2. View all bookings
3. Search by name, email, or phone
4. Cancel if needed

### Customize Theme

1. Go to **Settings** tab
2. Scroll to **Theme Colors**
3. Pick your brand colors
4. Click **Save Settings**

### Block Dates

1. Go to **Settings** tab
2. Under **Blocked Dates**
3. Select dates when you're closed
4. Click **Block Date**

### Whitelist Emails

1. Go to **Settings** tab
2. Under **Email Whitelist**
3. Add employee emails
4. They can now sign up

## Troubleshooting

### "Store not found" error
- Make sure the store exists in the database
- Check the URL matches the `store_name` in the database

### Can't login
- Verify email is in the whitelist
- Check password is at least 6 characters
- Look for error messages in the browser console

### Reservations not showing
- Check user has correct `id_store` in users table
- Verify RLS policies are enabled
- Check browser console for errors

### Theme not applying
- Clear browser cache
- Check localStorage in DevTools
- Verify theme_colors in store settings

## Next Steps

1. **Add Your Services**: Populate the services for your store
2. **Customize Theme**: Match your brand colors
3. **Test Booking Flow**: Make a test reservation
4. **Deploy**: Push to Vercel/Netlify when ready

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review [FOLDER_STRUCTURE.md](FOLDER_STRUCTURE.md) to understand the codebase
- Open an issue on GitHub for bugs

## Production Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy!

### Other Platforms

Works on any platform that supports Next.js:
- Netlify
- Railway
- Render
- AWS Amplify

Make sure to:
- Set environment variables
- Enable Node.js 18+
- Configure build command: `npm run build`
- Configure start command: `npm start`

Enjoy using Zane Center!
