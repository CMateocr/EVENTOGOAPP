import { getEvents } from "@/lib/data";
import DiscoverMapLoader from "@/components/discover-map-loader";

export default async function DiscoverPage() {
    const events = await getEvents();
    
    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <div className="container mx-auto px-4 pt-8">
                <h1 className="text-4xl font-bold tracking-tight mb-4 font-headline">
                    Discover Events on Map
                </h1>
                <p className="text-muted-foreground mb-6">Explore upcoming events in Quito. Click on a marker for more details.</p>
            </div>
            <div className="flex-grow">
                 <DiscoverMapLoader events={events} />
            </div>
        </div>
    )
}
