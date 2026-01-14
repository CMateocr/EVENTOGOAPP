'use client';
import Link from 'next/link';
import { useSession } from '@/hooks/use-session';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlusCircle, MoreHorizontal, Database, Loader, Ticket } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { deleteEvent, seedDatabase, getEventsAction } from '@/lib/actions';
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useTransition } from 'react';
import { Event } from '@/lib/types';


function DeleteEventButton({ eventId }: { eventId: string }) {
  const { token } = useSession();
  const { toast } = useToast();
  const deleteEventWithId = async () => {
     try {
      await deleteEvent(eventId, token);
      toast({
        title: 'Evento Eliminado',
        description: 'El evento ha sido eliminado exitosamente.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: (error as Error).message || 'No se pudo eliminar el evento.',
      });
    }
  }
  return (
    <button onClick={deleteEventWithId} className="w-full text-left text-red-400 hover:text-red-300 transition-colors font-medium">
      Eliminar
    </button>
  );
}

function SeedDatabaseButton() {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSeed = () => {
    startTransition(async () => {
      const result = await seedDatabase();
      if (result.success) {
        toast({
          title: "Base de Datos Sembrada",
          description: "Los eventos y usuarios de ejemplo han sido creados."
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error en la Siembra",
          description: result.message
        });
      }
    });
  }

  return (
      <Button 
        onClick={handleSeed} 
        disabled={isPending}
        className="h-auto py-2 px-4 text-sm rounded-lg border border-white/20 text-white hover:bg-white/10 hover:border-yellow-500/50 font-bold backdrop-blur-sm bg-black/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Database className="mr-2 h-4 w-4" />
        {isPending ? 'Sembrando...' : 'Sembrar Base de Datos'}
      </Button>
  );
}


export default function AdminEventsPage() {
  const { user, token, loading } = useSession();
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!loading && user?.role !== 'Admin') {
      redirect('/');
    }
  }, [user, loading]);
  
  useEffect(() => {
    if (user?.role === 'Admin') {
      startTransition(async () => {
          try {
              const fetchedEvents = await getEventsAction(true, user.id); // include past events, filtered by user
              setEvents(fetchedEvents);
          } catch(e) {
              toast({
                variant: 'destructive',
                title: 'Error al cargar eventos',
                description: 'No se pudo conectar a la base de datos. Intenta sembrar la base de datos o verifica tu conexión.'
              })
          }
      });
    }
  }, [user, toast]);

  if (loading || !user) {
    return <div>Loading...</div>
  }


  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-5xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-2">
              Gestión de <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600">Eventos</span>
            </h1>
            <p className="text-gray-400 text-lg font-light">
              Crea, edita y gestiona tus eventos.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <SeedDatabaseButton />
            <Button asChild className="h-auto py-3 px-6 text-base rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] hover:scale-105 transition-all duration-300 border-none group">
              <Link href="/admin/events/edit" className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform" />
                Crear Evento
              </Link>
            </Button>
          </div>
        </div>

        {isPending ? (
          <div className="flex items-center justify-center py-32 bg-[#151515] rounded-3xl border border-white/10">
            <div className="flex items-center gap-3 text-xl font-bold text-gray-400">
              <Loader className="animate-spin" />
              <span>Cargando eventos...</span>
            </div>
          </div>
        ) : events.length > 0 ? (
          <div className="space-y-4">
            <div className="bg-[#151515] rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-sm">Evento</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-sm">Fecha</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-sm">Ubicación</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-sm text-right">Capacidad</TableHead>
                    <TableHead className="text-gray-400 font-bold uppercase tracking-wider text-sm">
                      <span className="sr-only">Acciones</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow key={event.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-semibold text-white py-4">{event.name}</TableCell>
                      <TableCell className="text-gray-300 py-4">
                        {format(new Date(event.date), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell className="text-gray-300 py-4">{event.location.name}</TableCell>
                      <TableCell className="text-right text-gray-300 py-4 font-semibold">
                        {event.capacity.toLocaleString()}
                      </TableCell>
                      <TableCell className="py-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost" className="hover:bg-white/10 hover:text-yellow-500 transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Menú de opciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1a1a1a] border-white/10 text-white">
                            <DropdownMenuLabel className="text-gray-400">Acciones</DropdownMenuLabel>
                            <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer focus:bg-white/10">
                              <Link href={`/admin/events/edit?id=${event.id}`}>
                                Editar
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild className="hover:bg-white/10 cursor-pointer focus:bg-white/10">
                               <Link href={`/events/${event.id}`}>Ver</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive hover:bg-red-500/20 cursor-pointer focus:bg-red-500/20">
                              <DeleteEventButton eventId={event.id} />
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 bg-[#151515] rounded-3xl border border-dashed border-white/10">
            <div className="bg-white/5 p-6 rounded-full mb-6">
              <Ticket className="w-12 h-12 text-gray-500" />
            </div>
            <p className="text-gray-300 text-2xl font-bold mb-2">Aún no has creado eventos</p>
            <p className="text-gray-500 mb-8">Comienza a crear tu primer evento ahora.</p>
            <Button asChild className="h-auto py-3 px-8 text-base rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] hover:scale-105 transition-all duration-300 border-none">
              <Link href="/admin/events/edit">
                <PlusCircle className="mr-2 h-5 w-5" />
                Crear Primer Evento
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
