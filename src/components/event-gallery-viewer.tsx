'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react'; // Asegúrate de tener lucide-react

interface EventGalleryViewerProps {
  images: string[];
  title: string;
}

export function EventGalleryViewer({ images, title }: EventGalleryViewerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Abrir modal en una foto específica
  const openImage = (index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  };

  // Navegación
  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Cerrar con tecla Escape y mover con Flechas
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') setIsOpen(false);
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (images.length === 0) return null;

  return (
    <>
      {/* 1. VISTA PREVIA (GRID) */}
      <div className="flex flex-col md:flex-row gap-6">

        {/* Imagen Principal (Click para abrir) */}
        <div
          className="w-full md:w-1/2 cursor-zoom-in group relative rounded-2xl overflow-hidden shadow-2xl border border-white/10"
          onClick={() => openImage(0)}
        >
           <img
             src={images[0]}
             alt={`${title} main`}
             className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
           />
           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 bg-black/60 text-white px-4 py-2 rounded-full backdrop-blur-md text-sm font-bold transition-opacity">
                 Ver Pantalla Completa
              </span>
           </div>
        </div>

        {/* Miniaturas a la derecha (si hay más) */}
        {images.length > 1 && (
            <div className="grid grid-cols-3 md:grid-cols-2 gap-3 content-start w-full md:w-1/4">
                {images.slice(1).map((img, idx) => (
                    <div
                      key={idx + 1}
                      className="cursor-pointer rounded-lg overflow-hidden border border-white/10 hover:border-yellow-500/50 transition-colors relative aspect-square group"
                      onClick={() => openImage(idx + 1)}
                    >
                        <img src={img} className="w-full h-full object-cover" alt="Gallery" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-white/10 transition-colors" />
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* 2. MODAL LIGHTBOX (PANTALLA COMPLETA) */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-200">

            {/* Botón Cerrar */}
            <button
                onClick={() => setIsOpen(false)}
                className="absolute top-6 right-6 text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-all z-50"
            >
                <X className="w-8 h-8" />
            </button>

            {/* Navegación Izquierda */}
            <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                className="absolute left-4 md:left-8 text-white/50 hover:text-yellow-400 p-3 rounded-full hover:bg-white/10 transition-all z-50"
            >
                <ChevronLeft className="w-10 h-10" />
            </button>

            {/* IMAGEN CENTRAL */}
            <div className="relative max-w-7xl max-h-[90vh] flex flex-col items-center">
                <img
                    src={images[currentIndex]}
                    alt="Full screen"
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-[0_0_50px_rgba(0,0,0,0.5)]"
                />
                <p className="text-gray-400 mt-4 font-mono text-sm">
                    {currentIndex + 1} / {images.length}
                </p>
            </div>

            {/* Navegación Derecha */}
            <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                className="absolute right-4 md:right-8 text-white/50 hover:text-yellow-400 p-3 rounded-full hover:bg-white/10 transition-all z-50"
            >
                <ChevronRight className="w-10 h-10" />
            </button>
        </div>
      )}
    </>
  );
}