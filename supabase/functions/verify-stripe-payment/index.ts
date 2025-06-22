// Updated: 2025-07-29 16:30:19
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-STRIPE-PAYMENT] ${step}${detailsStr}`);
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
    const { sessionId, cartData } = await req.json();
    
    if (!sessionId) {
      throw new Error("Session ID is required");
    }

    if (!cartData || !Array.isArray(cartData)) {
      throw new Error("Cart data is required");
    }

    logStep("Session ID and cart data received", { sessionId, cartItems: cartData.length });

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

    logStep("Payment verified successfully", { 
      sessionId, 
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total
    });

    // Initialize Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // STEP 1: Check Stripe session metadata for idempotency key
    const idempotencyKey = session.metadata?.idempotency_key || sessionId;
    
    logStep("Checking for duplicate processing", { 
      sessionId,
      idempotencyKey,
      paymentIntent: session.payment_intent
    });

    // STEP 2: Check if we've already processed this exact payment
    const { data: existingOrder, error: checkError } = await supabase
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
      .or(`stripe_payment_id.eq.${session.payment_intent || session.id},stripe_payment_id.eq.${sessionId}`)
      .maybeSingle();

    if (checkError) {
      logStep("Error checking for existing order", { error: checkError });
      throw new Error(`Failed to check for existing order: ${checkError.message}`);
    }

    if (existingOrder) {
      logStep("Duplicate order detected - returning existing order", { 
        existingOrderId: existingOrder.id,
        sessionId,
        paymentIntent: session.payment_intent
      });
      
      // Verify the existing order matches current session data
      const metadata = session.metadata || {};
      const expectedTotal = parseInt(metadata.total_cents);
      
      if (existingOrder.total_cents !== expectedTotal) {
        logStep("WARNING: Order total mismatch detected", {
          existingTotal: existingOrder.total_cents,
          expectedTotal: expectedTotal
        });
      }
      
      return new Response(JSON.stringify({
        success: true,
        order: existingOrder,
        paymentId: session.payment_intent || session.id,
        duplicate: true
      }), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: 200
      });
    }

    // STEP 3: Double-check with Stripe that this session hasn't been fulfilled elsewhere
    try {
      const recentSessions = await stripe.checkout.sessions.list({
        payment_intent: session.payment_intent,
        limit: 10
      });
      
      const duplicateSessions = recentSessions.data.filter(s => 
        s.id !== sessionId && s.payment_status === 'paid'
      );
      
      if (duplicateSessions.length > 0) {
        logStep("WARNING: Multiple paid sessions found for same payment intent", {
          currentSession: sessionId,
          duplicateSessions: duplicateSessions.map(s => s.id)
        });
      }
    } catch (stripeError) {
      logStep("Could not verify duplicate sessions with Stripe", { error: stripeError });
      // Continue processing - this is just a safety check
    }

    // STEP 4: Use database transaction to prevent race conditions
    const { data: transactionResult, error: transactionError } = await supabase.rpc('create_order_transaction', {
      p_user_id: session.metadata?.user_id || null,
      p_customer_name: session.metadata?.customer_name,
      p_customer_email: session.metadata?.customer_email,
      p_customer_phone: session.metadata?.customer_phone || null,
      p_total_cents: parseInt(session.metadata?.total_cents),
      p_stripe_payment_id: session.payment_intent || session.id,
      p_special_requests: session.metadata?.special_requests || null,
      p_cart_data: JSON.stringify(cartData)
    });

    if (transactionError) {
      logStep("Transaction failed", { error: transactionError });
      
      // Check if it's a duplicate key error (order already exists)
      if (transactionError.code === '23505') {
        logStep("Duplicate key detected - fetching existing order");
        
        const { data: existingOrder } = await supabase
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
          .eq('stripe_payment_id', session.payment_intent || session.id)
          .single();
          
        if (existingOrder) {
          return new Response(JSON.stringify({
            success: true,
            order: existingOrder,
            paymentId: session.payment_intent || session.id,
            duplicate: true
          }), {
            headers: {
              ...corsHeaders,
              'Content-Type': 'application/json'
            },
            status: 200
          });
        }
      }
      
      throw new Error(`Transaction failed: ${transactionError.message}`);
    }

    logStep("Order created successfully via transaction", { orderId: transactionResult.order_id });

    // Fetch complete order data for display and email
    const { data: orderWithItems, error: fetchError } = await supabase
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
      .eq('id', transactionResult.order_id)
      .single();
    
    if (fetchError) {
      logStep("Error fetching complete order", { error: fetchError });
      throw new Error(`Failed to fetch order: ${fetchError.message}`);
    }

    logStep("Complete order fetched successfully", { 
      orderId: transactionResult.order_id,
      itemCount: orderWithItems.order_items?.length || 0
    });

    return new Response(JSON.stringify({
      success: true,
      order: orderWithItems,
      paymentId: session.payment_intent || session.id,
      duplicate: false
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
      error: errorMessage,
      success: false,
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