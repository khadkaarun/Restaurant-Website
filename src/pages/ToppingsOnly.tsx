// Updated: 2025-07-29 16:30:23
// Updated: 2025-07-29 16:30:14
// Updated: 2025-07-29 16:30:03
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

interface ToppingItem {
  id: string;
  name: string;
  price_cents: number;
  description: string;
}

const ToppingsOnly = () => {
  const [toppings, setToppings] = useState<ToppingItem[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<{[key: string]: number}>({});
  const [loading, setLoading] = useState(true);
  const { addItem, itemCount } = useCart();

  useEffect(() => {
    const fetchToppings = async () => {
      try {
        const { data, error } = await supabase
          .from('menu_items')
          .select('*')
          .eq('category_id', '550e8400-e29b-41d4-a716-446655440009') // Toppings category
          .eq('is_available', true)
          .order('name');

        if (error) throw error;
        setToppings(data || []);
      } catch (error) {
        console.error('Error fetching toppings:', error);
        toast({
          title: "Error",
          description: "Failed to load toppings",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchToppings();
  }, []);

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const updateToppingQuantity = (toppingId: string, quantity: number) => {
    if (quantity <= 0) {
      const newSelected = { ...selectedToppings };
      delete newSelected[toppingId];
      setSelectedToppings(newSelected);
    } else {
      setSelectedToppings(prev => ({
        ...prev,
        [toppingId]: quantity
      }));
    }
  };

  const getTotalPrice = () => {
    return Object.entries(selectedToppings).reduce((total, [toppingId, quantity]) => {
      const topping = toppings.find(t => t.id === toppingId);
      return total + (topping ? topping.price_cents * quantity : 0);
    }, 0);
  };

  const getSelectedCount = () => {
    return Object.values(selectedToppings).reduce((sum, qty) => sum + qty, 0);
  };

  const handleAddToCart = () => {
    Object.entries(selectedToppings).forEach(([toppingId, quantity]) => {
      const topping = toppings.find(t => t.id === toppingId);
      if (topping) {
        for (let i = 0; i < quantity; i++) {
          addItem({
            id: `${topping.id}-${Date.now()}-${i}`,
            menu_item_id: topping.id,
            name: topping.name,
            price_cents: topping.price_cents,
            special_instructions: 'Toppings only order'
          });
        }
      }
    });

    toast({
      title: "Added to cart",
      description: `${getSelectedCount()} toppings added to your cart`,
    });

    setSelectedToppings({});
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading toppings...</p>
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
          <h1 className="text-4xl md:text-6xl font-bold mb-4">Toppings & Extras</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build your perfect combination with our premium toppings and add-ons
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

      {/* Toppings Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toppings.map((topping) => {
              const quantity = selectedToppings[topping.id] || 0;
              
              return (
                <Card key={topping.id} className="hover-scale overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{topping.name}</CardTitle>
                      <Badge variant="secondary" className="text-lg font-semibold">
                        {formatPrice(topping.price_cents)}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {topping.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateToppingQuantity(topping.id, quantity - 1)}
                          disabled={quantity <= 0}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold text-lg min-w-[2rem] text-center">
                          {quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => updateToppingQuantity(topping.id, quantity + 1)}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {quantity > 0 && (
                        <Badge variant="default">
                          {formatPrice(topping.price_cents * quantity)}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Add to Cart Summary */}
          {getSelectedCount() > 0 && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
              <Card className="shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Selected</div>
                      <div className="font-semibold">{getSelectedCount()} items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">Total</div>
                      <div className="font-semibold text-primary">
                        {formatPrice(getTotalPrice())}
                      </div>
                    </div>
                    <Button onClick={handleAddToCart} className="rounded-full">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ToppingsOnly;