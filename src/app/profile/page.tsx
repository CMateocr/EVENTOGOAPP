'use client';

import { useSession } from '@/hooks/use-session';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { updateUserProfile } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { useEffect, useState } from 'react';
import { ProfileImageUpload } from '@/components/profile-image-upload';
import { updateUserImage } from '@/lib/new-actions';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  role: z.enum(['Admin', 'User']),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfilePage() {
  const { user, token, setToken, loading } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const handleImageSave = async (base64Img: string) => {
    if (user?.email) {
      await updateUserImage(user.email, base64Img);
      window.location.reload();
    }
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: user?.name || '',
      role: user?.role || 'User',
    },
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    // Reset form when user data is loaded
    if (user) {
      form.reset({
        name: user.name,
        role: user.role,
      });
    }
  }, [user, loading, router, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    setIsPending(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('role', data.role);

    const result = await updateUserProfile(formData, token);

    if (result.success && result.token) {
      setToken(result.token);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: result.message,
      });
    }
    setIsPending(false);
  };

  if (loading || !user) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">My Profile</CardTitle>
          <CardDescription>Update your personal information and role.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-8 flex flex-col items-center">
            <ProfileImageUpload 
              currentImage={user?.image}
              onImageSelected={handleImageSave}
            />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input value={user.email} disabled />
                <FormDescription>Your email address cannot be changed.</FormDescription>
              </FormItem>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Administrator Role</FormLabel>
                      <FormDescription>
                        Enable to get access to event management features.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'Admin'}
                        onCheckedChange={(checked) => field.onChange(checked ? 'Admin' : 'User')}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending}>
                {isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
