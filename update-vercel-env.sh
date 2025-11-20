#!/bin/bash

echo "Updating Vercel environment variables..."

# Remove old variables
echo "Removing old NEXT_PUBLIC_SUPABASE_URL..."
vercel env rm NEXT_PUBLIC_SUPABASE_URL production --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_SUPABASE_URL preview --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_SUPABASE_URL development --yes 2>/dev/null || true

echo "Removing old NEXT_PUBLIC_SUPABASE_ANON_KEY..."
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY production --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY preview --yes 2>/dev/null || true
vercel env rm NEXT_PUBLIC_SUPABASE_ANON_KEY development --yes 2>/dev/null || true

echo "Removing old SUPABASE_SERVICE_ROLE_KEY..."
vercel env rm SUPABASE_SERVICE_ROLE_KEY production --yes 2>/dev/null || true
vercel env rm SUPABASE_SERVICE_ROLE_KEY preview --yes 2>/dev/null || true
vercel env rm SUPABASE_SERVICE_ROLE_KEY development --yes 2>/dev/null || true

# Add new variables
echo "Adding new NEXT_PUBLIC_SUPABASE_URL..."
echo "https://hhywaddenwmiktdtnxtz.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "https://hhywaddenwmiktdtnxtz.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL preview
echo "https://hhywaddenwmiktdtnxtz.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL development

echo "Adding new NEXT_PUBLIC_SUPABASE_ANON_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeXdhZGRlbndtaWt0ZHRueHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTA4MjEsImV4cCI6MjA3OTEyNjgyMX0.Sle1McJ5I7DhHxrZ31eDqIuXLHgeBwHfZKAgf2vL31w" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeXdhZGRlbndtaWt0ZHRueHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTA4MjEsImV4cCI6MjA3OTEyNjgyMX0.Sle1McJ5I7DhHxrZ31eDqIuXLHgeBwHfZKAgf2vL31w" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeXdhZGRlbndtaWt0ZHRueHR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTA4MjEsImV4cCI6MjA3OTEyNjgyMX0.Sle1McJ5I7DhHxrZ31eDqIuXLHgeBwHfZKAgf2vL31w" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development

echo "Adding new SUPABASE_SERVICE_ROLE_KEY..."
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeXdhZGRlbndtaWt0ZHRueHR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU1MDgyMSwiZXhwIjoyMDc5MTI2ODIxfQ._TGs-UQDzaCAvLj3__CU--sbNc1Yrv3brs2Lb-pKbKs" | vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeXdhZGRlbndtaWt0ZHRueHR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU1MDgyMSwiZXhwIjoyMDc5MTI2ODIxfQ._TGs-UQDzaCAvLj3__CU--sbNc1Yrv3brs2Lb-pKbKs" | vercel env add SUPABASE_SERVICE_ROLE_KEY preview
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoeXdhZGRlbndtaWt0ZHRueHR6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU1MDgyMSwiZXhwIjoyMDc5MTI2ODIxfQ._TGs-UQDzaCAvLj3__CU--sbNc1Yrv3brs2Lb-pKbKs" | vercel env add SUPABASE_SERVICE_ROLE_KEY development

echo "✅ Environment variables updated!"
echo "Run 'vercel --prod' to deploy with new variables"
