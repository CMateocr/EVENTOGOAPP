'use client';

import { QRCodeSVG } from 'qrcode.react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TicketQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketId: string;
  eventName: string;
}

export function TicketQRModal({ isOpen, onClose, ticketId, eventName }: TicketQRModalProps) {
  // El valor del QR será el ID único del ticket.
  // En un entorno real, esto sería una URL firmada o un token encriptado.
  const qrValue = ticketId; 

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-sm bg-white text-black border-none rounded-3xl p-8 overflow-hidden">
        <DialogHeader className="flex flex-row items-center justify-between mb-4">
          <DialogTitle className="text-xl font-black uppercase tracking-wider text-center w-full flex-1">
            Tu Acceso
          </DialogTitle>
          {/* Botón de cierre explícito */}
          <button onClick={onClose} className="absolute right-4 top-4 p-2 text-gray-400 hover:text-black transition-colors">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center space-y-6">
          <h3 className="text-lg font-bold text-center line-clamp-1">{eventName}</h3>
          
          {/* Contenedor del QR con borde decorativo */}
          <div className="bg-white p-4 rounded-2xl border-4 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
             <QRCodeSVG 
                value={qrValue} 
                size={200}
                level="H" // Alto nivel de corrección de errores
                includeMargin={true}
             />
          </div>

          <p className="text-xs text-gray-500 font-mono text-center break-all px-4">
            ID: {ticketId}
          </p>

          <p className="text-sm text-gray-600 text-center max-w-[200px]">
            Muestra este código QR en la entrada del evento para ser escaneado.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}