// Updated: 2025-07-29 16:30:04
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ImageUploadProps {
  itemName: string;
  onImageUploaded: (url: string) => void;
  currentImage?: string;
}

const ImageUpload = ({ itemName, onImageUploaded, currentImage }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert item name to URL-friendly slug
  const slug = itemName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get file extension
      const fileExt = file.name.split('.').pop();
      const fileName = `${slug}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Replace if exists
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('menu-images')
        .getPublicUrl(fileName);

      onImageUploaded(publicUrl);
      
      toast({
        title: "Image uploaded successfully",
        description: `Image for ${itemName} has been updated`,
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const removeImage = async () => {
    if (!currentImage || !slug) return;

    try {
      // Try to delete common image formats
      const formats = ['webp', 'avif', 'jpg', 'jpeg', 'png'];
      
      for (const format of formats) {
        const fileName = `${slug}.${format}`;
        await supabase.storage
          .from('menu-images')
          .remove([fileName]);
      }

      onImageUploaded('');
      
      toast({
        title: "Image removed",
        description: `Image for ${itemName} has been removed`,
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Current image preview */}
      {currentImage && (
        <div className="relative">
          <img
            src={currentImage}
            alt={itemName}
            className="w-full h-32 object-cover rounded-lg border"
          />
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={removeImage}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="space-y-2">
          <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Drop an image here, or{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PNG, JPG, WebP up to 5MB
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? 'Uploading...' : 'Select Image'}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        <p><strong>File name:</strong> {slug}.{'{extension}'}</p>
        <p>Images are automatically optimized and served via CDN</p>
      </div>
    </div>
  );
};

export default ImageUpload;