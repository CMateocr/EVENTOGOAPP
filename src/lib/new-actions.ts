'use server'

import dbConnect from "./db";
import { UserModel, EventModel } from "./models";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createEvent as createEventInDb } from "./data";
import { decodeToken } from "./jwt";

// --- PERFIL: Actualizar Foto (CON LOGS) ---
export async function updateUserImage(email: string, imageBase64: string) {
  console.log("--> INICIO: Intentando guardar imagen para:", email);
  console.log("--> Tamaño de imagen recibida:", imageBase64.length, "caracteres");

  try {
    console.log("--> Conectando a DB...");
    await dbConnect();
    console.log("--> DB Conectada.");

    // Buscamos si el usuario existe antes de actualizar
    const userExists = await UserModel.findOne({ email });
    if (!userExists) {
        console.error("--> ERROR: Usuario no encontrado en DB con email:", email);
        return { success: false, error: "Usuario no encontrado" };
    }

    console.log("--> Usuario encontrado. Actualizando campo image...");
    const result = await UserModel.updateOne({ email }, { image: imageBase64 });
    console.log("--> Resultado Mongo:", result);

    if (result.modifiedCount === 0 && result.matchedCount === 1) {
        console.log("--> AVISO: La imagen era la misma, no hubo cambios.");
    }

    revalidatePath('/profile');
    console.log("--> ÉXITO: Imagen guardada y path revalidado.");
    return { success: true };

  } catch (error: any) {
    console.error("--> ERROR CRÍTICO al guardar imagen:", error);
    return { success: false, error: error.message || "Error desconocido en servidor" };
  }
}

// ... Mantén el resto de funciones de eventos igual ...
export async function createEventWithGallery(formData: FormData, galleryImages: string[], token: string | null) {
    console.log("--> RECIBIENDO EVENTO");
    console.log("--> FOTOS EN GALERÍA:", galleryImages.length); // <--- DEBE DECIR MÁS DE 0
    const user = decodeToken(token || '');
    if (!user) return { success: false, message: 'Authentication required.' };

    const rawData = Object.fromEntries(formData.entries());
    
    // Parsear ticketTypes desde JSON string (como en actions.ts original)
    let ticketTypes: { id?: string; name: string; price: number }[] = [];
    try {
      ticketTypes = JSON.parse(rawData.ticketTypes as string);
    } catch (e) {
      console.error("Error parsing ticketTypes:", e);
      ticketTypes = [];
    }
    
    // Parsear eventTypeConfig si existe
    let eventTypeConfig = undefined;
    if (rawData.eventTypeConfig) {
      try {
        eventTypeConfig = JSON.parse(rawData.eventTypeConfig as string);
      } catch (e) {
        console.error("Error parsing eventTypeConfig:", e);
      }
    }
    
    const newEventData = {
        name: rawData.name as string,
        description: rawData.description as string,
        // TRUCO: Le agregamos el offset de Ecuador (-05:00) a la fecha cruda para que se guarde bien
        date: new Date(rawData.date as string + ":00.000-05:00"), 
        location: {
            name: rawData.locationName as string,
            lat: Number(rawData.locationLat),
            lng: Number(rawData.locationLng),
        },
        capacity: Number(rawData.capacity),
        image: rawData.image as string, 
        images: galleryImages,          
        ticketTypes: ticketTypes,
        createdBy: user.id,
        eventTypeConfig: eventTypeConfig,
    };

    try {
        await dbConnect(); // Aseguramos conexión aquí también
        await createEventInDb(newEventData); 
    } catch (e) {
        console.error("Error creating event:", e);
        return { success: false, message: 'Failed to create event.' };
    }
    
    revalidatePath('/admin/events');
    revalidatePath('/show'); 
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
    const ticketTypes = JSON.parse(rawData.ticketTypes as string);

    // Parsear eventTypeConfig si existe
    let eventTypeConfig = undefined;
    if (rawData.eventTypeConfig) {
      try {
        eventTypeConfig = JSON.parse(rawData.eventTypeConfig as string);
      } catch (e) {
        console.error("Error parsing eventTypeConfig:", e);
      }
    }

    // Preparamos los datos igual que al crear (incluyendo el arreglo de fecha)
    const updateData = {
        name: rawData.name as string,
        description: rawData.description as string,
        // Mantenemos el ajuste de zona horaria para que no se cambie la hora al editar
        date: new Date(rawData.date as string + ":00.000-05:00"), 
        location: {
            name: rawData.locationName as string,
            lat: Number(rawData.locationLat),
            lng: Number(rawData.locationLng),
        },
        capacity: Number(rawData.capacity),
        image: rawData.image as string,
        images: galleryImages, // <--- Actualizamos la galería
        ticketTypes: ticketTypes,
        eventTypeConfig: eventTypeConfig,
    };

    try {
        await dbConnect();
        // Buscamos por ID y actualizamos
        await EventModel.findByIdAndUpdate(id, updateData);
    } catch (e) {
        console.error("Error updating event:", e);
        return { success: false, message: 'Failed to update event.' };
    }

    // Revalidamos para que se vean los cambios
    revalidatePath('/admin/events');
    revalidatePath(`/show/event/${id}`);
    
    // Redirigimos a la lista
    redirect('/admin/events');
}