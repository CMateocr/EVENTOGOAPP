
import mongoose from 'mongoose';
import dbConnect from './db';
import { EventModel, UserModel, TicketModel, OrderModel } from './models';
import type { Event, User, Ticket, Order } from './types';

// --- Event Functions ---
export const getEvents = async (includePast = true, createdBy?: string): Promise<Event[]> => {
  await dbConnect();

  // CAMBIO IMPORTANTE: Quitamos el filtro de fecha temporalmente
  // Antes era: const query: any = includePast ? {} : { date: { $gte: new Date() } };

  // Ahora forzamos que traiga todo para probar:
  const query: any = {};

  if (createdBy) {
    query.createdBy = createdBy;
  }

  // Ordenamos por fecha descendente (lo más nuevo primero)
  const events = await EventModel.find(query).sort({ date: -1 }).lean();
  return JSON.parse(JSON.stringify(events.map(e => ({ ...e, id: e._id.toString() }))));
};

export const getEventById = async (id: string): Promise<Event | undefined> => {
  await dbConnect();
  if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
  const event = await EventModel.findById(id).lean();
  if (event) {
    return JSON.parse(JSON.stringify({ ...event, id: event._id.toString() }));
  }
  return undefined;
};

export const createEvent = async (eventData: Omit<Event, 'id'>): Promise<Event> => {
    await dbConnect();
    if (!eventData.createdBy) {
      throw new Error('Event must have a creator (createdBy).');
    }
    const newEvent = await EventModel.create(eventData);
    return JSON.parse(JSON.stringify({ ...newEvent.toObject(), id: newEvent._id.toString() }));
};

export const updateEvent = async (id: string, eventData: Partial<Omit<Event, 'id'>>): Promise<Event | null> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const updatedEvent = await EventModel.findByIdAndUpdate(id, eventData, { new: true }).lean();
    if(updatedEvent) {
        return JSON.parse(JSON.stringify({ ...updatedEvent, id: updatedEvent._id.toString() }));
    }
    return null;
}

export const deleteEvent = async (id: string): Promise<boolean> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const result = await EventModel.findByIdAndDelete(id);
    return !!result;
}

// --- User Functions ---
export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  await dbConnect();
  const user = await UserModel.findOne({ email }).lean();
  if (user) {
    const { _id, ...rest } = user as any;
    return { id: _id.toString(), ...rest } as User;
  }
  return undefined;
};

export const findUserById = async (id: string): Promise<User | undefined> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(id)) return undefined;
    const user = await UserModel.findById(id).lean();
    if (user) {
        const { _id, ...rest } = user as any;
        return { id: _id.toString(), ...rest } as User;
    }
    return undefined;
};

export const createNewUser = async (name: string, email: string, password: string): Promise<User> => {
    await dbConnect();
    const newUser = await UserModel.create({ name, email, password, role: 'User' });
    const { _id, ...rest } = newUser.toObject();
    return { id: _id.toString(), ...rest };
};

export const updateUser = async (userId: string, data: Partial<User>): Promise<User | null> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(userId)) return null;

    // Don't allow password to be updated through this generic method
    const { password, ...updateData } = data;

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, { new: true }).lean();
    if (updatedUser) {
        const { _id, ...rest } = updatedUser as any;
        return { id: _id.toString(), ...rest } as User;
    }
    return null;
}


// --- Ticket/Order Functions ---
export const createOrder = async (
  userId: string,
  eventId: string,
  ticketSelections: { ticketTypeId: string; quantity: number }[]
): Promise<Order> => {
    await dbConnect();
    const event = await getEventById(eventId);
    if (!event) throw new Error('Event not found');
    
    const totalTicketsToPurchase = ticketSelections.reduce((sum, sel) => sum + sel.quantity, 0);

    const existingTickets = await TicketModel.countDocuments({ eventId });

    if(existingTickets + totalTicketsToPurchase > event.capacity) {
        throw new Error(`Cannot purchase tickets. Only ${event.capacity - existingTickets} tickets left.`);
    }

    let totalAmount = 0;
    const ticketBlueprints: any[] = [];
    
    for (const selection of ticketSelections) {
        const ticketType = event.ticketTypes.find(tt => tt.id === selection.ticketTypeId);
        if (!ticketType) throw new Error(`Ticket validation failed: Ticket type ${selection.ticketTypeId} not found`);

        totalAmount += ticketType.price * selection.quantity;

        for (let i = 0; i < selection.quantity; i++) {
            ticketBlueprints.push({
                eventId,
                userId,
                ticketTypeId: selection.ticketTypeId,
                status: 'valid' as const,
            });
        }
    }

    // Step 1: Create the Order first to get an orderId
    const newOrder = new OrderModel({
        userId,
        eventId,
        tickets: [], // tickets will be added later
        totalAmount,
        createdAt: new Date(),
    });
    await newOrder.save();
    const orderId = newOrder._id.toString();

    // Step 2: Create tickets with the final orderId and generate qrData
    const ticketsToCreate = ticketBlueprints.map(blueprint => {
        const ticketId = new mongoose.Types.ObjectId();
        return {
            ...blueprint,
            _id: ticketId,
            orderId: orderId,
            qrData: JSON.stringify({ ticketId: ticketId.toString(), eventId, userId }),
        };
    });
    
    if (ticketsToCreate.length > 0) {
      await TicketModel.insertMany(ticketsToCreate);
    }

    // Step 3: Update the order with the IDs of the created tickets
    newOrder.tickets = ticketsToCreate.map(t => t._id);
    await newOrder.save();

    // Step 4: Return the fully populated order
    const finalOrder = await OrderModel.findById(orderId).populate('tickets').lean();
    if (!finalOrder) throw new Error("Failed to retrieve final order.");

    const result = {
        ...finalOrder,
        id: finalOrder._id.toString(),
        tickets: finalOrder.tickets.map((t: any) => ({...t, id: t._id.toString()}))
    };
    return JSON.parse(JSON.stringify(result));
};

export const getTicketsByUserId = async (userId: string): Promise<Ticket[]> => {
    await dbConnect();
    const tickets = await TicketModel.find({ userId }).lean();
    return JSON.parse(JSON.stringify(tickets.map(t => ({...t, id: t._id.toString()}))));
}

export const getTicketById = async (ticketId: string): Promise<Ticket | undefined> => {
    await dbConnect();
    if (!mongoose.Types.ObjectId.isValid(ticketId)) return undefined;
    const ticket = await TicketModel.findById(ticketId).lean();
    if (ticket) {
        return JSON.parse(JSON.stringify({...ticket, id: ticket._id.toString()}));
    }
    return undefined;
}

export const validateAndUseTicket = async (ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket, event?: Event }> => {
    await dbConnect();
    
    let ticket;
    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
        return { success: false, message: "Invalid Ticket ID format." };
    }
    ticket = await TicketModel.findById(ticketId).lean();
    

    if(!ticket) {
        return { success: false, message: "Invalid Ticket: Not found." };
    }

    const event = await getEventById(ticket.eventId);
    if (ticket.status === 'used') {
        const ticketObject = JSON.parse(JSON.stringify({...ticket, id: ticket._id.toString()}));
        return { success: false, message: "Ticket Already Used.", ticket: ticketObject, event };
    }

    let updatedTicket;
    updatedTicket = await TicketModel.findByIdAndUpdate(ticketId, { status: 'used' }, { new: true }).lean();
    
    const finalTicket = updatedTicket ? JSON.parse(JSON.stringify({...updatedTicket, id: updatedTicket!._id.toString()})) : updatedTicket;
    return { success: true, message: "Ticket Validated Successfully.", ticket: finalTicket, event };
}


// --- Database Seeding ---
export const seedDatabase = async () => {
    await dbConnect();

    // Clear existing data
    await Promise.all([
        EventModel.deleteMany({}),
        UserModel.deleteMany({}),
        TicketModel.deleteMany({}),
        OrderModel.deleteMany({}),
    ]);
    
    // Seed Users
    const users = await UserModel.create([
        { name: 'Alice', email: 'alice@example.com', password: 'password', role: 'User' },
        { name: 'Admin User', email: 'admin@example.com', password: 'password', role: 'Admin' },
    ]);
    
    const adminUser = users.find(u => u.role === 'Admin');

    // Seed Events
    if (adminUser) {
        const events = await EventModel.create([
            {
                name: "Indie-Rock & Folk Night",
                description: "Join us for a magical evening with the best of indie-rock and folk music. Featuring local bands and solo artists.",
                date: new Date(new Date().setDate(new Date().getDate() + 7)),
                location: { name: "The Cultural House", lat: -0.2201, lng: -78.5123 },
                capacity: 150,
                image: "event-concert",
                ticketTypes: [
                    { id: 'tt-1-1', name: "General Admission", price: 25.00 },
                    { id: 'tt-1-2', name: "VIP", price: 50.00 }
                ],
                createdBy: adminUser._id.toString(),
            },
            {
                name: "Future of Tech Summit",
                description: "A two-day summit exploring the latest trends in AI, blockchain, and quantum computing. Network with industry leaders.",
                date: new Date(new Date().setDate(new Date().getDate() + 14)),
                location: { name: "Quito Convention Center", lat: -0.1762, lng: -78.4844 },
                capacity: 500,
                image: "event-conference",
                ticketTypes: [
                    { id: 'tt-2-1', name: "Student Pass", price: 50.00 },
                    { id: 'tt-2-2', name: "Standard Pass", price: 150.00 },
                    { id: 'tt-2-3', name: "All-Access Pass", price: 300.00 }
                ],
                createdBy: adminUser._id.toString(),
            },
            {
                name: "Modern Art Gala",
                description: "An exclusive evening celebrating modern art. The event includes a silent auction and cocktail reception.",
                date: new Date(new Date().setDate(new Date().getDate() + 21)),
                location: { name: "Metropolitan Cultural Center", lat: -0.2202, lng: -78.5125 },
                capacity: 200,
                image: "event-exhibition",
                ticketTypes: [
                    { id: 'tt-3-1', name: "Standard Entry", price: 75.00 }
                ],
                createdBy: adminUser._id.toString(),
            },
            {
                name: "Quito Street Food Festival",
                description: "A weekend-long celebration of the best street food Quito has to offer. Live music and family-friendly activities.",
                date: new Date(new Date().setDate(new Date().getDate() + 30)),
                location: { name: "Parque La Carolina", lat: -0.1822, lng: -78.4846 },
                capacity: 1000,
                image: "event-food-festival",
                ticketTypes: [
                    { id: 'tt-4-1', name: "Day Pass", price: 10.00 },
                    { id: 'tt-4-2', name: "Weekend Pass", price: 15.00 }
                ],
                createdBy: adminUser._id.toString(),
            }
        ]);

         return {
            users: users.length,
            events: events.length,
        }
    }


    return {
        users: users.length,
        events: 0,
    }
};
