'use client';

import { useState, useEffect } from 'react';
import { purchaseTickets } from '@/lib/actions';
import { useSession } from '@/hooks/use-session';
import { useRouter } from 'next/navigation';
import { Loader2, Ticket, CreditCard, CheckCircle, ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
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
  const { token, user } = useSession(); // Obtenemos la sesión
  const router = useRouter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loadingPay, setLoadingPay] = useState(false);
  
  // Estado de Selección
  const [selectedTicketId, setSelectedTicketId] = useState<string>(ticketTypes[0]?.id || '');
  const [quantity, setQuantity] = useState(1);
  
  // Estado de Tarjeta
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvc: '' });

  // ESTADO DE CARGA DE SESIÓN (Nuevo)
  // Usamos un pequeño delay para dar tiempo a que useSession lea el token
  const [isSessionReady, setIsSessionReady] = useState(false);

  useEffect(() => {
    // Al montar el componente, damos un respiro para confirmar la sesión
    setIsSessionReady(true);
  }, []);

  const selectedTicket = ticketTypes.find(t => t.id === selectedTicketId);
  const totalAmount = (selectedTicket?.price || 0) * quantity;

  const handlePayment = async () => {
    if (!token) return;

    setLoadingPay(true);
    // Simular proceso bancario
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const result = await purchaseTickets(
        eventId, 
        [{ ticketTypeId: selectedTicketId, quantity: quantity }],
        token
      );

      if (result.success) {
        setStep(3);
      } else {
        alert(result.message || 'Error al procesar el pago.');
      }
    } catch (error) {
      alert('Error de conexión.');
    } finally {
      setLoadingPay(false);
    }
  };

  const resetFlow = () => {
    setIsOpen(false);
    setTimeout(() => {
        setStep(1);
        setQuantity(1);
    }, 500);
  };

  // Lógica inteligente para el contenido del modal
  const renderContent = () => {
    // 1. Si aún no sabemos si hay sesión (hidratación), mostramos carga simple
    if (!isSessionReady) {
       return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-yellow-500" /></div>;
    }

    // 2. Si definitivamente NO hay sesión, mostramos bloqueo
    if (!user) {
        return (
            <div className="text-center py-8 px-6 animate-in fade-in zoom-in-95">
                <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Ticket className="w-8 h-8 text-yellow-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Inicia Sesión</h3>
                <p className="mb-6 text-gray-400 text-sm">Para comprar entradas y asegurar tu lugar, necesitamos saber quién eres.</p>
                <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => setIsOpen(false)} className="border-white/10 text-white">Cancelar</Button>
                    <Button onClick={() => router.push('/login')} className="bg-yellow-500 text-black font-bold">Ir al Login</Button>
                </div>
            </div>
        );
    }

    // 3. SI HAY SESIÓN -> FLUJO NORMAL DE COMPRA (Omitimos el paso de login)
    return (
        <>
            {/* Header con Progreso */}
            <div className="bg-black/40 p-4 border-b border-white/5 flex items-center justify-between">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-white">
                    {step === 1 && <><Ticket className="text-yellow-500 w-5 h-5"/> Seleccionar</>}
                    {step === 2 && <><CreditCard className="text-yellow-500 w-5 h-5"/> Pago</>}
                    {step === 3 && <><CheckCircle className="text-green-500 w-5 h-5"/> ¡Listo!</>}
                </DialogTitle>
                <div className="flex gap-1">
                    <div className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${step >= 1 ? 'bg-yellow-500' : 'bg-gray-700'}`} />
                    <div className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${step >= 2 ? 'bg-yellow-500' : 'bg-gray-700'}`} />
                    <div className={`h-1.5 w-6 rounded-full transition-colors duration-500 ${step >= 3 ? 'bg-green-500' : 'bg-gray-700'}`} />
                </div>
            </div>

            <div className="p-6">
                {/* PASO 1: SELECCIÓN */}
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
                                    selectedTicketId === ticket.id 
                                        ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_15px_rgba(234,179,8,0.1)]' 
                                        : 'border-white/10 hover:border-white/30 bg-black/20'
                                    }`}
                                >
                                    <span className={`font-bold ${selectedTicketId === ticket.id ? 'text-white' : 'text-gray-400'}`}>
                                    {ticket.name}
                                    </span>
                                    <span className="font-mono text-yellow-500 font-bold">${ticket.price}</span>
                                </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                            <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cantidad</Label>
                            <div className="flex items-center gap-3 bg-black rounded-lg p-1 border border-white/10">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white font-bold transition-colors">-</button>
                                <span className="w-8 text-center font-mono font-bold text-white">{quantity}</span>
                                <button onClick={() => setQuantity(Math.min(10, quantity + 1))} className="w-8 h-8 flex items-center justify-center hover:bg-white/10 rounded text-white font-bold transition-colors">+</button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                            <div>
                                <p className="text-xs text-gray-400 uppercase">Total a Pagar</p>
                                <p className="text-2xl font-black text-white">${totalAmount.toFixed(2)}</p>
                            </div>
                            <Button onClick={() => setStep(2)} className="bg-white text-black hover:bg-gray-200 font-bold px-6">
                                Continuar <ChevronRight className="w-4 h-4 ml-1"/>
                            </Button>
                        </div>
                    </div>
                )}

                {/* PASO 2: PAGO (SIMULADO) */}
                {step === 2 && (
                    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                            {/* Tarjeta Visual */}
                            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 p-5 rounded-xl border border-white/10 shadow-2xl relative overflow-hidden group hover:scale-[1.02] transition-transform duration-500">
                            <div className="absolute top-0 right-0 p-3 opacity-20"><CreditCard size={64} /></div>
                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-xs text-indigo-200 uppercase tracking-widest mb-4">Credit Card</p>
                            <p className="font-mono text-xl tracking-widest mb-4 text-white shadow-black drop-shadow-md">
                                {cardData.number || '0000 0000 0000 0000'}
                            </p>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-indigo-200 uppercase">Titular</p>
                                    <p className="text-sm font-bold text-white uppercase">{cardData.name || 'TU NOMBRE'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-indigo-200 uppercase">Expira</p>
                                    <p className="text-sm font-bold text-white">{cardData.expiry || 'MM/YY'}</p>
                                </div>
                            </div>
                            </div>

                            <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">Número de Tarjeta</Label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                                    <Input 
                                        placeholder="4500 1234 5678 9010" 
                                        className="pl-9 bg-black/40 border-white/10 font-mono text-white placeholder:text-gray-600 focus:border-yellow-500/50"
                                        maxLength={19}
                                        onChange={(e) => setCardData({...cardData, number: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-400">Expiración</Label>
                                    <Input 
                                        placeholder="MM/YY" 
                                        className="bg-black/40 border-white/10 font-mono text-white placeholder:text-gray-600 focus:border-yellow-500/50"
                                        maxLength={5}
                                        onChange={(e) => setCardData({...cardData, expiry: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs text-gray-400">CVC</Label>
                                    <Input 
                                        placeholder="123" 
                                        type="password"
                                        className="bg-black/40 border-white/10 font-mono text-white placeholder:text-gray-600 focus:border-yellow-500/50"
                                        maxLength={3}
                                        onChange={(e) => setCardData({...cardData, cvc: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs text-gray-400">Nombre del Titular</Label>
                                <Input 
                                    placeholder="Como aparece en la tarjeta" 
                                    className="bg-black/40 border-white/10 uppercase text-white placeholder:text-gray-600 focus:border-yellow-500/50"
                                    onChange={(e) => setCardData({...cardData, name: e.target.value})}
                                />
                            </div>
                            </div>

                            <div className="pt-2 flex gap-3">
                            <Button variant="outline" onClick={() => setStep(1)} className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5">
                                <ArrowLeft className="w-4 h-4" />
                            </Button>
                            <Button 
                                onClick={handlePayment} 
                                disabled={loadingPay}
                                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-black font-black transition-all hover:scale-[1.02]"
                            >
                                {loadingPay ? <Loader2 className="animate-spin mr-2"/> : `PAGAR $${totalAmount.toFixed(2)}`}
                            </Button>
                            </div>
                    </div>
                )}

                {/* PASO 3: ÉXITO */}
                {step === 3 && (
                    <div className="py-8 flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-green-500/50 shadow-[0_0_30px_rgba(34,197,94,0.2)]">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                        </div>
                        <h3 className="text-2xl font-black text-white mb-2">¡Pago Confirmado!</h3>
                        <p className="text-gray-400 text-sm mb-6 max-w-[200px]">
                            Tus entradas están listas. Hemos enviado el comprobante a tu correo.
                        </p>
                        <Button 
                            onClick={() => { setIsOpen(false); router.push('/tickets'); }} 
                            className="w-full bg-white text-black hover:bg-gray-200 font-bold rounded-xl py-6"
                        >
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