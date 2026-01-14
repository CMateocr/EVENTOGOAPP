import { getEvents } from '@/lib/data';
import Link from 'next/link';
import { Ticket } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getEventImage(event: any) {
  if (event.images && event.images.length > 0) return event.images[0];
  if (event.image && (event.image.startsWith('http') || event.image.startsWith('data:'))) return event.image;
  return 'https://images.unsplash.com/photo-1514525253440-b393452e8d26?auto=format&fit=crop&w=800';
}

export default async function EventsListPage() {
  const events = await getEvents();

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-6 md:p-12">
        <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-5xl font-black mb-10 flex items-center gap-4">
                <span className="text-yellow-500">///</span> EVENTOS DISPONIBLES
            </h1>

            <div className="space-y-4">
                {events.map((event: any) => {
                    const img = getEventImage(event);
                    return (
                        <div key={event.id} className="flex flex-col md:flex-row bg-[#111] border border-white/10 rounded-xl overflow-hidden hover:border-yellow-500/50 transition-colors group">
                            {/* Imagen Lateral */}
                            <div className="w-full md:w-64 h-48 md:h-auto relative">
                                <img src={img} alt={event.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            </div>

                            {/* Info */}
                            <div className="p-6 flex-1 flex flex-col justify-center">
                                <div className="flex justify-between items-start mb-2">
                                    <h2 className="text-2xl font-bold text-white group-hover:text-yellow-400 transition-colors">{event.name}</h2>
                                    <span className="bg-white/10 text-xs font-bold px-2 py-1 rounded text-gray-300">
                                        {new Date(event.date).toLocaleDateString('es-EC', {
                                          timeZone: 'America/Guayaquil'
                                        })}
                                    </span>
                                </div>
                                <p className="text-gray-400 mb-6 line-clamp-2">{event.description}</p>

                                <div className="flex items-center gap-4 mt-auto">
                                    <Link href={`/show/event/${event.id}`}>
                                        <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-2 rounded-full flex items-center gap-2 transition-transform active:scale-95">
                                            <Ticket className="w-4 h-4" />
                                            Ver Detalles
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
}
