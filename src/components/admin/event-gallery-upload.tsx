'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react'; // Asegúrate de tener lucide-react o usa un icono simple

interface EventGalleryUploadProps {
  initialImages?: string[];
  onImagesChanged: (images: string[]) => void;
}

export function EventGalleryUpload({ initialImages = [], onImagesChanged }: EventGalleryUploadProps) {
  const [images, setImages] = useState<string[]>(initialImages);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages: string[] = [];
      Array.from(e.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newImages.push(reader.result as string);
          if (newImages.length === e.target.files!.length) {
            const updatedList = [...images, ...newImages];
            setImages(updatedList);
            onImagesChanged(updatedList);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onImagesChanged(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {images.map((img, index) => (
          <div key={index} className="relative w-32 h-48 border rounded overflow-hidden group">
             {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img} alt={`Event ${index}`} className="object-cover w-full h-full" />
            <button
              onClick={() => removeImage(index)}
              type="button"
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <Button variant="outline" type="button" onClick={() => document.getElementById('event-images')?.click()}>
          Agregar Carteles/Fotos
        </Button>
        <input
          id="event-images"
          type="file"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      <p className="text-sm text-muted-foreground">Sube imágenes verticales para mejor visualización</p>
    </div>
  );
}