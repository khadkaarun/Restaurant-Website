// Updated: 2025-07-31 02:10:00
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-ADDITIONAL-CHARGE] ${step}${detailsStr}`);
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    logStep("Environment variables verified");

    // Parse request body
    const { sessionId, orderId } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    logStep("Session ID and order ID received", { sessionId, orderId });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      throw new Error("Session not found");
    }

    if (session.payment_status !== 'paid') {
      throw new Error("Payment not completed");
    }

    logStep("Additional charge payment verified successfully", { 
      sessionId, 
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total
    });

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the updated order from database using service role key
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          id,
          quantity,
          unit_price_cents,
          special_instructions,
          custom_name,
          menu_items (
            name,
            description
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      logStep("Error fetching order", { error: orderError });
      throw new Error(`Failed to fetch order: ${orderError.message}`);
    }

    if (!orderData) {
      throw new Error("Order not found");
    }

    logStep("Order fetched successfully", { orderId: orderData.id });

    return new Response(JSON.stringify({
      success: true,
      order: orderData,
      paymentId: session.payment_intent || session.id,
      additionalCharge: true
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 200
    });

  } catch (error) {
    logStep("Error occurred", { error: error.message });
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: 400
    });
  }
};

serve(handler);
