// Updated: 2025-07-29 16:30:23
// Updated: 2025-07-29 16:30:11
// Updated: 2025-07-29 16:30:05
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart, CartItem } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Clock, Receipt, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price_cents: number;
  special_instructions?: string;
  menu_items: {
    id: string;
    name: string;
    description?: string;
  };
}

interface Order {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  special_requests?: string;
  order_items: OrderItem[];
}

export default function OrderHistory() {
  const { user } = useAuth();
  const { addItem, clearCart, restoreCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('orders')
          .select(`
            id,
            status,
            total_cents,
            created_at,
            special_requests,
            order_items (
              id,
              quantity,
              unit_price_cents,
              special_instructions,
              menu_items (
                id,
                name,
                description
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setOrders(data || []);
      } catch (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Error loading orders",
          description: "Unable to fetch your order history.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user, toast]);

  const reorderItems = async (order: Order) => {
    try {
      // Convert order items to cart items
      const cartItems: CartItem[] = order.order_items.map(item => ({
        id: `${item.menu_items.id}-${Date.now()}`, // Create unique cart item ID
        menu_item_id: item.menu_items.id,
        name: item.menu_items.name,
        price_cents: item.unit_price_cents,
        quantity: item.quantity,
        special_instructions: item.special_instructions || undefined,
      }));
      
      // Clear current cart and restore with order items
      clearCart();
      restoreCart(cartItems);
      
      toast({
        title: "Items added to cart",
        description: `${order.order_items.length} items from your previous order have been added to your cart.`,
      });
      
      // Navigate to cart
      navigate('/cart');
    } catch (error) {
      console.error('Error reordering items:', error);
      toast({
        title: "Error reordering",
        description: "Unable to add items to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Please sign in to view your order history</h1>
          <Link to="/auth">
            <Button>Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom section-padding py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Receipt className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-playfair font-bold">Order History</h1>
          </div>
          <Link to="/account-settings">
            <Button variant="outline">Account Settings</Button>
          </Link>
        </div>

        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">No orders yet</h2>
              <p className="text-muted-foreground mb-6">You haven't placed any orders yet.</p>
              <Link to="/menu">
                <Button>Browse Menu</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const orderDate = toZonedTime(new Date(order.created_at), 'America/New_York');
              
              return (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Order #{order.id.slice(-8).toUpperCase()}
                        </CardTitle>
                        <p className="text-muted-foreground">
                          {format(orderDate, 'PPP p')} EST
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(order.status)}>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                        <p className="text-lg font-semibold mt-2">
                          ${(order.total_cents / 100).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-medium">{item.menu_items.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">
                            ${(item.unit_price_cents * item.quantity / 100).toFixed(2)}
                          </p>
                        </div>
                      ))}
                      
                      {order.special_requests && (
                        <>
                          <Separator />
                          <div>
                            <p className="font-medium text-sm">Added Notes:</p>
                            <p className="text-sm text-muted-foreground italic">
                              {order.special_requests}
                            </p>
                          </div>
                        </>
                      )}
                      
                      <Separator />
                      <div className="flex justify-between items-center pt-3">
                        <div className="text-sm text-muted-foreground">
                          {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => reorderItems(order)}
                          className="flex items-center gap-2"
                        >
                          <ShoppingCart className="h-4 w-4" />
                          Order Again
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}