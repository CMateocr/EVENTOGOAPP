import { getEvents } from '@/lib/data';
import { HomeClient } from './home-client';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const events = await getEvents(); 

  return <HomeClient events={events} />;
}
