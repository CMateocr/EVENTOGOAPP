'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { createEvent, updateEvent } from '@/lib/actions';
import { Event } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/hooks/use-session';
import { EventGalleryUpload } from '@/components/admin/event-gallery-upload';
import { createEventWithGallery, updateEventWithGallery } from '@/lib/new-actions';
import EventTypeConfig, { EventTypeConfig as EventTypeConfigType } from './event-type-config';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash, PlusCircle } from 'lucide-react';
import LocationPickerLoader from './location-picker-loader';

const eventFormSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters.'),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  date: z.string(),
  locationName: z.string().min(3, 'Location name is required.'),
  locationLat: z.coerce.number().min(-90).max(90),
  locationLng: z.coerce.number().min(-180).max(180),
  capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1.'),
  image: z.string().min(1, 'Image placeholder is required.'),
  ticketTypes: z.array(z.object({
    id: z.string().optional(),
    name: z.string().min(1, 'Ticket type name is required.'),
    price: z.coerce.number().min(0, 'Price must be non-negative.'),
  })).min(1, 'At least one ticket type is required.'),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function EventForm({ event }: { event: Event | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const { token } = useSession();
  const [isPending, setIsPending] = useState(false);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  const [eventTypeConfig, setEventTypeConfig] = useState<EventTypeConfigType | undefined>(
    event?.eventTypeConfig ? (event.eventTypeConfig as EventTypeConfigType) : undefined
  );

  // Actualizar eventTypeConfig cuando cambie el evento (útil para edición)
  useEffect(() => {
    if (event?.eventTypeConfig) {
      setEventTypeConfig(event.eventTypeConfig as EventTypeConfigType);
    } else if (!event) {
      // Resetear cuando no hay evento (modo creación)
      setEventTypeConfig(undefined);
    }
  }, [event]);

  // Memoizar el callback para evitar recreaciones innecesarias
  const handleEventTypeConfigChange = useCallback((config: EventTypeConfigType) => {
    setEventTypeConfig(config);
  }, []);

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: event?.name || '',
      description: event?.description || '',
      date: event ? format(new Date(event.date), "yyyy-MM-dd'T'HH:mm") : '',
      locationName: event?.location.name || '',
      locationLat: event?.location.lat || -0.180653,
      locationLng: event?.location.lng || -78.467834,
      capacity: event?.capacity || 100,
      image: event?.image || '',
      ticketTypes: event?.ticketTypes || [{ id: crypto.randomUUID(), name: 'General Admission', price: 10 }],
    },
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "ticketTypes"
  });

  const watchedLat = form.watch('locationLat');
  const watchedLng = form.watch('locationLng');

  async function onSubmit(data: EventFormValues) {
    setIsPending(true);
    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('date', data.date);
    formData.append('locationName', data.locationName);
    formData.append('locationLat', String(data.locationLat));
    formData.append('locationLng', String(data.locationLng));
    formData.append('capacity', String(data.capacity));
    formData.append('image', data.image);

    // Assign unique IDs to new ticket types
    const ticketTypesWithIds = data.ticketTypes.map(tt => ({
        ...tt,
        id: tt.id || `tt-${Date.now()}-${Math.random()}`
    }));

    formData.append('ticketTypes', JSON.stringify(ticketTypesWithIds));

    const result = event
      ? await updateEvent(event.id, formData, token)
      : await createEvent(formData, token);

    if (result && 'success' in result && !result.success) {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: result.message,
      });
    } else {
        toast({
            title: event ? 'Event Updated' : 'Event Created',
            description: `The event "${data.name}" has been saved successfully.`,
        });
    }
    
    setIsPending(false);
  }

  const handleNewSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      
      // LOGICA CONDICIONAL:
      // Si existe 'event' y tiene un ID, significa que estamos EDITANDO.
      if (event && event.id) {
          console.log("Modo Edición: Actualizando evento...", event.id);
          await updateEventWithGallery(event.id, formData, galleryImages, token);
      } else {
          // Si no hay evento, estamos CREANDO uno nuevo.
          console.log("Modo Creación: Generando nuevo evento...");
          await createEventWithGallery(formData, galleryImages, token);
      }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleNewSubmit} className="space-y-8">
        <div className="mb-8">
          <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-2">
            {event ? 'Editar' : 'Crear'} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600">Evento</span>
          </h1>
          <p className="text-gray-400 text-lg font-light">
            {event ? 'Actualiza los detalles de tu evento' : 'Completa los detalles para tu nuevo evento'}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-[#151515] border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-white">{event ? 'Información del Evento' : 'Nuevo Evento'}</CardTitle>
                <CardDescription className="text-gray-400">Completa los detalles básicos de tu evento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Nombre del Evento</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. Festival de Música de Verano" {...field} className="bg-[#0a0a0a] border-white/10 text-white placeholder-gray-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Descripción</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Descripción detallada del evento..." rows={5} {...field} className="bg-[#0a0a0a] border-white/10 text-white placeholder-gray-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="bg-[#151515] border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-white">Tipos de Entradas</CardTitle>
                <CardDescription className="text-gray-400">Define las entradas disponibles para este evento.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end p-4 border border-white/10 rounded-md bg-[#0a0a0a]">
                        <FormField
                            control={form.control}
                            name={`ticketTypes.${index}.name`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                <FormLabel className="text-gray-300">Nombre del Tipo</FormLabel>
                                <FormControl>
                                    <Input placeholder="Acceso General" {...field} className="bg-[#1a1a1a] border-white/10 text-white placeholder-gray-500" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`ticketTypes.${index}.price`}
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-gray-300">Precio ($)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="25.00" {...field} className="bg-[#1a1a1a] border-white/10 text-white placeholder-gray-500" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1} className="bg-red-600 hover:bg-red-700">
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                 ))}
                 <Button type="button" className="h-auto py-2 px-4 text-sm rounded-lg border border-white/20 text-white hover:bg-white/10 font-bold backdrop-blur-sm bg-black/30 transition-all duration-300" onClick={() => append({ id: crypto.randomUUID(), name: '', price: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Agregar Tipo de Entrada
                </Button>
              </CardContent>
            </Card>

            {/* Configuración del Tipo de Evento */}
            <EventTypeConfig
              value={eventTypeConfig}
              onChange={handleEventTypeConfigChange}
              defaultStartDate={form.watch('date') || format(new Date(), "yyyy-MM-dd'T'HH:mm")}
            />
          </div>

          <div className="space-y-6">
            <Card className="bg-[#151515] border-white/10 text-white">
              <CardHeader>
                <CardTitle className="text-white">Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Fecha y Hora</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} className="bg-[#0a0a0a] border-white/10 text-white [&::-webkit-calendar-picker-indicator]:invert" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Imagen del Evento</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-[#0a0a0a] border-white/10 text-white">
                            <SelectValue placeholder="Selecciona una imagen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#151515] border-white/10 text-white">
                          {PlaceHolderImages.map(img => (
                            <SelectItem key={img.id} value={img.id} className="hover:bg-white/10">{img.description}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="my-4 border border-white/20 p-4 rounded-md bg-[#0a0a0a] border-dashed">
                  <label className="block text-sm font-bold mb-2 text-gray-300">📸 Galería de Fotos (Pósters)</label>
                  <EventGalleryUpload 
                    onImagesChanged={setGalleryImages}
                    initialImages={event?.images || []} 
                  />
                </div>

                 <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Capacidad</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} className="bg-[#0a0a0a] border-white/10 text-white placeholder-gray-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
             <Card className="bg-[#151515] border-white/10 text-white">
                <CardHeader>
                    <CardTitle className="text-white">Ubicación</CardTitle>
                    <CardDescription className="text-gray-400">Haz clic en el mapa para establecer la ubicación del evento.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                    control={form.control}
                    name="locationName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel className="text-gray-300">Nombre de la Ubicación</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej. Centro de Convenciones de Quito" {...field} className="bg-[#0a0a0a] border-white/10 text-white placeholder-gray-500" />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <div className="h-64 w-full rounded-md overflow-hidden">
                        <LocationPickerLoader
                            position={{ lat: watchedLat, lng: watchedLng }}
                            onPositionChange={({ lat, lng }) => {
                                form.setValue('locationLat', lat);
                                form.setValue('locationLng', lng);
                            }}
                        />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                         <FormField
                            control={form.control}
                            name="locationLat"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-gray-300">Latitud</FormLabel>
                                <FormControl>
                                    <Input type="number" step="any" {...field} readOnly className="bg-[#0a0a0a] border-white/10 text-white" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="locationLng"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-gray-300">Longitud</FormLabel>
                                <FormControl>
                                    <Input type="number" step="any" {...field} readOnly className="bg-[#0a0a0a] border-white/10 text-white" />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* --- INPUTS OCULTOS OBLIGATORIOS --- */}
        
        {/* 1. IMAGEN PRINCIPAL (Prioridad a tu galería) */}
        <input 
          type="hidden" 
          name="image" 
          value={galleryImages.length > 0 ? galleryImages[0] : "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800"} 
        />

        {/* 2. TIPOS DE TICKETS (JSON String) */}
        <input 
          type="hidden" 
          name="ticketTypes" 
          value={JSON.stringify(form.watch('ticketTypes'))} 
        />

        {/* 3. UBICACIÓN (Si existe) */}
        {form.watch('locationName') && (
          <>
            <input type="hidden" name="locationName" value={form.watch('locationName')} />
            <input type="hidden" name="locationLat" value={form.watch('locationLat').toString()} />
            <input type="hidden" name="locationLng" value={form.watch('locationLng').toString()} />
          </>
        )}

        {/* 4. CONFIGURACIÓN DEL TIPO DE EVENTO */}
        {eventTypeConfig && (
          <input 
            type="hidden" 
            name="eventTypeConfig" 
            value={JSON.stringify(eventTypeConfig)} 
          />
        )}

        <div className="flex justify-end gap-3 pt-6 border-t border-white/10">
            <Button type="button" className="h-auto py-2 px-4 text-base rounded-lg border border-white/20 text-white hover:bg-white/10 font-bold backdrop-blur-sm bg-black/30 transition-all duration-300" onClick={() => router.push('/admin/events')}>Cancelar</Button>
            <Button type="submit" disabled={isPending} className="h-auto py-2 px-6 text-base rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] hover:scale-105 transition-all duration-300 border-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                {isPending ? (event ? 'Guardando...' : 'Creando...') : (event ? 'Guardar Cambios' : 'Crear Evento')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
