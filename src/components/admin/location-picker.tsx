'use client';

import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import "leaflet-defaulticon-compatibility";

type LocationPickerProps = {
  position: { lat: number; lng: number };
  onPositionChange: (position: { lat: number; lng: number }) => void;
};

function DraggableMarker({ position, onPositionChange }: LocationPickerProps) {
  const [markerPosition, setMarkerPosition] = useState(new L.LatLng(position.lat, position.lng));

  const map = useMapEvents({
    click(e) {
      setMarkerPosition(e.latlng);
      onPositionChange(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  const eventHandlers = useMemo(
    () => ({
      dragend(e: L.DragEndEvent) {
        const newPos = e.target.getLatLng();
        setMarkerPosition(newPos);
        onPositionChange(newPos);
      },
    }),
    [onPositionChange],
  );

  return (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={markerPosition}
    />
  );
}

export default function LocationPicker({ position, onPositionChange }: LocationPickerProps) {
  const quitoPosition: L.LatLngTuple = [position.lat, position.lng];

  return (
    <MapContainer center={quitoPosition} zoom={13} className="w-full h-full">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <DraggableMarker position={position} onPositionChange={onPositionChange} />
    </MapContainer>
  );
}
