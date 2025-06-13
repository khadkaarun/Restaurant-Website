import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ResponsiveImageProps {
  itemName: string;
  alt: string;
  className?: string;
}

const ResponsiveImage = ({ itemName, alt, className = "" }: ResponsiveImageProps) => {
  const [imageSrc, setImageSrc] = useState<string>('/placeholder.svg');
  const [loading, setLoading] = useState(true);
  
  // Convert item name to URL-friendly slug
  const slug = itemName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')         // Replace spaces with hyphens
    .replace(/-+/g, '-')          // Replace multiple hyphens with single
    .trim();

  useEffect(() => {
    const loadImage = async () => {
      try {
        // Try different image formats in order of preference
        const formats = ['webp', 'avif', 'jpg', 'jpeg', 'png'];
        
        for (const format of formats) {
          const imagePath = `${slug}.${format}`;
          
          // Get public URL for the image
          const { data } = supabase.storage
            .from('menu-images')
            .getPublicUrl(imagePath);
          
          if (data?.publicUrl) {
            // Check if image exists by trying to load it
            const imageExists = await checkImageExists(data.publicUrl);
            if (imageExists) {
              setImageSrc(data.publicUrl);
              setLoading(false);
              return;
            }
          }
        }
        
        // If no image found, keep placeholder
        setLoading(false);
      } catch (error) {
        console.error('Error loading image:', error);
        setLoading(false);
      }
    };

    loadImage();
  }, [slug]);

  const checkImageExists = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  if (loading) {
    return (
      <div className={`${className} bg-muted animate-pulse flex items-center justify-center`}>
        <div className="text-muted-foreground text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setImageSrc('/placeholder.svg')}
    />
  );
};

export default ResponsiveImage;