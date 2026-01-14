import { getEvents } from '@/lib/data'; 
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { ArrowRight, Ticket } from 'lucide-react'; // Asegúrate de tener lucide-react, si no, quita los iconos

export const dynamic = 'force-dynamic';

// --- FUNCIÓN PARA ARREGLAR IMÁGENES ANTIGUAS ---
function getEventImage(event: any) {
  if (event.images && event.images.length > 0) return event.images[0];
  
  if (event.image && typeof event.image === 'string') {
    if (event.image.startsWith('http') || event.image.startsWith('data:')) {
      return event.image;
    }
    if (event.image.includes('concert') || event.image.includes('music')) return 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800';
    if (event.image.includes('conf') || event.image.includes('tech')) return 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=800';
    if (event.image.includes('art') || event.image.includes('exhib')) return 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?auto=format&fit=crop&w=800';
    if (event.image.includes('food')) return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800';
  }

  return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800';
}

export default async function HomePage() {
  const events = await getEvents(); 

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans selection:bg-yellow-500 selection:text-black">
      
      {/* Hero Banner Principal */}
      <div className="relative h-[600px] w-full overflow-hidden">
        {/* Overlay con degradado más suave */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/40 to-black/30 z-10" />
        
        <img 
          src="https://images.unsplash.com/photo-1470229722913-7ea2d9864f80?q=80&w=2070&auto=format&fit=crop" 
          alt="Concert Crowd" 
          className="w-full h-full object-cover opacity-90 scale-105 animate-in fade-in duration-1000"
        />
        
        <div className="absolute bottom-0 left-0 right-0 z-20 container mx-auto px-4 pb-16 md:pb-24">
            <div className="max-w-4xl">
                <span className="inline-flex items-center gap-2 py-1 px-3 border border-yellow-500/50 text-yellow-400 rounded-full text-xs font-bold tracking-[0.2em] mb-6 uppercase bg-black/60 backdrop-blur-md shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    Experiencias Inolvidables
                </span>
                
                <h1 className="text-5xl md:text-8xl font-black text-white mb-6 uppercase drop-shadow-2xl tracking-tighter leading-[0.9]">
                    EVENT GO <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-600">
                        Tu Próxima Aventura
                    </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mb-10 font-light drop-shadow-md border-l-4 border-yellow-500 pl-6">
                    Tu app para descubrir eventos cerca de ti.
                </p>

                {/* BOTONES DISEÑADOS */}
                <div className="flex flex-col sm:flex-row gap-5">
                    <Link href="#events">
                        <Button className="h-auto py-4 px-8 text-lg rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-300 hover:to-yellow-500 text-black font-black shadow-[0_0_20px_rgba(234,179,8,0.4)] hover:shadow-[0_0_30px_rgba(234,179,8,0.6)] hover:scale-105 transition-all duration-300 border-none group">
                            <Ticket className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                            VER CARTELERA
                        </Button>
                    </Link>
                    
                    <Link href="/register">
                        <Button variant="outline" className="h-auto py-4 px-8 text-lg rounded-full border-white/30 text-white hover:bg-white/10 hover:border-white font-bold backdrop-blur-sm bg-black/20 hover:scale-105 transition-all duration-300 group">
                            Unirse Ahora
                            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
      </div>

      {/* Sección de Eventos */}
      <main id="events" className="container mx-auto px-4 py-20">
        <div className="flex items-end justify-between mb-12 border-b border-white/10 pb-6">
            <div>
                <h2 className="text-4xl font-black text-white uppercase tracking-tight flex items-center gap-3">
                    Próximos <span className="text-yellow-500">Eventos</span>
                </h2>
                <p className="text-gray-400 mt-2 text-lg">Explora lo mejor de la música, teatro y cultura.</p>
            </div>
        </div>

        {events.length === 0 ? (
           <div className="flex flex-col items-center justify-center py-32 bg-[#151515] rounded-3xl border border-dashed border-white/10">
                <div className="bg-white/5 p-4 rounded-full mb-4">
                    <Ticket className="w-10 h-10 text-gray-500" />
                </div>
                <p className="text-gray-400 text-2xl font-bold mb-2">No hay eventos activos</p>
                <p className="text-gray-500 mb-8">Sé el primero en crear uno.</p>
                <Link href="/admin/events/new">
                    <Button className="bg-yellow-500 text-black font-bold hover:bg-yellow-400">Crear Evento</Button>
                </Link>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {events.map((event: any) => {
              const imageUrl = getEventImage(event);

              return (
                <Link href={`/show/event/${event.id}`} key={event.id} className="group block h-full">
                  <div className="bg-[#151515] rounded-3xl overflow-hidden h-full flex flex-col transition-all duration-500 hover:shadow-[0_20px_50px_-10px_rgba(234,179,8,0.15)] hover:-translate-y-2 border border-white/5 hover:border-yellow-500/50 relative">
                    
                    {/* Poster */}
                    <div className="aspect-[3/4] relative overflow-hidden bg-gray-900">
                      <div className="absolute inset-0 bg-gradient-to-t from-[#151515] to-transparent opacity-60 z-10" />
                      <img 
                        src={imageUrl} 
                        alt={event.name} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0"
                        loading="lazy"
                      />
                      <div className="absolute top-4 right-4 z-20">
                          <span className="bg-yellow-500/90 backdrop-blur-md text-black text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></span>
                              Venta
                          </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6 flex flex-col flex-grow relative z-20 -mt-10">
                      <div className="bg-[#222] p-3 rounded-xl mb-4 self-start shadow-lg border border-white/5">
                          <div className="text-yellow-500 text-xs font-black uppercase tracking-widest text-center leading-none">
                              {new Date(event.date).toLocaleDateString('es-EC', { month: 'short', timeZone: 'America/Guayaquil' }).toUpperCase()}
                          </div>
                          <div className="text-white text-xl font-black text-center leading-none mt-1">
                              {new Date(event.date).toLocaleDateString('es-EC', { day: 'numeric', timeZone: 'America/Guayaquil' })}
                          </div>
                      </div>
                      
                      <h3 className="text-2xl font-bold text-white mb-2 leading-tight line-clamp-2 group-hover:text-yellow-400 transition-colors">
                          {event.name}
                      </h3>
                      
                      <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-gray-400 text-sm">
                          <span className="flex items-center gap-2 truncate max-w-[70%]">
                               {/* Icono simple si no tienes lucide */}
                               <span className="text-yellow-500">📍</span> 
                               {event.location?.name || 'Por definir'}
                          </span>
                          <span className="text-white font-bold group-hover:translate-x-1 transition-transform text-xs uppercase tracking-wider border border-white/20 px-2 py-1 rounded hover:bg-white hover:text-black">
                              Tickets
                          </span>
                      </div>
                    </div>

                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer Simple */}
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
