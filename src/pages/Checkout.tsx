// Updated: 2025-07-29 16:30:13
// Updated: 2025-07-29 16:30:12
// Updated: 2025-07-29 16:30:07
// Updated: 2025-07-29 16:30:06
// Updated: 2025-07-29 16:30:02
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { supabase } from '@/integrations/supabase/client';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PushNotificationSettings } from '@/components/PushNotificationSettings';

export default function Checkout() {
  const { user } = useAuth();
  const { items, total, clearCart } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [guestInfo, setGuestInfo] = useState({ name: '', phone: '', email: '' });
  const [userPhone, setUserPhone] = useState('');
const [notes, setNotes] = useState('');
  const [createAccount, setCreateAccount] = useState(false);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Calculate pickup time (15 minutes from now)
      const pickupTime = new Date();
      pickupTime.setMinutes(pickupTime.getMinutes() + 15);

      // Get customer details
      const customerEmail = user?.email || guestInfo.email;
      const customerName = user?.user_metadata?.full_name || guestInfo.name;
      const customerPhone = user ? userPhone : guestInfo.phone;

      // Validate required customer information
      if (!customerEmail || !customerName) {
        throw new Error("Customer information is required");
      }

      // Validate email format
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(customerEmail)) {
        throw new Error("Please enter a valid email address");
      }

      // Validate phone number format if provided
      if (customerPhone) {
        const phoneRegex = /^[\+]?[1]?[\s\-\.]?[\(]?[0-9]{3}[\)]?[\s\-\.]?[0-9]{3}[\s\-\.]?[0-9]{4}$/;
        if (!phoneRegex.test(customerPhone.replace(/\s/g, ''))) {
          throw new Error("Please enter a valid phone number");
        }
      }

      let createdUserId = null;
      
      // Create account if guest opted in BEFORE payment
      if (!user && createAccount && guestInfo.email) {
        try {
          // Check if user already exists using edge function
          const { data: userCheckResult, error: checkError } = await supabase.functions.invoke(
            'check-user-exists',
            {
              body: { email: guestInfo.email }
            }
          );
          
          if (checkError) {
            console.error('Error checking user existence:', checkError);
            // Continue with account creation if check fails
          } else if (userCheckResult?.exists) {
            toast({
              title: "Account already exists",
              description: "An account with this email already exists. Please sign in instead.",
              variant: "destructive",
            });
            return;
          }

          const redirectUrl = `${window.location.origin}/auth?message=account-created`;
          const { data: authData, error: signUpError } = await supabase.auth.signUp({
            email: guestInfo.email,
            password: Math.random().toString(36).slice(-8) + 'A1!', // Temporary password
            options: {
              emailRedirectTo: redirectUrl,
              data: {
                full_name: guestInfo.name,
              },
            },
          });
          
          if (!signUpError && authData.user) {
            createdUserId = authData.user.id;
            
            // Send password reset email so they can set their own password
            await supabase.auth.resetPasswordForEmail(guestInfo.email, {
              redirectTo: `${window.location.origin}/reset-password`
            });
            
            toast({
              title: "Account created!",
              description: "Check your email to confirm your account and set your password.",
            });
          }
        } catch (error) {
          console.error('Error creating account:', error);
          // Don't block the order if account creation fails
        }
      }

      // Process Stripe payment (no order created yet)
      const { data: paymentResult, error: paymentError } = await supabase.functions.invoke(
        'create-stripe-payment',
        {
          body: {
            cart: items.map(item => ({
              name: item.name,
              price: item.price_cents / 100, // Convert cents to dollars
              quantity: item.quantity,
              menu_item_id: item.menu_item_id, // Include menu item ID for order creation later
              special_instructions: item.special_instructions // Include per-item special instructions
            })),
            customerDetails: {
              email: customerEmail,
              name: customerName,
              phone: customerPhone
            },
            specialRequests: notes.trim() || undefined,
            userId: user?.id || createdUserId,
          }
        }
      );

      if (paymentError) {
        // Handle Supabase Functions HTTP errors properly
        if (paymentError instanceof FunctionsHttpError) {
          try {
            const errorMessage = await paymentError.context.json();
            console.log('Detailed payment error:', errorMessage);
            throw new Error(`Payment setup failed: ${errorMessage.error || JSON.stringify(errorMessage)}`);
          } catch (jsonError) {
            // If JSON parsing fails, try text
            try {
              const errorText = await paymentError.context.text();
              console.log('Payment error text:', errorText);
              throw new Error(`Payment setup failed: ${errorText}`);
            } catch (textError) {
              console.log('Payment error (fallback):', paymentError.message);
              throw new Error(`Payment setup failed: ${paymentError.message}`);
            }
          }
        } else {
          throw new Error(`Payment setup failed: ${paymentError.message}`);
        }
      }

      if (!paymentResult?.sessionUrl) {
        throw new Error(`Failed to create payment session: ${paymentResult?.error || 'Unknown error'}`);
      }

      // Store order data in localStorage for order creation after payment
      localStorage.setItem('pendingOrderData', JSON.stringify({
        user_id: user?.id || null,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        total_cents: Math.round(total * 1.0875), // Include tax
        notification_preference: 'email' as const,
        special_requests: notes.trim() || null,
      }));
      
      localStorage.setItem('pendingCartData', JSON.stringify(items));


      // Don't clear cart yet - wait for payment completion

      // Show success message and redirect to Stripe payment page
      toast({
        title: "Redirecting to payment",
        description: "Complete your payment on the Stripe checkout page to confirm your order.",
      });

      // Redirect to Stripe payment page (opens in same tab)
      window.location.href = paymentResult.sessionUrl;
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error placing order",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">No items in cart</h1>
          <Link to="/menu">
            <Button>Browse Menu</Button>
          </Link>
        </div>
      </div>
    );
  }

  const tax = total * 0.0875 / 100;
  const finalTotal = total / 100 + tax;

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom section-padding py-8">
        <div className="mb-8">
          <Link to="/cart" className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to cart
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-3xl font-playfair font-bold">Checkout</h1>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Pickup Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">Pickup Time</p>
                  <p className="text-muted-foreground">
                    Ready in approximately 15 minutes
                  </p>
                </div>
                
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-semibold">Location</p>
                  <p className="text-muted-foreground">
                    209 W McMillan St<br />
                    Cincinnati, OH 45219
                  </p>
                </div>
              </CardContent>
            </Card>

            {!user && (
              <Card>
                <CardHeader>
                  <CardTitle>Guest Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePlaceOrder} className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="guest-name">Name *</Label>
                       <Input
                         id="guest-name"
                         value={guestInfo.name}
                         onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                         required
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="guest-email">Email Address *</Label>
                       <Input
                         id="guest-email"
                         type="email"
                         value={guestInfo.email}
                         onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                         required
                       />
                     </div>
                      <div className="space-y-2">
                        <Label htmlFor="guest-phone">Phone Number</Label>
                        <Input
                          id="guest-phone"
                          type="tel"
                          value={guestInfo.phone}
                          onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="(555) 123-4567"
                        />
                       </div>
                       <div className="flex items-center space-x-2 mt-4">
                         <Checkbox 
                           id="create-account" 
                           checked={createAccount}
                           onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
                         />
                         <Label htmlFor="create-account" className="text-sm">
                           Create an account for faster future orders
                         </Label>
                       </div>
                   </form>
                 </CardContent>
               </Card>
             )}

            {user && (
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="space-y-2">
                     <Label htmlFor="user-phone">Phone Number</Label>
                     <Input
                       id="user-phone"
                       type="tel"
                       value={userPhone}
                       onChange={(e) => setUserPhone(e.target.value)}
                       placeholder="(555) 123-4567"
                     />
                   </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Add Note</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Any pickup-related notes or additional requests..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Updates</CardTitle>
              </CardHeader>
              <CardContent>
                <PushNotificationSettings />
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Link to="/auth" className="flex-1">
                <Button variant="outline" className="w-full">
                  {user ? 'Signed in' : 'Sign in for faster checkout'}
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      {item.special_instructions && (
                        <p className="text-xs text-muted-foreground italic">
                          Special requests: {item.special_instructions}
                        </p>
                      )}
                    </div>
                    <p className="font-medium">${(item.price_cents * item.quantity / 100).toFixed(2)}</p>
                  </div>
                ))}
                
                <Separator />
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>${(total / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (8.75%):</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total:</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>
                
                <Button 
                  onClick={handlePlaceOrder} 
                  className="w-full" 
                  size="lg"
                  disabled={loading || (!user && (!guestInfo.name || !guestInfo.email)) || false}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Place Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}