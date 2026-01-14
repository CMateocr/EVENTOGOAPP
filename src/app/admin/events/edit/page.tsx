'use client';

import { useSession } from '@/hooks/use-session';
import { notFound, redirect, useSearchParams } from 'next/navigation';
import EventForm from '@/components/admin/event-form';
import { useEffect, useState, useTransition } from 'react';
import { Event } from '@/lib/types';
import { getEventByIdAction } from '@/lib/actions';

export default function EditEventPage() {
  const { user, loading: sessionLoading } = useSession();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    if (!sessionLoading && user?.role !== 'Admin') {
      redirect('/');
    }
  }, [user, sessionLoading]);

  useEffect(() => {
    if (id) {
      startTransition(async () => {
        const eventData = await getEventByIdAction(id);
        if (!eventData) {
          notFound();
        } else {
          // Security check: only allow editing if the user is the creator
          if (user?.id !== eventData.createdBy) {
            redirect('/admin/events');
          }
          setEvent(eventData);
        }
      });
    }
  }, [id, user]);

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-2xl font-bold">
          <span>Cargando evento...</span>
        </div>
      </div>
    );
  }

   if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-bold text-red-400">Acceso Denegado</p>
        </div>
      </div>
    );
  }
  
  // If there's an ID but the event hasn't been loaded yet, show loading
  if (id && !event) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-2xl font-bold">
          <span>Cargando evento...</span>
        </div>
      </div>
    );
  }

  // If we have an id but the event fetch resulted in notFound (event will be null)
  if (id && event === null) {
      notFound();
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="container mx-auto px-4 py-12">
        <EventForm event={event} />
      </div>
    </div>
  );
}
