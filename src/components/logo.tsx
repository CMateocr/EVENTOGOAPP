import Link from 'next/link';
import { Ticket } from 'lucide-react';

export default function Logo() {
  return (
    <Link href="/" className="flex items-center space-x-2" aria-label="Event Go Home">
      <Ticket className="h-6 w-6 text-yellow-400" />
      <span className="font-bold text-lg font-headline text-yellow-400">Event Go</span>
    </Link>
  );
}
