// Updated: 2025-07-29 16:30:23
// Updated: 2025-07-29 16:30:10
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Leaf, Flame, Eye } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MenuItemModal from '@/components/MenuItemModal';
import ResponsiveImage from '@/components/ResponsiveImage';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  is_available: boolean;
  stock_status: string;
  out_until?: string;
  category: {
    id: string;
    name: string;
    sort_order: number;
  };
}

interface Category {
  id: string;
  name: string;
  sort_order: number;
}

const Menu = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { itemCount } = useCart();

  useEffect(() => {
    const fetchMenuData = async () => {
      try {
        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('menu_categories')
          .select('*')
          .order('sort_order');

        if (categoriesError) throw categoriesError;

        // Fetch menu items with category information
        const { data: itemsData, error: itemsError } = await supabase
          .from('menu_items')
          .select(`
            *,
            category:menu_categories(id, name, sort_order)
          `)
          .eq('is_available', true)
          .order('name');

        if (itemsError) throw itemsError;

        setCategories(categoriesData || []);
        setMenuItems(itemsData || []);
        
        // Set first category as active
        if (categoriesData && categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id);
        }
      } catch (error) {
        console.error('Error fetching menu data:', error);
        toast({
          title: "Error",
          description: "Failed to load menu items",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, []);

  const handleItemClick = (item: MenuItem) => {
    // Check if item is out of stock
    if (item.stock_status !== 'in_stock') {
      toast({
        title: "Item Unavailable",
        description: `${item.name} is currently out of stock`,
        variant: "destructive",
      });
      return;
    }
    
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const getItemsByCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category?.id === categoryId);
  };

  const isItemAvailable = (item: MenuItem) => {
    if (item.stock_status === 'in_stock') return true;
    if (item.stock_status === 'out_today' || item.stock_status === 'out_indefinite') return false;
    if (item.stock_status === 'out_until' && item.out_until) {
      return new Date() >= new Date(item.out_until);
    }
    return false;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading menu...</p>
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
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Our Menu</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover our carefully crafted dishes made with the finest ingredients
          </p>
          {itemCount > 0 && (
            <div className="mt-6">
              <Button asChild className="rounded-full">
                <a href="/cart">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Cart ({itemCount})
                </a>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Menu Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* Category Navigation */}
          <div className="flex justify-center mb-12">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2 px-4 max-w-full">
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                  className="whitespace-nowrap flex-shrink-0 rounded-full px-6 py-2 transition-all duration-200"
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getItemsByCategory(activeCategory).map((item) => (
              <Card 
                key={item.id} 
                className={`overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300 ${
                  !isItemAvailable(item) ? 'opacity-60 cursor-not-allowed' : ''
                }`}
                onClick={() => handleItemClick(item)}
                onTouchStart={(e) => e.preventDefault()} // Prevent mobile keyboard popup
                tabIndex={-1} // Remove from tab order to prevent focus
              >
                <div className="aspect-video relative overflow-hidden">
                  <ResponsiveImage
                    itemName={item.name}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {!isItemAvailable(item) && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Badge variant="destructive" className="text-sm font-medium">
                        Out of Stock
                      </Badge>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                      {item.name}
                    </h3>
                    <Badge variant="secondary" className="text-base font-semibold ml-2">
                      {formatPrice(item.price_cents)}
                    </Badge>
                  </div>
                  <div className="flex gap-1 mb-3">
                    <Leaf className="w-4 h-4 text-green-500" />
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <Button 
                    size="sm"
                    className="w-full rounded-full"
                    variant="outline"
                    disabled={!isItemAvailable(item)}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleItemClick(item);
                    }}
                    onTouchStart={(e) => e.stopPropagation()} // Prevent touch events from bubbling
                    tabIndex={0} // Keep button focusable for accessibility
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {isItemAvailable(item) ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
      
      <MenuItemModal 
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default Menu;