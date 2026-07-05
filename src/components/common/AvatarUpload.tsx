'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { Camera, Loader2 } from 'lucide-react';
import { getUploadProvider } from '@/services/upload/upload.provider';
import { toast } from 'react-hot-toast';

interface AvatarUploadProps {
  value?: string;
  onChange: (url: string) => void;
}

export function AvatarUpload({ value, onChange }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(value || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);

    setIsUploading(true);
    try {
      // Use ImgBB upload provider as default
      const uploadProvider = getUploadProvider('imgbb');
      const result = await uploadProvider.upload(file);
      onChange(result.url);
      setPreviewUrl(result.url);
      toast.success('تم رفع الصورة بنجاح');
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'فشل رفع الصورة. تأكد من إعداد مفتاح API الخاص بـ ImgBB.';
      toast.error(errorMessage);
      // Revert preview on failure
      setPreviewUrl(value || null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleContainerClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        onClick={handleContainerClick}
        className="relative h-28 w-28 cursor-pointer overflow-hidden rounded-full border-2 border-primary bg-muted transition-opacity hover:opacity-90 group"
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="الصورة الشخصية"
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary/40 font-bold text-lg">
            متون
          </div>
        )}

        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Camera className="h-6 w-6 text-white" />
        </div>

        {isUploading && (
          <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
        disabled={isUploading}
      />
      
      <button
        type="button"
        onClick={handleContainerClick}
        disabled={isUploading}
        className="text-sm font-semibold text-primary hover:underline"
      >
        تغيير الصورة الشخصية
      </button>
    </div>
  );
}
