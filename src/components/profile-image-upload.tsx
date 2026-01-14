'use client';

import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileImageUploadProps {
  currentImage?: string;
  onImageSelected: (base64Image: string) => void;
}

export function ProfileImageUpload({ currentImage, onImageSelected }: ProfileImageUploadProps) {
  const [preview, setPreview] = useState<string | undefined>(currentImage);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPreview(base64String);
        onImageSelected(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-semibold">Foto de Perfil</h3>
      <Avatar className="w-24 h-24">
        <AvatarImage src={preview} alt="Profile" />
        <AvatarFallback className="text-2xl">YO</AvatarFallback>
      </Avatar>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="picture">Cambiar foto</Label>
        <Input id="picture" type="file" accept="image/*" onChange={handleFileChange} />
      </div>
    </div>
  );
}