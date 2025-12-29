'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { findUserByEmail, createNewUser, createOrder as createNewOrder, validateAndUseTicket as validateTicketInDb, createEvent as createEventInDb, updateEvent as updateEventInDb, deleteEvent as deleteEventFromDb, seedDatabase as seedDatabaseInDb, getEvents, getEventById, getTicketsByUserId, updateUser as updateUserInDb, findUserById } from './data';
import { revalidatePath } from 'next/cache';
import type { Event, User } from './types';
import { createToken, decodeToken } from './jwt';

const loginSchema = z.object({
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function login(formData: FormData) {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { email, password } = validatedFields.data;
  const user = await findUserByEmail(email);

  if (!user || user.password !== password) {
    return {
      success: false,
      message: 'Invalid email or password.',
    };
  }
  
  const { password: _, ...userPayload } = user;
  const token = createToken(userPayload);
  
  return { success: true, token };
}

const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short.'),
  email: z.string().email('Invalid email address.'),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
});

export async function register(formData: FormData) {
  const validatedFields = registerSchema.safeParse(Object.fromEntries(formData.entries()));
  
  if (!validatedFields.success) {
    return {
      success: false,
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = validatedFields.data;
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    return {
        success: false,
        message: 'A user with this email already exists.',
    };
  }
  
  const user = await createNewUser(name, email, password);
  
  const { password: _, ...userPayload } = user;
  const token = createToken(userPayload);
  
  return { success: true, token };
}

export async function purchaseTickets(eventId: string, ticketSelections: {ticketTypeId: string, quantity: number}[], token: string | null) {
  if (!token) {
    return { success: false, message: 'You must be logged in to purchase tickets.' };
  }
  
  const userPayload = decodeToken(token);
  if (!userPayload) {
    return { success: false, message: 'Invalid session. Please log in again.' };
  }

  try {
    await createNewOrder(userPayload.id, eventId, ticketSelections);
    revalidatePath('/tickets');
    return { success: true, message: 'Tickets purchased successfully!' };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
    return { success: false, message: errorMessage };
  }
}

export async function validateTicket(prevState: any, formData: FormData) {
    const qrData = formData.get('qrData') as string;
    if (!qrData) {
        return { status: 'error', message: 'QR data is missing.' };
    }

    try {
        const { ticketId } = JSON.parse(qrData);
        if (!ticketId) {
            return { status: 'error', message: 'Invalid QR data format.' };
        }

        const result = await validateTicketInDb(ticketId);
        revalidatePath('/tickets');

        if (result.success) {
            return { status: 'success', message: result.message, eventName: result.event?.name };
        } else {
            return { status: 'error', message: result.message, eventName: result.event?.name };
        }
    } catch (error) {
        return { status: 'error', message: 'Invalid QR code. Please scan a valid Event Go ticket.' };
    }
}

const eventSchema = z.object({
    name: z.string().min(3, 'Event name must be at least 3 characters.'),
    description: z.string().min(10, 'Description must be at least 10 characters.'),
    date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Invalid date.'),
    locationName: z.string().min(3, 'Location name is required.'),
    locationLat: z.coerce.number().min(-90).max(90),
    locationLng: z.coerce.number().min(-180).max(180),
    capacity: z.coerce.number().int().min(1, 'Capacity must be at least 1.'),
    image: z.string().min(1, 'Image placeholder is required.'),
    ticketTypes: z.string().min(1, 'At least one ticket type is required.')
});

export async function createEvent(formData: FormData, token: string | null) {
    const user = decodeToken(token || '');
    if (!user) {
        return { success: false, message: 'Authentication required.' };
    }

    const validated = eventSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validated.success) {
        return { success: false, message: 'Invalid data.', errors: validated.error.flatten().fieldErrors };
    }

    const { ticketTypes, date, locationLat, locationLng, locationName, ...restOfData } = validated.data;

    try {
        const newEvent: Omit<Event, 'id'> = {
            ...restOfData,
            date: new Date(date),
            location: {
                name: locationName,
                lat: locationLat,
                lng: locationLng,
            },
            ticketTypes: JSON.parse(ticketTypes),
            createdBy: user.id,
        };
        await createEventInDb(newEvent);
        
    } catch (e) {
        const errorMessage = e instanceof Error ? e.message : 'Failed to create event.';
        return { success: false, message: errorMessage };
    }
    
    revalidatePath('/admin/events');
    revalidatePath('/');
    revalidatePath('/discover');
    redirect('/admin/events');
}

export async function updateEvent(id: string, formData: FormData, token: string | null) {
    const user = decodeToken(token || '');
    if (!user) {
        return { success: false, message: 'Authentication required.' };
    }

    const eventToUpdate = await getEventById(id);
    if (eventToUpdate?.createdBy !== user.id) {
        return { success: false, message: 'You are not authorized to update this event.' };
    }


    const validated = eventSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validated.success) {
        return { success: false, message: 'Invalid data.', errors: validated.error.flatten().fieldErrors };
    }
    const { ticketTypes, date, locationLat, locationLng, locationName, ...restOfData } = validated.data;
    try {
         const updatedEvent: Partial<Omit<Event, 'id'>> = {
            ...restOfData,
            date: new Date(date),
            location: {
                name: locationName,
                lat: locationLat,
                lng: locationLng,
            },
            ticketTypes: JSON.parse(ticketTypes),
        };
        await updateEventInDb(id, updatedEvent);
        
    } catch (e) {
        return { success: false, message: 'Failed to update event.' };
    }
    
    revalidatePath('/admin/events');
    revalidatePath(`/events/${id}`);
    revalidatePath('/');
    revalidatePath('/discover');
    redirect('/admin/events');
}

export async function deleteEvent(id: string, token: string | null) {
     const user = decodeToken(token || '');
    if (!user) {
        throw new Error('Authentication required.');
    }
    const eventToDelete = await getEventById(id);
    if (eventToDelete?.createdBy !== user.id) {
         throw new Error('You are not authorized to delete this event.');
    }

    try {
        await deleteEventFromDb(id);
        revalidatePath('/admin/events');
        revalidatePath('/');
        revalidatePath('/discover');
    } catch (e) {
        throw new Error('Failed to delete event.');
    }
}

export async function seedDatabase() {
    try {
        await seedDatabaseInDb();
        revalidatePath('/admin/events');
        revalidatePath('/');
        revalidatePath('/discover');
        return { success: true, message: "Database seeded successfully!" };
    } catch (e) {
        return { success: false, message: "Failed to seed database." };
    }
}

const profileSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters.'),
    role: z.enum(['Admin', 'User']),
});


export async function updateUserProfile(formData: FormData, token: string | null) {
    const user = decodeToken(token || '');
    if (!user) {
        return { success: false, message: 'Authentication required.' };
    }

    const validated = profileSchema.safeParse(Object.fromEntries(formData.entries()));

    if (!validated.success) {
        return { success: false, message: 'Invalid data.', errors: validated.error.flatten().fieldErrors };
    }

    try {
        const updatedUser = await updateUserInDb(user.id, validated.data);
        if (updatedUser) {
            const { password, ...userPayload } = updatedUser;
            const newToken = createToken(userPayload);
            return { success: true, message: 'Profile updated successfully!', token: newToken };
        }
        return { success: false, message: 'Failed to update profile.' };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return { success: false, message: errorMessage };
    }
}


// Server actions to fetch data on the client
export async function getEventsAction(includePast = false, createdBy?: string) {
    return getEvents(includePast, createdBy);
}

export async function getEventByIdAction(id: string) {
    return getEventById(id);
}

export async function getTicketsByUserIdAction(userId: string) {
    return getTicketsByUserId(userId);
}
