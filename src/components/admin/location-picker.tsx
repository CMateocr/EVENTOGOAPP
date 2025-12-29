'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import "leaflet-defaulticon-compatibility";

type LocationPickerProps = {
  position: { lat: number; lng: number };
  onPositionChange: (position: { lat: number; lng: number }) => void;
};

export default function LocationPicker({ position, onPositionChange }: LocationPickerProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<L.Map | null>(null);
    const markerInstance = useRef<L.Marker | null>(null);
    const quitoPosition: L.LatLngTuple = [position.lat, position.lng];

    useEffect(() => {
        if (mapRef.current && !mapInstance.current) {
            // Initialize map
            mapInstance.current = L.map(mapRef.current).setView(quitoPosition, 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(mapInstance.current);

            // Initialize marker
            markerInstance.current = L.marker(quitoPosition, { draggable: true }).addTo(mapInstance.current);

            // Marker drag event
            markerInstance.current.on('dragend', () => {
                if (markerInstance.current) {
                    const newPos = markerInstance.current.getLatLng();
                    onPositionChange(newPos);
                }
            });

            // Map click event
            mapInstance.current.on('click', (e) => {
                if (markerInstance.current) {
                    markerInstance.current.setLatLng(e.latlng);
                    onPositionChange(e.latlng);
                }
                 if(mapInstance.current) {
                    mapInstance.current.flyTo(e.latlng, mapInstance.current.getZoom());
                }
            });
        }
        
        // Cleanup function
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []); // Empty dependency array ensures this runs only once

    // Update marker position if the prop changes from outside
    useEffect(() => {
        if (markerInstance.current && position.lat !== markerInstance.current.getLatLng().lat || position.lng !== markerInstance.current.getLatLng().lng) {
            const newLatLng = L.latLng(position.lat, position.lng);
            markerInstance.current.setLatLng(newLatLng);
            if (mapInstance.current) {
                mapInstance.current.setView(newLatLng);
            }
        }
    }, [position]);


  return (
    <div ref={mapRef} className="w-full h-full" />
  );
}
