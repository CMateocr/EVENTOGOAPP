
import mongoose, { Schema, Document, models, Model } from 'mongoose';
import type { User, Event, Ticket, Order, TicketType } from './types';

const UserSchema = new Schema<User>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: 'User' },
    image: { type: String, required: false }
});

const TicketTypeSchema = new Schema<TicketType>({
    id: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true }
}, { _id: false });

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
    images: { type: [String], required: false, default: [] },
    ticketTypes: [TicketTypeSchema],
    createdBy: { type: String, required: true },
});

const TicketSchema = new Schema<Ticket>({
    orderId: { type: String },
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


function getModel<T>(name: string, schema: Schema): Model<T> {
    // For Next.js hot-reloading, we need to check if the model already exists before defining it.
    return (models[name] as Model<T>) || mongoose.model<T>(name, schema);
}

export const UserModel = getModel<User>('User', UserSchema);
export const EventModel = getModel<Event>('Event', EventSchema);
export const TicketModel = getModel<Ticket>('Ticket', TicketSchema);
export const OrderModel = getModel<Order>('Order', OrderSchema);
