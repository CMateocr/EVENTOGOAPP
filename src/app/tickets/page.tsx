'use client';

import { useEffect, useState } from 'react';
import { useSession } from '@/hooks/use-session';
import { getMyTicketsAction } from '@/lib/new-actions';
import Link from 'next/link';
import { Ticket, Calendar, MapPin, QrCode, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getEventImage(event: any) {
  if (event.images && event.images.length > 0) return event.images[0];
  if (event.image && (event.image.startsWith('http') || event.image.startsWith('data:'))) return event.image;
  return 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800';
}

export default function MyTicketsPage() {
  // CAMBIO AQUÍ: Usamos 'user' en lugar de 'session'
  const { token, user } = useSession(); 
  const [loading, setLoading] = useState(true);
  const [myEvents, setMyEvents] = useState<any[]>([]);
  
  useEffect(() => {
    async function loadTickets() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const result = await getMyTicketsAction(token);
        if (result.success) {
          setMyEvents(result.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    // CAMBIO AQUÍ: Verificamos 'user' en lugar de 'session'
    if (user !== undefined) {
        loadTickets();
    }
  }, [token, user]);

  if (loading || user === undefined) {
      return (
          <div className="min-h-screen bg-[#050505] flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-yellow-500 animate-spin" />
          </div>
      );
  }

  // CAMBIO AQUÍ: Verificamos 'user'
  if (!user) {
    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6 animate-in fade-in">
            <div className="bg-[#111] p-8 rounded-2xl border border-white/10 text-center max-w-md w-full">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8 text-yellow-500" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Mis Tickets</h1>
                <p className="text-gray-400 mb-6">Inicia sesión para ver tus entradas compradas.</p>
                <Link href="/login">
                    <Button className="w-full bg-yellow-500 text-black font-bold hover:bg-yellow-400">
                        Iniciar Sesión
                    </Button>
                </Link>
            </div>
        </div>
    );
  }

  // ... (El resto del renderizado es igual) ...
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-black mb-10 flex items-center gap-4 border-b border-white/10 pb-6">
                <Ticket className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" /> MIS TICKETS
            </h1>

            {myEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[#111] rounded-2xl border border-dashed border-white/10 animate-in zoom-in-95">
                    <AlertCircle className="w-12 h-12 text-gray-600 mb-4" />
                    <p className="text-gray-400 text-xl mb-6 font-bold">Aún no tienes entradas.</p>
                    <Link href="/">
                        <Button variant="outline" className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                            Explorar Eventos
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {myEvents.map((item) => {
                        const event = item.eventDetails;
                        if (!event) return null;

                        const imageUrl = getEventImage(event);

                        return (
                            <div key={item.eventId} className="bg-[#111] rounded-2xl overflow-hidden border border-white/10 flex flex-col md:flex-row hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg group animate-in slide-in-from-bottom-4">
                                <div className="md:w-56 h-48 md:h-auto relative border-b md:border-b-0 md:border-r border-dashed border-white/20">
                                    <img src={imageUrl} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                    <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#050505] rounded-full"></div>
                                    <div className="absolute top-1/2 -right-3 md:hidden w-6 h-6 bg-[#050505] rounded-full"></div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-xl md:text-2xl font-bold text-white line-clamp-1">{event.name}</h2>
                                            <span className="bg-yellow-500 text-black font-black px-3 py-1 rounded text-xs uppercase tracking-wider shadow-lg transform rotate-2">
                                                {item.count} {item.count === 1 ? 'Entrada' : 'Entradas'}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-400 text-sm mt-3">
                                            <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg">
                                                <Calendar className="w-4 h-4 text-yellow-500" />
                                                {new Date(event.date).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric', month: 'long' })}
                                            </div>
                                            <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg">
                                                <MapPin className="w-4 h-4 text-yellow-500" />
                                                <span className="truncate">{event.location?.name}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-dashed border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                                        <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
                                            ID: {item.tickets[0]._id ? item.tickets[0]._id.slice(-8) : 'CONFIRMADO'}
                                        </p>
                                        <Button className="w-full sm:w-auto bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 hover:border-yellow-500/50">
                                            <QrCode className="w-4 h-4 mr-2 text-yellow-500" /> 
                                            Ver Código QR
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    </div>
  );
}