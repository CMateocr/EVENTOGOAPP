'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import "leaflet-defaulticon-compatibility";
import type { Event } from '@/lib/types';
import { Button } from './ui/button';
import Link from 'next/link';
import { format } from 'date-fns';

export default function EventMap({ events }: { events: Event[] }) {
  const quitoPosition: [number, number] = [-0.180653, -78.467834];

  return (
    <MapContainer center={quitoPosition} zoom={12} scrollWheelZoom={true} className="w-full h-full rounded-lg overflow-hidden">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {events.map((event) => (
        <Marker 
            key={event.id}
            position={[event.location.lat, event.location.lng]}
        >
          <Popup>
            <div className="p-1 w-60">
                <h4 className="font-bold text-md mb-1">{event.name}</h4>
                <p className="text-xs text-muted-foreground mb-2">{format(new Date(event.date), 'MMM d, yyyy')}</p>
                <Button size="sm" asChild>
                    <Link href={`/events/${event.id}`}>View Details</Link>
                </Button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
