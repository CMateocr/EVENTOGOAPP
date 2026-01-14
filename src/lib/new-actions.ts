'use server'

import dbConnect from "./db";
import { UserModel, EventModel, TicketModel } from "./models";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getEventById } from "./data";
import { decodeToken, createToken } from "./jwt"; 

export async function updateUserImage(email: string, imageBase64: string) {
  console.log("--> INICIO: Intentando guardar imagen para:", email);

  try {
    await dbConnect();

    const result = await UserModel.updateOne({ email }, { image: imageBase64 });
    const updatedUser = await UserModel.findOne({ email }).lean();

    if (!updatedUser) {
        return { success: false, error: "Usuario no encontrado tras actualizar" };
    }

    const userPayload = {
        id: (updatedUser as any)._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        image: updatedUser.image
    };

    const newToken = createToken(userPayload); 

    revalidatePath('/profile');
    
    return { success: true, token: newToken };

  } catch (error: any) {
    console.error("--> ERROR CRÍTICO al guardar imagen:", error);
    return { success: false, error: error.message || "Error desconocido" };
  }
}

export async function createEventWithGallery(formData: FormData, galleryImages: string[], token: string | null) {
    const user = decodeToken(token || '');
    if (!user) return { success: false, message: 'Authentication required.' };

    const rawData = Object.fromEntries(formData.entries());

    // 1. BLINDAJE: Aseguramos que 'id' sea string siempre en tickets
    const rawTickets = JSON.parse(rawData.ticketTypes as string);
    const ticketTypes = rawTickets.map((t: any) => ({
        ...t,
        id: t.id || crypto.randomUUID() 
    }));

    // 2. CORRECCIÓN: Parseamos la configuración de asientos para que no falle
    const eventTypeConfig = rawData.eventTypeConfig ? JSON.parse(rawData.eventTypeConfig as string) : undefined;

    const newEventData = {
        name: rawData.name as string,
        description: rawData.description as string,
        date: new Date(rawData.date + ":00.000-05:00"), 
        location: {
            name: rawData.locationName as string,
            lat: Number(rawData.locationLat),
            lng: Number(rawData.locationLng),
        },
        capacity: Number(rawData.capacity),
        image: rawData.image as string,
        images: galleryImages,
        ticketTypes: ticketTypes,
        eventTypeConfig: eventTypeConfig, // <--- Aquí usamos la variable corregida
        createdBy: user.id
    };

    try {
        await dbConnect();
        await EventModel.create(newEventData);
    } catch (e) {
        console.error("Error creating event:", e);
        return { success: false, message: 'Failed to create event.' };
    }

    revalidatePath('/admin/events');
    revalidatePath('/');
    revalidatePath('/discover');
    redirect('/admin/events');
}

export async function updateEventGalleryOnly(eventId: string, images: string[]) {
    try {
        await dbConnect();
        await EventModel.findByIdAndUpdate(eventId, { images: images });
        revalidatePath(`/show/event/${eventId}`);
        return { success: true };
    } catch (error) {
        return { success: false };
    }
}

export async function updateEventWithGallery(id: string, formData: FormData, galleryImages: string[], token: string | null) {
    const user = decodeToken(token || '');
    if (!user) return { success: false, message: 'Authentication required.' };

    const rawData = Object.fromEntries(formData.entries());

    const rawTickets = JSON.parse(rawData.ticketTypes as string);
    const ticketTypes = rawTickets.map((t: any) => ({
        ...t,
        id: t.id || crypto.randomUUID()
    }));

    // Parseamos la config de asientos también al editar
    const eventTypeConfig = rawData.eventTypeConfig ? JSON.parse(rawData.eventTypeConfig as string) : undefined;

    const updateData = {
        name: rawData.name as string,
        description: rawData.description as string,
        date: new Date(rawData.date + ":00.000-05:00"), 
        location: {
            name: rawData.locationName as string,
            lat: Number(rawData.locationLat),
            lng: Number(rawData.locationLng),
        },
        capacity: Number(rawData.capacity),
        image: rawData.image as string,
        images: galleryImages, 
        ticketTypes: ticketTypes,
        eventTypeConfig: eventTypeConfig,
    };

    try {
        await dbConnect();
        await EventModel.findByIdAndUpdate(id, updateData);
    } catch (e) {
        console.error("Error updating event:", e);
        return { success: false, message: 'Failed to update event.' };
    }

    revalidatePath('/admin/events');
    revalidatePath('/');
    revalidatePath(`/show/event/${id}`);
    redirect('/admin/events');
}

// --- ESTA ES LA FUNCIÓN QUE HACE QUE SE VEAN TUS TICKETS ---
export async function getMyTicketsAction(token: string) {
  try {
    const user = decodeToken(token);
    if (!user) return { success: false, message: "Sesión inválida" };

    await dbConnect();

    // AQUÍ ESTÁ EL TRUCO:
    // Buscamos el ID como texto O como objeto. Así nunca falla.
    const rawTickets = await TicketModel.find({
        $or: [
            { userId: user.id },                
            { userId: user.id.toString() }      
        ]
    }).lean();

    const ticketsByEvent: Record<string, { eventId: string, count: number, tickets: any[] }> = {};
  
    for (const ticket of rawTickets) {
        const eId = ticket.eventId.toString();
        
        if (!ticketsByEvent[eId]) {
            ticketsByEvent[eId] = { eventId: eId, count: 0, tickets: [] };
        }
        ticketsByEvent[eId].count++;
        // Convertimos _id a string para que React no se rompa
        ticketsByEvent[eId].tickets.push({ 
            ...ticket, 
            _id: ticket._id.toString(),
            eventId: eId 
        });
    }

    const myEvents = await Promise.all(
        Object.values(ticketsByEvent).map(async (group) => {
            const eventDetails = await getEventById(group.eventId);
            return {
                ...group,
                eventDetails: JSON.parse(JSON.stringify(eventDetails))
            };
        })
    );

    return { success: true, data: myEvents };

  } catch (error) {
    console.error("Error fetching tickets:", error);
    return { success: false, message: "Error al obtener tickets" };
  }
}