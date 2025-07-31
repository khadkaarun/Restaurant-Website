// Updated: 2025-07-29 16:30:21
// Updated: 2025-07-29 16:30:17
// Updated: 2025-07-29 16:30:07
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, MapPin, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price_cents: number;
  special_instructions?: string;
  custom_name?: string;
  menu_items: {
    name: string;
    description: string;
  };
}

interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  total_cents: number;
  status: string;
  created_at: string;
  special_requests: string | null;
  order_items: OrderItem[];
}

export default function OrderSuccess() {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleOrderCompletion = async () => {
      try {
        console.log('OrderSuccess page loaded');
        
        // Stripe redirects here with the session_id
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const isAdditionalCharge = urlParams.get('additional_charge') === 'true';
        const orderId = urlParams.get('order_id');
        
        console.log('URL parameters:', {
          sessionId,
          isAdditionalCharge,
          orderId
        });
        
        if (!sessionId) {
          throw new Error('Stripe session ID not found - payment may not have completed');
        }

        if (isAdditionalCharge && orderId) {
          // This is a payment for additional charges (item substitution)
          console.log('Processing additional charge completion for order:', orderId);
          
          // Use secure edge function to verify additional charge payment and fetch order
          const { data: verificationResponse, error: verificationError } = await supabase.functions.invoke('verify-additional-charge', {
            body: { sessionId, orderId }
          });
          
          if (verificationError || !verificationResponse.success) {
            console.error('Failed to verify additional charge payment:', verificationError || verificationResponse.error);
            throw new Error('Failed to verify additional charge payment');
          }
          
          const orderData = verificationResponse.order;
          console.log('Additional charge verified and order fetched:', orderData);
          setOrder(orderData);

          // Send updated confirmation email with new items
          try {
            await supabase.functions.invoke('send-order-email', {
              body: {
                type: 'confirmation',
                order: orderData
              }
            });
            console.log('Updated confirmation email sent successfully');
          } catch (emailError) {
            console.error('Failed to send updated confirmation email:', emailError);
          }

        } else {
          // This is a regular new order completion
          console.log('Processing new order completion');
          
          // Get cart data from localStorage
          const cartDataString = localStorage.getItem('pendingCartData');
          if (!cartDataString) {
            throw new Error('Cart data not found - unable to verify order');
          }
          
          const cartData = JSON.parse(cartDataString);
          console.log('Retrieved cart data for verification:', cartData);
          
          // Use edge function to verify Stripe payment and create order
          const { data: verificationResponse, error: verificationError } = await supabase.functions.invoke('verify-stripe-payment', {
            body: { sessionId, cartData }
          });
          
          if (verificationError || !verificationResponse.success) {
            console.error('Failed to verify Stripe payment:', verificationError || verificationResponse.error);
            throw new Error('Failed to verify payment with Stripe');
          }
          
          const orderWithItems = verificationResponse.order;
          console.log('Order created and verified successfully:', orderWithItems);
          setOrder(orderWithItems);

          // Clear cart and stored data
          clearCart();
          localStorage.removeItem('pendingOrderData');
          localStorage.removeItem('pendingCartData');

          // Send confirmation email
          try {
            await supabase.functions.invoke('send-order-email', {
              body: {
                type: 'confirmation',
                order: orderWithItems
              }
            });
            console.log('Confirmation email sent successfully');
          } catch (emailError) {
            console.error('Failed to send confirmation email:', emailError);
          }

          // Send push notification
          try {
            await supabase.functions.invoke('send-push-notification', {
              body: {
                orderId: orderWithItems.id,
                type: 'confirmation'
              }
            });
            console.log('Push notification sent successfully');
          } catch (pushError) {
            console.error('Failed to send push notification:', pushError);
          }
        }

      } catch (error) {
        console.error('Error processing order:', error);
        setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    handleOrderCompletion();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Processing your order...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-2xl font-bold mb-4 text-destructive">Order Error</h1>
            <p className="text-muted-foreground mb-6">{error}</p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/menu')} className="w-full">
                Return to Menu
              </Button>
              <Button variant="outline" onClick={() => navigate('/cart')} className="w-full">
                Back to Cart
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
          <Link to="/menu">
            <Button>Browse Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const nyTimezone = 'America/New_York';
    return formatInTimeZone(
      new Date(dateString),
      nyTimezone,
      'EEEE, MMMM do, yyyy \'at\' h:mm aaa'
    );
  };

  // Calculate estimated pickup time (15 minutes from order time) in NY timezone
  const nyTimezone = 'America/New_York';
  const orderTimeNY = toZonedTime(new Date(order.created_at), nyTimezone);
  const estimatedPickupTimeNY = new Date(orderTimeNY.getTime() + 15 * 60000);
  
  const pickupTimeString = formatInTimeZone(estimatedPickupTimeNY, nyTimezone, 'h:mm aaa');
  const pickupDateString = formatInTimeZone(estimatedPickupTimeNY, nyTimezone, 'EEEE, MMM do');

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-3xl font-playfair font-bold mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground">
              Thank you for your order, {order.customer_name}. Your payment has been processed successfully.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Order Details</span>
                <Badge variant="default">
                  Confirmed
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-semibold">Order ID</p>
                  <p className="text-muted-foreground">{order.id.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="font-semibold">Order Time</p>
                  <p className="text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="space-y-3">
                {order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium">{item.custom_name || item.menu_items.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      {item.special_instructions && (
                        <p className="text-sm text-muted-foreground italic">
                          Special requests: {item.special_instructions}
                        </p>
                      )}
                    </div>
                    <p className="font-medium">${(item.unit_price_cents * item.quantity / 100).toFixed(2)}</p>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-semibold text-lg">
                <span>Total:</span>
                <span>${(order.total_cents / 100).toFixed(2)}</span>
              </div>
              
              {order.special_requests && (
                <>
                  <Separator />
                  <div>
                    <p className="font-semibold mb-2">Added Notes:</p>
                    <p className="text-muted-foreground">{order.special_requests}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pickup Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold">Estimated Pickup Time</p>
                <p className="text-muted-foreground">
                  {pickupTimeString} on {pickupDateString}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  (approximately 15 minutes from order confirmation)
                </p>
              </div>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-5 w-5 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="font-semibold">Pickup Location</p>
                  <p className="text-muted-foreground">
                    209 W McMillan St<br />
                    Cincinnati, OH 45219
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Utensils className="h-5 w-5" />
                What's Next?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Order confirmed and payment processed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span>Kitchen preparing your order</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-muted rounded-full"></div>
                  <span>Order ready for pickup</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Link to="/menu" className="flex-1">
              <Button variant="outline" className="w-full">Order Again</Button>
            </Link>
            <Link to="/" className="flex-1">
              <Button className="w-full">Back to Home</Button>
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}