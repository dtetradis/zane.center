'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function LoginPage({ params }: { params: Promise<{ storeName: string }> | { storeName: string } }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      // Check if user has access to this store
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*, stores!inner(*)')
        .eq('id', data.user.id)
        .single();

      if (userError) throw userError;

      // Verify user has access to this store
      if (userData.stores.store_name !== storeName) {
        await supabase.auth.signOut();
        throw new Error('You do not have access to this store');
      }

      router.push(`/${storeName}/dashboard`);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Welcome Back</CardTitle>
          <CardDescription>Sign in to manage {storeName}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
            />

            <Input
              type="password"
              label="Password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" fullWidth isLoading={loading}>
              Sign In
            </Button>

            <div className="text-center text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link
                href={`/${storeName}/dashboard/signup`}
                className="text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
