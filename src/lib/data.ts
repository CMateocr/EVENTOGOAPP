
import dbConnect from './db';
import { EventModel, UserModel, TicketModel, OrderModel } from './models';
import type { Event, User, Ticket, Order, TicketType } from './types';
import { PlaceHolderImages } from './placeholder-images';
import { Types } from 'mongoose';


const DEMO_EVENTS: Event[] = [
    {
        id: "evt-1",
        name: "Indie-Rock & Folk Night",
        description: "Join us for a magical evening with the best of indie-rock and folk music. Featuring local bands and solo artists.",
        date: new Date(new Date().setDate(new Date().getDate() + 7)),
        location: { name: "The Cultural House", lat: -0.2201, lng: -78.5123 },
        capacity: 150,
        image: "event-concert",
        ticketTypes: [
            { id: 'tt-1-1', name: "General Admission", price: 25.00 },
            { id: 'tt-1-2', name: "VIP", price: 50.00 }
        ]
    },
    {
        id: "evt-2",
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
        ]
    },
     {
        id: "evt-3",
        name: "Modern Art Gala",
        description: "An exclusive evening celebrating modern art. The event includes a silent auction and cocktail reception.",
        date: new Date(new Date().setDate(new Date().getDate() + 21)),
        location: { name: "Metropolitan Cultural Center", lat: -0.2202, lng: -78.5125 },
        capacity: 200,
        image: "event-exhibition",
        ticketTypes: [
            { id: 'tt-3-1', name: "Standard Entry", price: 75.00 }
        ]
    },
    {
        id: "evt-4",
        name: "Quito Street Food Festival",
        description: "A weekend-long celebration of the best street food Quito has to offer. Live music and family-friendly activities.",
        date: new Date(new Date().setDate(new Date().getDate() + 30)),
        location: { name: "Parque La Carolina", lat: -0.1822, lng: -78.4846 },
        capacity: 1000,
        image: "event-food-festival",
        ticketTypes: [
            { id: 'tt-4-1', name: "Day Pass", price: 10.00 },
            { id: 'tt-4-2', name: "Weekend Pass", price: 15.00 }
        ]
    }
];

const DEMO_USERS: User[] = [
    { id: 'usr-1', name: 'Alice', email: 'alice@example.com', password: 'password', role: 'User' },
    { id: 'usr-admin', name: 'Admin', email: 'admin@example.com', password: 'password', role: 'Admin' },
];

let demoOrders: Order[] = [];
let demoTickets: Ticket[] = [];


// --- Event Functions ---
export const getEvents = async (): Promise<Event[]> => {
  const conn = await dbConnect();
  if (!conn) {
    return DEMO_EVENTS.filter(event => event.date >= new Date());
  }
  const events = await EventModel.find({ date: { $gte: new Date() } }).lean();
  return JSON.parse(JSON.stringify(events));
};

export const getEventById = async (id: string): Promise<Event | undefined> => {
  const conn = await dbConnect();
  if (!conn) {
    return DEMO_EVENTS.find(event => event.id === id);
  }
  const event = await EventModel.findById(id).lean();
  return JSON.parse(JSON.stringify(event));
};

// --- User Functions ---
export const findUserByEmail = async (email: string): Promise<User | undefined> => {
  const conn = await dbConnect();
   if (!conn) {
    return DEMO_USERS.find(user => user.email === email);
  }
  const user = await UserModel.findOne({ email }).lean();
  if (user) {
    const { _id, ...rest } = user as any;
    return { id: _id.toString(), ...rest } as User;
  }
  return undefined;
};

export const findUserById = async (id: string): Promise<User | undefined> => {
    const conn = await dbConnect();
    if (!conn) {
        return DEMO_USERS.find(user => user.id === id);
    }
  const user = await UserModel.findById(id).lean();
   if (user) {
    const { _id, ...rest } = user as any;
    return { id: _id.toString(), ...rest } as User;
  }
  return undefined;
};

export const createUser = async (name: string, email: string, password: string): Promise<User> => {
    const conn = await dbConnect();
    if (!conn) {
        const newUser: User = {
            id: `usr-${Date.now()}`,
            name,
            email,
            password,
            role: 'User'
        };
        DEMO_USERS.push(newUser);
        return newUser;
    }
  const newUser = await UserModel.create({ name, email, password, role: 'User' });
  const { _id, ...rest } = newUser.toObject();
  return { id: _id.toString(), ...rest };
};

// --- Ticket/Order Functions ---
export const createOrder = async (
  userId: string,
  eventId: string,
  ticketSelections: { ticketTypeId: string; quantity: number }[]
): Promise<Order> => {
  const conn = await dbConnect();
  if (!conn) {
    const event = DEMO_EVENTS.find(e => e.id === eventId);
    if (!event) throw new Error('Event not found');

    let totalAmount = 0;
    const createdTickets: Ticket[] = [];

    for (const selection of ticketSelections) {
        const ticketType = event.ticketTypes.find(tt => tt.id === selection.ticketTypeId);
        if (!ticketType) throw new Error(`Ticket type ${selection.ticketTypeId} not found`);

        totalAmount += ticketType.price * selection.quantity;

        for (let i = 0; i < selection.quantity; i++) {
            const ticketId = `t-${Date.now()}-${Math.random()}`;
            const newTicket: Ticket = {
                id: ticketId,
                orderId: '', // will be set later
                eventId,
                userId,
                ticketTypeId: selection.ticketTypeId,
                qrData: JSON.stringify({ ticketId, eventId, userId }),
                status: 'valid'
            };
            createdTickets.push(newTicket);
        }
    }
    
    demoTickets.push(...createdTickets);

    const newOrder: Order = {
        id: `ord-${Date.now()}`,
        userId,
        eventId,
        tickets: createdTickets.map(t => t.id),
        totalAmount,
        createdAt: new Date(),
    };

    demoOrders.push(newOrder);

    // Assign orderId to tickets
    createdTickets.forEach(t => t.orderId = newOrder.id);
    
    return { ...newOrder, tickets: createdTickets };
  }

  const event = await getEventById(eventId);
  if (!event) throw new Error('Event not found');

  const newTickets: any[] = [];
  let totalAmount = 0;
  
  for (const selection of ticketSelections) {
    const ticketType = event.ticketTypes.find(tt => tt.id === selection.ticketTypeId);
    if (!ticketType) throw new Error(`Ticket type ${selection.ticketTypeId} not found`);

    totalAmount += ticketType.price * selection.quantity;

    for (let i = 0; i < selection.quantity; i++) {
        const newTicketData = {
            eventId,
            userId,
            ticketTypeId: selection.ticketTypeId,
            status: 'valid',
            qrData: 'placeholder' // temp qrData
        };
        newTickets.push(newTicketData);
    }
  }

  const createdTickets = await TicketModel.insertMany(newTickets);
  const ticketIds = createdTickets.map(t => t._id);

  const newOrder = await OrderModel.create({
    userId,
    eventId,
    tickets: ticketIds,
    totalAmount,
    createdAt: new Date(),
  });
  
  // Update QR data and orderId after tickets and order are created
  for (const ticket of createdTickets) {
      const qrData = JSON.stringify({ ticketId: ticket._id.toString(), eventId, userId });
      await TicketModel.findByIdAndUpdate(ticket._id, { qrData, orderId: newOrder._id.toString() });
  }

  const finalOrder = await OrderModel.findById(newOrder._id).populate('tickets').lean();
  return JSON.parse(JSON.stringify(finalOrder));
};

export const getTicketsByUserId = async (userId: string): Promise<Ticket[]> => {
    const conn = await dbConnect();
    if (!conn) {
        return demoTickets.filter(t => t.userId === userId);
    }
    const tickets = await TicketModel.find({ userId }).lean();
    return JSON.parse(JSON.stringify(tickets.map(t => ({...t, id: t._id.toString()}))));
}

export const getTicketById = async (ticketId: string): Promise<Ticket | undefined> => {
    const conn = await dbConnect();
    if (!conn) {
        return demoTickets.find(t => t.id === ticketId);
    }
    const ticket = await TicketModel.findById(ticketId).lean();
    if (ticket) {
        return JSON.parse(JSON.stringify({...ticket, id: ticket._id.toString()}));
    }
    return undefined;
}

export const validateAndUseTicket = async (ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket, event?: Event }> => {
    const conn = await dbConnect();
    if(!conn) {
        const ticket = demoTickets.find(t => t.id === ticketId);
        if (!ticket) {
            return { success: false, message: "Invalid Ticket: Not found." };
        }
        const event = DEMO_EVENTS.find(e => e.id === ticket.eventId);
        if (ticket.status === 'used') {
            return { success: false, message: "Ticket Already Used.", ticket, event };
        }
        ticket.status = 'used';
        return { success: true, message: "Ticket Validated Successfully.", ticket, event };
    }

    const ticket = await TicketModel.findById(ticketId).lean();
    if(!ticket) {
        return { success: false, message: "Invalid Ticket: Not found." };
    }

    const event = await getEventById(ticket.eventId);
    if (ticket.status === 'used') {
        return { success: false, message: "Ticket Already Used.", ticket: JSON.parse(JSON.stringify({...ticket, id: ticket._id.toString()})), event };
    }

    const updatedTicket = await TicketModel.findByIdAndUpdate(ticketId, { status: 'used' }, { new: true }).lean();
    return { success: true, message: "Ticket Validated Successfully.", ticket: JSON.parse(JSON.stringify({...updatedTicket, id: updatedTicket!._id.toString()})), event };
}
