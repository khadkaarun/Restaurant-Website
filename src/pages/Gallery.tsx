// Updated: 2025-07-29 16:30:20
// Updated: 2025-07-29 16:30:09
// Updated: 2025-07-29 16:30:08
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';

interface GalleryItem {
  id: string;
  image_url: string;
  caption?: string;
  type: 'image' | 'video';
  created_at: string;
}

const Gallery = () => {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGalleryItems = async () => {
      try {
        const { data, error } = await supabase
          .from('gallery_items')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setGalleryItems((data || []) as GalleryItem[]);
      } catch (error) {
        console.error('Error fetching gallery items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryItems();
  }, []);

  // Sample gallery items for now
  const sampleItems: GalleryItem[] = [
    {
      id: '1',
      image_url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?auto=format&fit=crop&w=800&q=80',
      caption: 'Exquisite plating artistry',
      type: 'image' as const,
      created_at: new Date().toISOString()
    },
    {
      id: '2', 
      image_url: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=800&q=80',
      caption: 'Fresh ingredients, exceptional taste',
      type: 'image' as const,
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      image_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=800&q=80',
      caption: 'Elegant dining atmosphere',
      type: 'image' as const,
      created_at: new Date().toISOString()
    },
    {
      id: '4',
      image_url: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&w=800&q=80',
      caption: 'Masterfully crafted desserts',
      type: 'image' as const,
      created_at: new Date().toISOString()
    },
    {
      id: '5',
      image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80',
      caption: 'Culinary excellence in every dish',
      type: 'image' as const,
      created_at: new Date().toISOString()
    },
    {
      id: '6',
      image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',
      caption: 'Fine dining experience',
      type: 'image' as const,
      created_at: new Date().toISOString()
    }
  ];

  const displayItems = galleryItems.length > 0 ? galleryItems : sampleItems;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading gallery...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Gallery</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A visual journey through our culinary artistry and elegant ambiance
          </p>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayItems.map((item, index) => (
              <Card key={item.id} className="overflow-hidden hover-scale group">
                <CardContent className="p-0">
                  <div className="relative">
                    <img 
                      src={item.image_url} 
                      alt={item.caption || `Gallery image ${index + 1}`}
                      className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {item.caption && (
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end">
                        <p className="text-white p-4 text-sm">{item.caption}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Gallery;