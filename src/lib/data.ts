import dbConnect from './db';
import { EventModel, UserModel, TicketModel, OrderModel } from './models';
import type { Event, User, Ticket, Order, TicketType } from './types';


// --- Event Functions ---
export const getEvents = async (): Promise<Event[]> => {
  await dbConnect();
  const events = await EventModel.find({ date: { $gte: new Date() } }).lean();
  return JSON.parse(JSON.stringify(events));
};

export const getEventById = async (id: string): Promise<Event | undefined> => {
  await dbConnect();
  const event = await EventModel.findById(id).lean();
  return JSON.parse(JSON.stringify(event));
};

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
  const user = await UserModel.findById(id).lean();
   if (user) {
    const { _id, ...rest } = user as any;
    return { id: _id.toString(), ...rest } as User;
  }
  return undefined;
};

export const createUser = async (name: string, email: string, password: string): Promise<User> => {
  await dbConnect();
  // In a real app, password should be hashed
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
  await dbConnect();
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
            status: 'valid'
        };
        newTickets.push(newTicketData);
    }
  }

  const createdTickets = await TicketModel.insertMany(newTickets);

  const ticketIds = createdTickets.map(t => t._id);

  // Update QR data after tickets are created and have IDs
  for (const ticket of createdTickets) {
      const qrData = JSON.stringify({ ticketId: ticket._id.toString(), eventId, userId });
      await TicketModel.findByIdAndUpdate(ticket._id, { qrData, orderId: '' }); // temp orderId
  }

  const newOrder = await OrderModel.create({
    userId,
    eventId,
    tickets: ticketIds,
    totalAmount,
    createdAt: new Date(),
  });

  // Now update tickets with the real orderId
  await TicketModel.updateMany({ _id: { $in: ticketIds } }, { orderId: newOrder._id.toString() });

  const finalOrder = await OrderModel.findById(newOrder._id).populate('tickets').lean();

  return JSON.parse(JSON.stringify(finalOrder));
};

export const getTicketsByUserId = async (userId: string): Promise<Ticket[]> => {
    await dbConnect();
    const tickets = await TicketModel.find({ userId }).lean();
    return JSON.parse(JSON.stringify(tickets.map(t => ({...t, id: t._id.toString()}))));
}

export const getTicketById = async (ticketId: string): Promise<Ticket | undefined> => {
    await dbConnect();
    const ticket = await TicketModel.findById(ticketId).lean();
    if (ticket) {
        return JSON.parse(JSON.stringify({...ticket, id: ticket._id.toString()}));
    }
    return undefined;
}

export const validateAndUseTicket = async (ticketId: string): Promise<{ success: boolean; message: string; ticket?: Ticket, event?: Event }> => {
    await dbConnect();
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

// Remove this import if it's not used
import { Types } from 'mongoose';
