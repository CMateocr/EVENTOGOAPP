import { Types } from 'mongoose';
import type { EventTypeConfig } from '@/components/admin/event-type-config';

export type User = {
  id: string;
  name: string;
  email: string;
  password?: string; // Will be hashed, not sent to client
  role: 'Admin' | 'User';
  image?: string;  //para foto de perfil
};

export type TicketType = {
  id: string;
  name: string;
  price: number;
};

export type Event = {
  _id?: Types.ObjectId;
  id: string;
  name: string;
  description: string;
  date: Date;
  location: {
    name: string;
    lat: number;
    lng: number;
  };
  capacity: number;
  image: string; // Placeholder image ID
  images?: string[]; //para la o las fotos de los eventos
  ticketTypes: TicketType[];
  createdBy: string; // User ID of the creator
  eventTypeConfig?: EventTypeConfig; // Configuración del tipo de evento
};

export type Ticket = {
  _id?: Types.ObjectId;
  id: string;
  orderId: string;
  eventId: string;
  userId: string;
  ticketTypeId: string;
  qrData: string; // Will contain a JWT or unique identifier
  status: 'valid' | 'used';
};

export type Order = {
  _id?: Types.ObjectId;
  id:string;
  userId: string;
  eventId: string;
  tickets: (Ticket | Types.ObjectId)[];
  totalAmount: number;
  createdAt: Date;
};
