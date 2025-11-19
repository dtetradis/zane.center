'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function SignupPage({ params }: { params: Promise<{ storeName: string }> | { storeName: string } }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [storeName, setStoreName] = useState('');
  const router = useRouter();
  const supabase = createClient();

  // Handle params (could be Promise in newer Next.js)
  useEffect(() => {
    Promise.resolve(params).then((resolvedParams) => {
      setStoreName(resolvedParams.storeName);
    });
  }, [params]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // First, check if store exists and if email is whitelisted
      const { data: store, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('store_name', storeName)
        .single();

      if (storeError || !store) {
        throw new Error('Store not found');
      }

      // Check if email is whitelisted
      if (!store.whitelist.includes(email)) {
        throw new Error('Your email is not whitelisted for this store. Please contact the store owner.');
      }

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      // Update user profile
      if (authData.user) {
        const { error: updateError } = await supabase
          .from('users')
          .update({
            phone,
            id_store: store.id,
            store_name: store.store_name,
            role: 'employee',
          })
          .eq('id', authData.user.id);

        if (updateError) throw updateError;
      }

      router.push(`/${storeName}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Sign up to manage {storeName}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {error}
              </div>
            )}

            <Input
              type="email"
              label="Email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              helperText="Must be whitelisted by store owner"
            />

            <Input
              type="tel"
              label="Phone"
              placeholder="+30 123 456 7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              helperText="At least 6 characters"
            />

            <Input
              type="password"
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth isLoading={loading}>
              Sign Up
            </Button>

            <div className="text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link
                href={`/${storeName}/dashboard/login`}
                className="text-primary hover:underline"
              >
                Sign in
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
