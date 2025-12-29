'use client';

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

type LocationPickerLoaderProps = {
    position: { lat: number; lng: number };
    onPositionChange: (position: { lat: number; lng: number }) => void;
};

const LocationPicker = dynamic(() => import('@/components/admin/location-picker'), {
    loading: () => <Skeleton className="w-full h-full" />,
    ssr: false
});

export default function LocationPickerLoader(props: LocationPickerLoaderProps) {
    return <LocationPicker {...props} />;
}
