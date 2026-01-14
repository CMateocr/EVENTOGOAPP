import { getEvents } from '@/lib/data';
import Link from 'next/link';
import { Compass, MapPin } from 'lucide-react';

export const dynamic = 'force-dynamic';

// --- LOGICA DE IMAGEN COMPARTIDA ---
function getEventImage(event: any) {
  if (event.images && event.images.length > 0) return event.images[0];
  if (event.image && (event.image.startsWith('http') || event.image.startsWith('data:'))) return event.image;
  // Fallbacks
  if (event.image?.includes('concert')) return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800';
  return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800';
}

export default async function DiscoverPage() {
  const events = await getEvents(); // Trae TODOS los eventos sin filtrar

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans">

      {/* Header Discover */}
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-black text-white flex items-center gap-3 mb-2">
            <Compass className="w-10 h-10 text-yellow-500" />
            DISCOVER <span className="text-yellow-500">EVENT GO</span>
        </h1>
        <p className="text-gray-400">Explora todos los eventos disponibles cerca de ti.</p>
      </div>

      {/* Grid de Resultados */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event: any) => {
                const imageUrl = getEventImage(event);

                return (
                    <Link href={`/show/event/${event.id}`} key={event.id} className="group relative block overflow-hidden rounded-2xl bg-[#151515] hover:shadow-[0_0_30px_rgba(234,179,8,0.2)] transition-all duration-300 hover:-translate-y-1">
                        {/* Imagen Fondo */}
                        <div className="aspect-video w-full overflow-hidden">
                            <img
                                src={imageUrl}
                                alt={event.name}
                                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                            />
                        </div>

                        {/* Overlay Gradiente */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                        {/* Contenido */}
                        <div className="absolute bottom-0 left-0 p-6 w-full">
                            <span className="inline-block px-2 py-1 mb-2 text-[10px] font-bold uppercase tracking-wider text-black bg-yellow-500 rounded-sm">
                                {new Date(event.date).toLocaleDateString('es-EC', {
                                  timeZone: 'America/Guayaquil'
                                })}
                            </span>
                            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 group-hover:text-yellow-400 transition-colors">
                                {event.name}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-300">
                                <MapPin className="w-4 h-4 text-yellow-500" />
                                <span className="truncate">{event.location?.name}</span>
                            </div>
                        </div>
                    </Link>
                );
            })}

            {events.length === 0 && (
                <div className="col-span-full text-center py-20 text-gray-500">
                    No se encontraron eventos.
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
