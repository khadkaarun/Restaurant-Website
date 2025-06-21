// Updated: 2025-07-29 16:30:08
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PaymentRequest {
  cart: Array<{
    menu_item_id: string;
    name: string;
    price: number;
    quantity: number;
    special_instructions?: string;
  }>;
  customerDetails: {
    name: string;
    email: string;
    phone?: string;
  };
  specialRequests?: string;
  userId?: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-PAYMENT] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    logStep("Stripe key verified");

    // Parse request body
    const requestBody: PaymentRequest = await req.json();
    const { cart, customerDetails, specialRequests, userId } = requestBody;
    
    if (!cart || cart.length === 0) {
      throw new Error("Cart is empty");
    }

    if (!customerDetails?.email || !customerDetails?.name) {
      throw new Error("Customer details are required");
    }

    logStep("Request data received", { 
      cartItems: cart.length, 
      customerEmail: customerDetails.email,
      customerName: customerDetails.name
    });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Convert cart items to Stripe line items
    const lineItems = cart.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Calculate total for metadata
    const totalCents = cart.reduce((sum, item) => sum + (item.price * item.quantity * 100), 0);

    logStep("Creating Stripe checkout session", { totalCents, lineItems: lineItems.length });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${req.headers.get("origin")}/order-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get("origin")}/cart`,
      customer_email: customerDetails.email,
      metadata: {
        customer_name: customerDetails.name,
        customer_email: customerDetails.email,
        customer_phone: customerDetails.phone || '',
        special_requests: (specialRequests || '').substring(0, 200), // Truncate to 200 chars
        total_cents: totalCents.toString(),
        user_id: userId || '',
        items_count: cart.length.toString(),
        // Create a compact cart summary instead of full JSON
        cart_summary: cart.slice(0, 3).map(item => `${item.name}(${item.quantity})`).join(', ') + 
                     (cart.length > 3 ? `... +${cart.length - 3} more` : ''),
      },
    });

    logStep("Stripe checkout session created successfully", { 
      sessionId: session.id, 
      url: session.url 
    });

    return new Response(JSON.stringify({
      sessionUrl: session.url,
      sessionId: session.id,
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({
      error: errorMessage
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 500
    });
  }
};

serve(handler);