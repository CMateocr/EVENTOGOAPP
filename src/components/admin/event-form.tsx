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
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{event ? 'Edit Event' : 'Create New Event'}</CardTitle>
                <CardDescription>Fill in the details for your event below.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Event Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Summer Music Festival" {...field} />
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
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="A detailed description of the event..." rows={5} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ticket Types</CardTitle>
                <CardDescription>Define the tickets available for this event.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 {fields.map((field, index) => (
                    <div key={field.id} className="flex gap-4 items-end p-4 border rounded-md">
                        <FormField
                            control={form.control}
                            name={`ticketTypes.${index}.name`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                <FormLabel>Type Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="General Admission" {...field} />
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
                                <FormLabel>Price ($)</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="25.00" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                            <Trash className="h-4 w-4" />
                        </Button>
                    </div>
                 ))}
                 <Button type="button" variant="outline" size="sm" onClick={() => append({ id: crypto.randomUUID(), name: '', price: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Ticket Type
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
            <Card>
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
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
                      <FormLabel>Event Image</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an image" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PlaceHolderImages.map(img => (
                            <SelectItem key={img.id} value={img.id}>{img.description}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="my-4 border p-4 rounded-md bg-zinc-50 border-dashed border-zinc-300">
                  <label className="block text-sm font-bold mb-2 text-zinc-700">📸 Galería de Fotos (Carteles)</label>
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
                      <FormLabel>Capacity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Location</CardTitle>
                    <CardDescription>Click on the map to set the event location.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <FormField
                    control={form.control}
                    name="locationName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Location Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g. Quito Convention Center" {...field} />
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
                                <FormLabel>Latitude</FormLabel>
                                <FormControl>
                                    <Input type="number" step="any" {...field} readOnly />
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
                                <FormLabel>Longitude</FormLabel>
                                <FormControl>
                                    <Input type="number" step="any" {...field} readOnly />
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

        <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => router.push('/admin/events')}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
                {isPending ? (event ? 'Saving...' : 'Creating...') : (event ? 'Save Changes' : 'Create Event')}
            </Button>
        </div>
      </form>
    </Form>
  );
}
