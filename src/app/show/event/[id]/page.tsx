import { getEventById } from '@/lib/data'; // <--- IMPORTAMOS TU FUNCIÓN
import { notFound } from 'next/navigation';
import { TicketIcon, CalendarIcon, MapPinIcon } from 'lucide-react'; // Instala lucide-react si no lo tienes, o usa svg

export default async function EventDetail({ params }: { params: { id: string } }) {
  const event = await getEventById(params.id);

  if (!event) return notFound();

  // Lógica de imagen: Usar la primera de la galería nueva, o fallback a la antigua
  const getEventImage = (event: any) => {
    if (event.images && event.images.length > 0) return event.images[0];
    if (event.image) {
      if (event.image.startsWith('http') || event.image.startsWith('data:')) return event.image;
      if (event.image.includes('concert') || event.image.includes('music')) return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800';
      if (event.image.includes('conf') || event.image.includes('tech')) return 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800';
      if (event.image.includes('art') || event.image.includes('exhib')) return 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=800';
      if (event.image.includes('food')) return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800';
    }
    return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800';
  };
  const posterImage = getEventImage(event);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans">
      {/* Fondo Blur */}
      <div className="fixed inset-0 z-0">
         <img src={posterImage} className="w-full h-full object-cover blur-3xl opacity-20 scale-110" alt="bg" />
         <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/80 to-transparent" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-10">
        
        {/* Botón Volver */}
        <a href="/show" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
            ← Volver a la cartelera
        </a>

        <div className="flex flex-col md:flex-row gap-10 lg:gap-16">
            {/* Columna Izquierda: Poster */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                <div className="rounded-xl overflow-hidden shadow-2xl border border-gray-800 sticky top-8">
                    <img src={posterImage} alt={event.name} className="w-full h-auto" />
                </div>
            </div>

            {/* Columna Derecha: Detalles */}
            <div className="flex-1 space-y-8">
                <div>
                    <span className="bg-yellow-500 text-black font-bold text-xs px-2 py-1 rounded uppercase tracking-wider">
                        Evento
                    </span>
                    <h1 className="text-4xl md:text-6xl font-black mt-4 mb-2 leading-none uppercase">
                        {event.name}
                    </h1>
                    <p className="text-xl text-gray-300 font-light">{event.location?.name}</p>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center gap-4">
                        <CalendarIcon className="text-yellow-400 w-8 h-8" />
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Fecha</p>
                            <p className="text-lg font-bold">{new Date(event.date).toLocaleDateString('es-EC', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              timeZone: 'America/Guayaquil'
                            })}</p>
                        </div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-lg border border-white/10 flex items-center gap-4">
                        <MapPinIcon className="text-yellow-400 w-8 h-8" />
                        <div>
                            <p className="text-xs text-gray-400 uppercase font-bold">Lugar</p>
                            <p className="text-lg font-bold">{event.location?.name}</p>
                        </div>
                    </div>
                </div>

                {/* Descripción */}
                <div className="prose prose-invert max-w-none">
                    <h3 className="text-2xl font-bold text-yellow-400">Sinopsis</h3>
                    <p className="text-gray-300 leading-relaxed text-lg">{event.description}</p>
                </div>

                {/* Tipos de Tickets */}
                <div className="bg-[#1a1a1a] p-6 rounded-2xl border border-gray-800">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <TicketIcon className="w-6 h-6 text-yellow-400" />
                        Localidades Disponibles
                    </h3>
                    <div className="space-y-3">
                        {event.ticketTypes.map((ticket) => (
                            <div key={ticket.id} className="flex justify-between items-center p-3 bg-black/40 rounded-lg hover:bg-black/60 transition-colors border border-gray-700 hover:border-yellow-500/50 cursor-pointer group">
                                <span className="font-bold text-gray-200 group-hover:text-yellow-400 transition-colors">
                                    {ticket.name}
                                </span>
                                <span className="text-xl font-black text-white">
                                    ${ticket.price}
                                </span>
                            </div>
                        ))}
                    </div>
                    <button className="w-full mt-6 bg-yellow-500 hover:bg-yellow-400 text-black font-black py-4 rounded-xl text-lg transition-transform active:scale-95 shadow-lg shadow-yellow-500/20">
                        COMPRAR AHORA
                    </button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}