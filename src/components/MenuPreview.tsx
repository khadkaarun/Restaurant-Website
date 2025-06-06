// Updated: 2025-07-29 16:30:18
// Updated: 2025-07-29 16:30:06
// Updated: 2025-07-29 16:30:03
// Updated: 2025-07-29 16:30:02
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Flame, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  is_available: boolean;
  category: {
    name: string;
  };
}

const MenuPreview = () => {
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        // Fetch 6 featured items from different categories
        const { data, error } = await supabase
          .from('menu_items')
          .select(`
            *,
            category:menu_categories(name)
          `)
          .eq('is_available', true)
          .limit(6);

        if (error) throw error;
        setFeaturedItems(data || []);
      } catch (error) {
        console.error('Error fetching featured items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedItems();
  }, []);

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="section-padding container-custom">
          <div className="text-center">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-muted rounded w-1/3 mx-auto"></div>
              <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu-preview" className="py-20 bg-background">
      <div className="section-padding container-custom">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-playfair text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Featured Dishes
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            A taste of our most popular authentic Japanese dishes
          </p>
          <Link to="/menu">
            <Button size="lg" className="rounded-full hover-scale">
              View Full Menu
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
        
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6 mt-12">
          {featuredItems.map((item, index) => (
            <Card 
              key={item.id}
              className="overflow-hidden hover-lift card-shadow border-0 bg-card"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="font-playfair text-lg font-semibold text-foreground mb-1">
                      {item.name}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {item.category?.name}
                    </Badge>
                  </div>
                  <div className="bg-primary/10 px-3 py-1 rounded-full ml-4">
                    <span className="font-bold text-primary">{formatPrice(item.price_cents)}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Leaf className="w-3 h-3 text-green-500" />
                    <span>Fresh</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Flame className="w-3 h-3 text-orange-500" />
                    <span>Hot</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Link to="/menu">
            <Button variant="outline" size="lg" className="rounded-full hover-scale">
              Explore All {featuredItems.length > 0 ? '20+' : ''} Dishes
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MenuPreview;