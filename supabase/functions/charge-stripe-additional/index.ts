// Updated: 2025-07-29 16:30:23
// Updated: 2025-07-29 16:30:22
// Updated: 2025-07-29 16:30:14
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AdditionalChargeRequest {
  orderId: string;
  additionalAmountCents: number;
  description: string;
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-ADDITIONAL-CHARGE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
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

    const { orderId, additionalAmountCents, description }: AdditionalChargeRequest = await req.json();

    if (!orderId || additionalAmountCents <= 0) {
      throw new Error('Order ID and positive additional amount are required');
    }

    logStep("Request data received", { orderId, additionalAmountCents, description });

    // Initialize Stripe and Supabase
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('stripe_payment_id, customer_email, customer_name, total_cents')
      .eq('id', orderId)
      .single();

    if (orderError) {
      logStep("Error fetching order", { error: orderError });
      throw new Error(`Failed to fetch order: ${orderError.message}`);
    }

    logStep("Order details fetched", { orderId, paymentId: order.stripe_payment_id });

    // Get the customer ID from the original payment
    let customerId;
    
    if (order.stripe_payment_id.startsWith('cs_')) {
      // Get customer from session
      const session = await stripe.checkout.sessions.retrieve(order.stripe_payment_id);
      customerId = session.customer as string;
      logStep("Customer ID from session", { customerId });
    } else if (order.stripe_payment_id.startsWith('pi_')) {
      // Get customer from payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(order.stripe_payment_id);
      customerId = typeof paymentIntent.customer === 'string' ? paymentIntent.customer : paymentIntent.customer?.id;
      logStep("Customer ID from payment intent", { customerId });
    }

    // Create a new checkout session for the additional charge
    const origin = req.headers.get('origin') || 'https://your-domain.com';
    
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId || undefined,
      customer_email: customerId ? undefined : order.customer_email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Additional Charge for Order #${orderId.slice(0, 8)}`,
              description: description,
            },
            unit_amount: additionalAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/order-success?session_id={CHECKOUT_SESSION_ID}&additional_charge=true&order_id=${orderId}`,
      cancel_url: `${origin}/`,
      metadata: {
        order_id: orderId,
        charge_type: 'additional',
        original_payment_id: order.stripe_payment_id,
        description: description
      },
    });

    logStep("Additional charge checkout session created", { 
      sessionId: checkoutSession.id,
      amount: additionalAmountCents,
      url: checkoutSession.url 
    });

    // Log the additional charge attempt in our database
    await supabase.from('notifications').insert({
      order_id: orderId,
      channel: 'email',
      event: 'additional_charge_initiated',
      recipient: order.customer_email,
      success: true
    });

    logStep("Additional charge logged in database");

    return new Response(
      JSON.stringify({ 
        success: true, 
        checkout_url: checkoutSession.url,
        session_id: checkoutSession.id,
        message: 'Additional charge checkout session created successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    logStep("ERROR", { message: errorMessage, stack: errorStack });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        details: error instanceof Error ? {
          name: error.name,
          message: error.message,
          cause: error.cause
        } : error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});