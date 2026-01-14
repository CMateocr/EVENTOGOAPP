'use client';

import { useState, useEffect } from 'react';
import { purchaseTickets } from '@/lib/actions';
import { useSession } from '@/hooks/use-session';
import { useRouter } from 'next/navigation';
import { Loader2, Ticket, CreditCard, CheckCircle, ChevronRight, ArrowLeft, Armchair } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface TicketType {
  id: string;
  name: string;
  price: number;
}

interface EventPurchaseFlowProps {
  eventId: string;
  ticketTypes: TicketType[];
}

export function EventPurchaseFlow({ eventId, ticketTypes }: EventPurchaseFlowProps) {
  // CORRECCIÓN AQUÍ: Usamos 'user' en lugar de 'session'
  const { token, user } = useSession(); 
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); 
  const [loadingPay, setLoadingPay] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false);
  
  // Datos de compra
  const [selectedTicketId, setSelectedTicketId] = useState<string>(ticketTypes[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  
  // Datos tarjeta
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvc: '' });

  useEffect(() => { setIsSessionReady(true); }, []);

  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketId);
  const totalAmount = (selectedTicket?.price || 0) * quantity;

  // --- LÓGICA DE ASIENTOS (SIMULADA) ---
  const generateSeats = () => {
    const rows = ['A', 'B', 'C', 'D'];
    const cols = 6;
    return rows.map(row => 
      Array.from({ length: cols }, (_, i) => ({
        id: `${row}${i + 1}`,
        status: Math.random() > 0.8 ? 'occupied' : 'available'
      }))
    );
  };
  const [seatMap] = useState(generateSeats());

  const toggleSeat = (seatId: string) => {
    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatId));
    } else {
      if (selectedSeats.length < quantity) {
        setSelectedSeats(prev => [...prev, seatId]);
      } else {
        setSelectedSeats(prev => [...prev.slice(1), seatId]);
      }
    }
  };

  const handlePayment = async () => {
    if (!token) return;
    setLoadingPay(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const result = await purchaseTickets(
        eventId, 
        [{ ticketTypeId: selectedTicketId, quantity: quantity }],
        token
      );

      if (result.success) setStep(4);
      else alert(result.message || 'Error al procesar el pago.');
    } catch (error) {
      alert('Error de conexión.');
    } finally {
      setLoadingPay(false);
    }
  };

  const resetFlow = () => {
    setIsOpen(false);
    setTimeout(() => { setStep(1); setQuantity(1); setSelectedSeats([]); }, 500);
  };

  const renderContent = () => {
    if (!isSessionReady) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-yellow-500" /></div>;

    // CORRECCIÓN AQUÍ: Verificamos 'user' en lugar de 'session'
    if (!user) {
        return (
            <div className="text-center py-8 px-6 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Inicia Sesión</h3>
                <p className="mb-6 text-gray-400 text-sm">Necesitamos saber quién eres para asignarte los asientos.</p>
                <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setIsOpen(false)} className="border-white/10 text-white">Cancelar</Button>
                    <Button onClick={() => router.push('/login')} className="bg-yellow-500 text-black font-bold">Ir al Login</Button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header Pasos */}
            <div className="bg-black/40 p-4 border-b border-white/5 flex items-center justify-between">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
                    {step === 1 && <><Ticket className="text-yellow-500 w-5 h-5"/> Entradas</>}
                    {step === 2 && <><Armchair className="text-yellow-500 w-5 h-5"/> Asientos ({selectedSeats.length}/{quantity})</>}
                    {step === 3 && <><CreditCard className="text-yellow-500 w-5 h-5"/> Pago</>}
                    {step === 4 && <><CheckCircle className="text-green-500 w-5 h-5"/> ¡Listo!</>}
                </DialogTitle>
                <div className="flex gap-1">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${step >= s ? 'bg-yellow-500' : 'bg-gray-700'}`} />
                    ))}
                </div>
            </div>

            <div className="p-6">
                {/* PASO 1: CANTIDAD Y TIPO */}
                {step === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="space-y-3">
                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Tipo de Entrada</Label>
                            <div className="grid gap-2">
                                {ticketTypes.map((ticket) => (
                                <div 
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={`cursor-pointer p-4 rounded-xl border transition-all flex justify-between items-center ${
                                    selectedTicketId === ticket.id ? 'border-yellow-500 bg-yellow-500/10' : 'border-white/10 bg-black/20'
                                    }`}
                                >
                                    <span className={`font-bold ${selectedTicketId === ticket.id ? 'text-white' : 'text-gray-400'}`}>{ticket.name}</span>
                                    <span className="font-mono text-yellow-500 font-bold">${ticket.price}</span>
                                </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cantidad</Label>
                            <div className="flex items-center gap-3 bg-black rounded-lg p-1 border border-white/10">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white font-bold">-</button>
                                <span className="w-8 text-center font-mono font-bold text-white">{quantity}</span>
                                <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white font-bold">+</button>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/10 flex justify-end">
                            <Button onClick={() => setStep(2)} className="bg-white text-black hover:bg-gray-200 font-bold px-6">
                                Elegir Asientos <ChevronRight className="w-4 h-4 ml-1"/>
                            </Button>
                        </div>
                    </div>
                )}

                {/* PASO 2: SELECCIÓN DE ASIENTOS */}
                {step === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="text-center mb-4">
                            <div className="w-full h-2 bg-gray-700 rounded-full mb-2 mx-auto max-w-[200px]" />
                            <p className="text-xs text-gray-500 uppercase tracking-widest">Escenario</p>
                        </div>

                        <div className="grid gap-2 justify-center">
                            {seatMap.map((row, rIdx) => (
                                <div key={rIdx} className="flex gap-2">
                                    {row.map((seat) => {
                                        const isSelected = selectedSeats.includes(seat.id);
                                        const isOccupied = seat.status === 'occupied';
                                        return (
                                            <button
                                                key={seat.id}
                                                disabled={isOccupied}
                                                onClick={() => toggleSeat(seat.id)}
                                                className={`w-8 h-8 rounded-t-lg rounded-b-sm text-[10px] font-bold transition-all flex items-center justify-center
                                                    ${isOccupied ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 
                                                      isSelected ? 'bg-yellow-500 text-black scale-110 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 
                                                      'bg-white/10 text-white hover:bg-white/30'}
                                                `}
                                            >
                                                {seat.id}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center gap-4 text-xs text-gray-400 mt-4">
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-white/10 rounded-sm"/> Libre</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-800 rounded-sm"/> Ocupado</div>
                            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-sm"/> Tuyo</div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-between">
                             <Button variant="outline" onClick={() => setStep(1)} className="border-white/10 text-gray-400"><ArrowLeft className="w-4 h-4" /></Button>
                             <Button 
                                onClick={() => setStep(3)} 
                                disabled={selectedSeats.length !== quantity}
                                className="bg-white text-black hover:bg-gray-200 font-bold px-6"
                             >
                                Confirmar ({selectedSeats.length}/{quantity}) <ChevronRight className="w-4 h-4 ml-1"/>
                             </Button>
                        </div>
                    </div>
                )}

                {/* PASO 3: PAGO */}
                {step === 3 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-5 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-20"><CreditCard size={64} /></div>
                                <p className="text-xs text-indigo-200 uppercase tracking-widest mb-4">Credit Card</p>
                                <p className="font-mono text-xl tracking-widest mb-4 text-white">{cardData.number || '0000 0000 0000 0000'}</p>
                                <div className="flex justify-between items-end">
                                    <div><p className="text-[10px] text-indigo-200 uppercase">Titular</p><p className="text-sm font-bold text-white uppercase">{cardData.name || 'TU NOMBRE'}</p></div>
                                    <div><p className="text-[10px] text-indigo-200 uppercase">Expira</p><p className="text-sm font-bold text-white">{cardData.expiry || 'MM/YY'}</p></div>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <Input placeholder="Número de Tarjeta" className="bg-black/40 border-white/10 font-mono text-white" onChange={(e) => setCardData({...cardData, number: e.target.value})} maxLength={19} />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input placeholder="MM/YY" className="bg-black/40 border-white/10 text-white" onChange={(e) => setCardData({...cardData, expiry: e.target.value})} maxLength={5} />
                                    <Input placeholder="CVC" className="bg-black/40 border-white/10 text-white" type="password" onChange={(e) => setCardData({...cardData, cvc: e.target.value})} maxLength={3} />
                                </div>
                                <Input placeholder="Titular" className="bg-black/40 border-white/10 uppercase text-white" onChange={(e) => setCardData({...cardData, name: e.target.value})} />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <Button variant="outline" onClick={() => setStep(2)} className="border-white/10 text-gray-400"><ArrowLeft className="w-4 h-4" /></Button>
                                <Button onClick={handlePayment} disabled={loadingPay} className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-black">
                                    {loadingPay ? <Loader2 className="animate-spin mr-2"/> : `PAGAR $${totalAmount.toFixed(2)}`}
                                </Button>
                            </div>
                    </div>
                )}

                {/* PASO 4: ÉXITO */}
                {step === 4 && (
                    <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-green-500/50">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">¡Todo Listo!</h3>
                        <p className="text-gray-400 text-sm mb-2">Tus asientos han sido reservados:</p>
                        <div className="flex gap-2 mb-6">
                            {selectedSeats.map(s => <span key={s} className="bg-white/10 px-2 py-1 rounded text-xs font-mono">{s}</span>)}
                        </div>
                        <Button onClick={() => { setIsOpen(false); router.push('/tickets'); }} className="w-full bg-white text-black hover:bg-gray-200 font-bold py-6">
                            VER MIS TICKETS
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && resetFlow()}>
      <DialogTrigger asChild>
        <button onClick={() => setIsOpen(true)} className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black py-4 rounded-xl text-lg shadow-lg hover:shadow-yellow-500/20 transition-all transform active:scale-95">
             COMPRAR ENTRADAS
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-[#111] border-white/10 text-white p-0 overflow-hidden gap-0 shadow-2xl">
         {renderContent()}
      </DialogContent>
    </Dialog>
  );
}