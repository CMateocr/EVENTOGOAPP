import { getEvents } from '@/lib/data'; // <--- IMPORTAMOS TU FUNCIÓN EXISTENTE
import Link from 'next/link';

// Forzamos renderizado dinámico para ver cambios al instante
export const dynamic = 'force-dynamic';

// --- FUNCIÓN PARA ARREGLAR IMÁGENES ANTIGUAS ---
function getEventImage(event: any) {
  // 1. Si tiene galería nueva, usa la primera
  if (event.images && event.images.length > 0) return event.images[0];
  
  // 2. Si tiene imagen antigua...
  if (event.image) {
    // Si es URL web o Base64 (foto subida), úsala tal cual
    if (event.image.startsWith('http') || event.image.startsWith('data:')) {
      return event.image;
    }
    
    // 3. Si es un código antiguo ("event-concert"), asignamos una foto de Unsplash
    if (event.image.includes('concert') || event.image.includes('music')) return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800';
    if (event.image.includes('conf') || event.image.includes('tech')) return 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800';
    if (event.image.includes('art') || event.image.includes('exhib')) return 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=800';
    if (event.image.includes('food')) return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800';
  }

  // 4. Fallback final si no hay nada
  return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800';
}

export default async function TicketShowPage() {
  // Obtenemos eventos REALES de la DB
  const events = await getEvents(); 

  return (
    <div className="min-h-screen bg-[#111] text-white font-sans">
      {/* Header Estático */}
      <header className="bg-black p-4 border-b border-gray-800 flex justify-between items-center sticky top-0 z-50">
        <h1 className="text-2xl font-bold text-yellow-400 tracking-tighter">EVENT GO</h1>
        <nav className="space-x-4 text-sm font-bold text-gray-400">
            <Link href="/profile" className="hover:text-yellow-400">MI PERFIL</Link>
            <Link href="/admin/events" className="hover:text-yellow-400">ADMIN</Link>
        </nav>
      </header>

      {/* Hero Banner */}
      <div className="relative h-64 md:h-96 w-full overflow-hidden mb-10">
        <div className="absolute inset-0 bg-gradient-to-t from-[#111] to-transparent z-10"></div>
        <img 
            src="https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?q=80&w=2070&auto=format&fit=crop" 
            className="w-full h-full object-cover opacity-50" 
            alt="Concert" 
        />
        <div className="absolute bottom-4 left-4 z-20">
            <h2 className="text-4xl md:text-6xl font-black uppercase text-white drop-shadow-lg">
                Cartelera <span className="text-yellow-400">2026</span>
            </h2>
        </div>
      </div>

      {/* Grid de Eventos Reales */}
      <div className="container mx-auto px-4 pb-20">
        <h3 className="text-xl font-bold border-l-4 border-yellow-400 pl-3 mb-6 uppercase">Próximos Eventos</h3>
        
        {events.length === 0 ? (
            <div className="text-center py-20 text-gray-500">No hay eventos disponibles en la base de datos.</div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {events.map((event: any) => {
                const imageUrl = getEventImage(event);
                
                return (
                    <Link href={`/show/event/${event.id}`} key={event.id} className="group bg-[#1a1a1a] rounded-xl overflow-hidden hover:-translate-y-2 transition-transform duration-300 shadow-lg hover:shadow-yellow-400/20">
                    <div className="aspect-[2/3] overflow-hidden relative">
                        <img 
                            src={imageUrl}
                            alt={event.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute top-2 right-2 bg-yellow-400 text-black text-xs font-bold px-2 py-1 rounded">
                            TICKETS DISPONIBLES
                        </div>
                    </div>
                    <div className="p-4">
                        <p className="text-yellow-400 text-xs font-bold mb-1 uppercase tracking-wider">
                            {new Date(event.date).toLocaleDateString('es-EC', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric',
                              timeZone: 'America/Guayaquil'
                            })}
                        </p>
                        <h4 className="text-lg font-bold leading-tight mb-2 group-hover:text-yellow-400 transition-colors line-clamp-2">
                            {event.name}
                        </h4>
                        <p className="text-gray-400 text-sm flex items-center gap-1">
                            📍 {event.location?.name}
                        </p>
                    </div>
                    </Link>
                );
            })}
            </div>
        )}
      </div>
    </div>
  );
}