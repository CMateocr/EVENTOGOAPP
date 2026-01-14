import { getEventById } from '@/lib/data';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { EventGalleryViewer } from '@/components/event-gallery-viewer';
import { EventPurchaseFlow } from '@/components/event-purchase-flow'; // <--- IMPORTAMOS EL NUEVO COMPONENTE

// Helper para imágenes
function getEventImagesSafe(event: any): string[] {
  const images: string[] = [];
  if (event.images && Array.isArray(event.images) && event.images.length > 0) {
      images.push(...event.images);
  } else if (event.image && (event.image.startsWith('http') || event.image.startsWith('data:'))) {
      images.push(event.image);
  } else {
      images.push('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800');
  }
  return images;
}

// --- ARREGLO DEL ERROR: params es Promise ---
export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // <--- AWAIT CLAVE AQUÍ
  
  const event = await getEventById(id);

  if (!event) return notFound();

  const galleryImages = getEventImagesSafe(event);

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        <Link href="/" className="inline-flex items-center gap-2 mb-8 text-gray-400 hover:text-yellow-500 transition-colors font-bold group">
          <span className="group-hover:-translate-x-1 transition-transform">←</span> Volver a la Cartelera
        </Link>

        {/* TITULO Y FECHA */}
        <div className="mb-8 border-b border-white/10 pb-8">
            <h1 className="text-4xl md:text-6xl font-black text-white mb-4 uppercase leading-none tracking-tight">
                {event.name}
            </h1>
            <p className="text-2xl text-yellow-500 font-bold flex items-center gap-3">
                {new Date(event.date).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Guayaquil' })}
                <span className="text-gray-600">|</span>
                <span className="text-gray-300 text-xl">{new Date(event.date).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Guayaquil' })}</span>
            </p>
        </div>

        {/* Galería Interactiva */}
        <div className="mb-12">
            <EventGalleryViewer images={galleryImages} title={event.name} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mt-10">
            {/* Detalles */}
            <div className="md:col-span-2 space-y-8">
                <div>
                    <h3 className="text-yellow-500 text-sm font-black uppercase tracking-widest mb-3">Descripción</h3>
                    <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-line">
                        {event.description}
                    </p>
                </div>
                {/* ... Ubicación y Capacidad (mismo código que antes) ... */}
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="bg-[#111] p-5 rounded-xl border border-white/10">
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-1">Ubicación</h3>
                        <p className="font-bold text-lg">{event.location?.name}</p>
                     </div>
                     <div className="bg-[#111] p-5 rounded-xl border border-white/10">
                        <h3 className="text-gray-500 text-xs font-bold uppercase mb-1">Capacidad</h3>
                        <p className="font-bold text-lg">{event.capacity} Personas</p>
                     </div>
                </div>
            </div>

            {/* Sidebar de Compra */}
            <div className="bg-[#111] p-6 rounded-2xl border border-white/10 h-fit sticky top-10">
                <h3 className="text-white text-xl font-black uppercase mb-6 flex items-center gap-2">
                    <span className="w-2 h-8 bg-yellow-500 rounded-sm"></span>
                    Entradas
                </h3>
                
                <div className="space-y-3 mb-6">
                    {event.ticketTypes.map((ticket: any) => (
                        <div key={ticket.id} className="flex justify-between items-center p-3 rounded-lg bg-black/40 border border-white/5">
                            <span className="font-medium text-gray-300">{ticket.name}</span>
                            <span className="font-bold text-white text-lg">${ticket.price}</span>
                        </div>
                    ))}
                </div>

                {/* AQUÍ USAMOS EL NUEVO COMPONENTE DE COMPRA */}
                <EventPurchaseFlow eventId={event.id} ticketTypes={event.ticketTypes} />
                
                <p className="text-center text-xs text-gray-500 mt-4">Transacción segura procesada por EventGo</p>
            </div>
        </div>

      </div>
    </div>
  );
}