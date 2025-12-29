'use client';

import Link from 'next/link';
import { useState } from 'react';
import { register } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
    const [errors, setErrors] = useState<Record<string, string[] | undefined> | null>(null);
    const [isPending, setIsPending] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsPending(true);
        setErrors(null);

        const formData = new FormData(event.currentTarget);
        const result = await register(null, formData);

        if (result?.errors) {
            setErrors(result.errors);
        }

        setIsPending(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="mx-auto max-w-sm w-full">
            <CardHeader>
            <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
            <CardDescription>Enter your information to create an account</CardDescription>
            </CardHeader>
            <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" name="name" placeholder="Max Robinson" required />
                {errors?.name && <p className="text-sm text-destructive">{errors.name[0]}</p>}
                </div>
                <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                {errors?.email && <p className="text-sm text-destructive">{errors.email[0]}</p>}
                </div>
                <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
                {errors?.password && <p className="text-sm text-destructive">{errors.password[0]}</p>}
                </div>
                <Button className="w-full" type="submit" disabled={isPending}>
                    {isPending ? 'Creating Account...' : 'Create an account'}
                </Button>
            </form>
            <div className="mt-4 text-center text-sm">
                Already have an account?{' '}
                <Link href="/login" className="underline text-primary">
                Sign in
                </Link>
            </div>
            </CardContent>
        </Card>
        </div>
    );
}
