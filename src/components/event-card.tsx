import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import type { Event } from '@/lib/types';

// --- LOGICA DE IMAGEN COMPARTIDA ---
function getEventImage(event: any) {
  if (event.images && event.images.length > 0) return event.images[0];
  if (event.image && (event.image.startsWith('http') || event.image.startsWith('data:'))) return event.image;
  // Fallback
  return 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800';
}

type EventCardProps = {
  event: Event;
};

export default function EventCard({ event }: EventCardProps) {
  const imageUrl = getEventImage(event);
  const lowestPrice = Math.min(...event.ticketTypes.map(t => t.price));

  return (
    <Card className="flex flex-col h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 duration-300 ease-in-out">
      <Link href={`/show/event/${event.id}`} className="block">
        <div className="relative h-48 w-full">
          <Image
            src={imageUrl}
            alt={event.name}
            fill
            className="object-cover"
          />
        </div>
      </Link>
      <CardHeader>
        <Link href={`/show/event/${event.id}`}>
          <CardTitle className="text-xl font-bold leading-tight hover:text-primary transition-colors">
            {event.name}
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 text-sm text-muted-foreground">
        <div className="flex items-center">
          <Calendar className="mr-2 h-4 w-4" />
          <span>{format(new Date(event.date), 'eee, MMM d, yyyy @ h:mm a')}</span>
        </div>
        <div className="flex items-center">
          <MapPin className="mr-2 h-4 w-4" />
          <span>{event.location.name}</span>
        </div>
        <div className="flex items-center">
          <Ticket className="mr-2 h-4 w-4" />
          <span>Starting from ${lowestPrice.toFixed(2)}</span>
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full bg-accent hover:bg-accent/90">
          <Link href={`/show/event/${event.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
