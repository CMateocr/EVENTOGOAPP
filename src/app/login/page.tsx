'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/actions';
import { useSession } from '@/hooks/use-session';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const { setToken, user, loading } = useSession();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!loading && user) {
      router.push('/show');
    }
  }, [user, loading, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const result = await login(formData);

    if (result?.success && result.token) {
      setToken(result.token);
      toast({
        title: 'Login successful!',
        description: 'Welcome back!',
      });
      router.push('/show'); // Redirect to /show on successful login
      router.refresh();
    } else {
      setError(result?.message || 'An unknown error occurred.');
    }
    
    setIsPending(false);
  };

  if (loading || user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-2xl font-bold">
          <Loader className="animate-spin" />
          <span>Loading session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>Enter your email below to login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="underline text-primary">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
