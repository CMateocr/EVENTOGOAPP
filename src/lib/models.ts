import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { User, Event, Ticket, Order, TicketType } from './types';

const UserSchema = new Schema<User>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: 'User' }
});

const TicketTypeSchema = new Schema<TicketType>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }
});

const EventSchema = new Schema<Event>({
    name: { type: String, required: true },
    description: { type: String, required: true },
    date: { type: Date, required: true },
    location: {
        name: { type: String, required: true },
        lat: { type: Number, required: true },
        lng: { type: Number, required: true }
    },
    capacity: { type: Number, required: true },
    image: { type: String, required: true },
    ticketTypes: [TicketTypeSchema]
});

const TicketSchema = new Schema<Ticket>({
    orderId: { type: String, required: true },
    eventId: { type: String, required: true },
    userId: { type: String, required: true },
    ticketTypeId: { type: String, required: true },
    qrData: { type: String, required: true },
    status: { type: String, required: true, default: 'valid' }
});

const OrderSchema = new Schema<Order>({
    userId: { type: String, required: true },
    eventId: { type: String, required: true },
    tickets: [{ type: Schema.Types.ObjectId, ref: 'Ticket' }],
    totalAmount: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now }
});

// For Next.js hot-reloading, we need to check if the model already exists before defining it.
export const UserModel = (models.User as Model<User>) || mongoose.model<User>('User', UserSchema);
export const EventModel = (models.Event as Model<Event>) || mongoose.model<Event>('Event', EventSchema);
export const TicketModel = (models.Ticket as Model<Ticket>) || mongoose.model<Ticket>('Ticket', TicketSchema);
export const OrderModel = (models.Order as Model<Order>) || mongoose.model<Order>('Order', OrderSchema);
