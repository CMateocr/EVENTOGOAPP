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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { User } from 'lucide-react';

const profileFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  role: z.enum(['Admin', 'User']),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Style object for inputs and other form elements for dark theme
const darkInputStyles = {
  backgroundColor: '#1a1a1a',
  border: '1px solid #444',
  color: 'white',
  borderRadius: '0.5rem',
};

export default function ProfilePage() {
  const { user, token, setToken, loading } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const handleImageSave = async (base64Img: string) => {
    if (!user?.email) return;

    try {
        // Llamamos a la acción del servidor
        const result = await updateUserImage(user.email, base64Img);
        
        if (result.success && result.token) {
            // MAGIC MOMENT: Actualizamos la sesión en vivo con el nuevo token
            setToken(result.token); 
            
            // Notificación de éxito
            toast({ title: "Foto actualizada", description: "Tu perfil se ha refrescado." });
        } else {
            toast({ title: "Error", description: result.error || "Intenta de nuevo", variant: "destructive" });
        }
    } catch (e) {
        console.error(e);
        toast({ title: "Error de conexión", variant: "destructive" });
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
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-2xl font-bold">
          <User className="animate-pulse" />
          <span>Cargando perfil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-yellow-500 selection:text-black">
      <main id="profile" className="container mx-auto px-4 py-16">
        <div className="flex items-end justify-between mb-10 border-b border-white/10 pb-5">
            <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    Mi <span className="text-yellow-500">Perfil</span>
                </h2>
                <p className="text-gray-400 mt-2 text-base">Actualiza tu información personal y tus preferencias.</p>
            </div>
        </div>

        <div className="bg-[#151515] rounded-3xl border border-white/10 p-6 md:p-8 max-w-3xl mx-auto">
          <div className="mb-8 flex flex-col items-center">
            <ProfileImageUpload 
              currentImage={user?.image}
              onImageSelected={handleImageSave}
            />
          </div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-300 font-bold">Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Tu nombre" {...field} style={darkInputStyles} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormItem>
                <FormLabel className="text-gray-300 font-bold">Email</FormLabel>
                <Input value={user.email} disabled style={darkInputStyles} />
                <FormDescription className="text-gray-500 mt-2">Tu dirección de email no se puede cambiar.</FormDescription>
              </FormItem>

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-2xl border border-white/10 p-5 bg-[#1a1a1a]">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-bold text-white">Rol de Administrador</FormLabel>
                      <FormDescription className="text-gray-400">
                        Activa para tener acceso a la gestión de eventos.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value === 'Admin'}
                        onCheckedChange={(checked) => field.onChange(checked ? 'Admin' : 'User')}
                        className="data-[state=checked]:bg-yellow-500 data-[state=unchecked]:bg-gray-600"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isPending} className="w-full h-auto py-3 px-6 text-base rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] transition-all duration-300 border-none">
                {isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </form>
          </Form>
        </div>
      </main>

      <footer className="bg-black py-12 border-t border-white/10 mt-20">
          <div className="container mx-auto px-4 flex flex-col items-center">
              <h3 className="text-2xl font-black text-white mb-4 tracking-tighter">EVENT GO</h3>
              <div className="flex gap-6 text-gray-500 text-sm mb-8">
                  <a href="#" className="hover:text-yellow-500 transition-colors">Términos</a>
                  <a href="#" className="hover:text-yellow-500 transition-colors">Privacidad</a>
                  <a href="#" className="hover:text-yellow-500 transition-colors">Soporte</a>
              </div>
              <p className="text-gray-600 text-xs">&copy; 2026 EVENT GO Inc. Todos los derechos reservados.</p>
          </div>
      </footer>
    </div>
  );
}
