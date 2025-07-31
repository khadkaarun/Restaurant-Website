// Updated: 2025-07-31 05:47:54
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon, Video } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface MediaUploadProps {
  itemName: string;
  onMediaUploaded: (url: string, type: 'image' | 'video') => void;
  currentMedia?: string;
  currentType?: 'image' | 'video';
}

const MediaUpload = ({ itemName, onMediaUploaded, currentMedia, currentType = 'image' }: MediaUploadProps) => {
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
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: "Invalid file type",
        description: "Please select an image or video file",
        variant: "destructive",
      });
      return;
    }

    const maxSize = isImage ? 5 * 1024 * 1024 : 50 * 1024 * 1024; // 5MB for images, 50MB for videos
    if (file.size > maxSize) {
      const maxSizeMB = isImage ? 5 : 50;
      toast({
        title: "File too large",
        description: `Please select a ${isImage ? 'image' : 'video'} smaller than ${maxSizeMB}MB`,
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get file extension
      const fileExt = file.name.split('.').pop();
      const fileName = `${slug}.${fileExt}`;

      // Upload file to Supabase Storage (use existing menu-images bucket for gallery images)
      const bucket = isImage ? 'menu-images' : 'menu-images'; // Use menu-images for both for now
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Replace if exists
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onMediaUploaded(publicUrl, isImage ? 'image' : 'video');
      
      toast({
        title: `${isImage ? 'Image' : 'Video'} uploaded successfully`,
        description: `${isImage ? 'Image' : 'Video'} for ${itemName} has been updated`,
      });
    } catch (error) {
      console.error('Error uploading media:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload file. Please try again.",
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

  const removeMedia = async () => {
    if (!currentMedia || !slug) return;

    try {
      // Try to delete common image formats
      const imageFormats = ['webp', 'avif', 'jpg', 'jpeg', 'png'];
      const videoFormats = ['mp4', 'webm', 'mov', 'avi'];
      
      // Try to delete from menu-images bucket (where gallery files are stored)
      for (const format of [...imageFormats, ...videoFormats]) {
        const fileName = `${slug}.${format}`;
        await supabase.storage
          .from('menu-images')
          .remove([fileName]);
      }

      onMediaUploaded('', 'image');
      
      toast({
        title: "Media removed",
        description: `Media for ${itemName} has been removed`,
      });
    } catch (error) {
      console.error('Error removing media:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove media. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Current media preview */}
      {currentMedia && (
        <div className="relative">
          {currentType === 'video' ? (
            <video
              src={currentMedia}
              className="w-full h-32 object-cover rounded-lg border"
              controls
            />
          ) : (
            <img
              src={currentMedia}
              alt={itemName}
              className="w-full h-32 object-cover rounded-lg border"
            />
          )}
          <Button
            size="sm"
            variant="destructive"
            className="absolute top-2 right-2"
            onClick={removeMedia}
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
          accept="image/*,video/*"
          className="hidden"
          onChange={handleFileInputChange}
        />

        <div className="space-y-2">
          <div className="flex justify-center space-x-2">
            <ImageIcon className="w-8 h-8 text-muted-foreground" />
            <Video className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium">
              Drop an image or video here, or{' '}
              <button
                type="button"
                className="text-primary underline"
                onClick={() => fileInputRef.current?.click()}
              >
                browse
              </button>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Images: PNG, JPG, WebP up to 5MB • Videos: MP4, WebM up to 50MB
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
          {uploading ? 'Uploading...' : 'Select File'}
        </Button>
      </div>

      <div className="text-xs text-muted-foreground">
        <p><strong>File name:</strong> {slug}.{'{extension}'}</p>
        <p>Files are automatically optimized and served via CDN</p>
      </div>
    </div>
  );
};

export default MediaUpload;
