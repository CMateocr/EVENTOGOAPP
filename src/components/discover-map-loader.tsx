'use client';

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { Event } from "@/lib/types";

export default function DiscoverMapLoader({ events }: { events: Event[] }) {
    const EventMap = useMemo(() => dynamic(() => import('@/components/event-map'), {
        loading: () => <Skeleton className="w-full h-full" />,
        ssr: false
    }), []);
    
    return <EventMap events={events} />;
}
