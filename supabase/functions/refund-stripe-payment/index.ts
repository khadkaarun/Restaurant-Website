// Updated: 2025-07-29 16:30:16
// Updated: 2025-07-29 16:29:59
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RefundRequest {
  paymentId: string;
  orderId: string;
  amount?: number; // Optional partial refund amount in cents
}

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-REFUND] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
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

    const { paymentId, orderId, amount }: RefundRequest = await req.json();

    if (!paymentId || !orderId) {
      throw new Error('Payment ID and Order ID are required');
    }

    logStep("Request data received", { paymentId, orderId, amount });

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
    });

    // Initialize Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('total_cents')
      .eq('id', orderId)
      .single();

    if (orderError) {
      logStep("Error fetching order", { error: orderError });
      throw new Error(`Failed to fetch order: ${orderError.message}`);
    }

    const refundAmount = amount || order.total_cents;
    
    logStep("Order details fetched", { 
      orderId, 
      orderTotal: order.total_cents, 
      refundAmount 
    });

    // Process refund with Stripe
    // Note: paymentId could be a payment_intent ID or session ID
    // We need to handle both cases
    let refund;
    
    try {
      // First, try to refund using the paymentId directly (if it's a payment_intent)
      if (paymentId.startsWith('pi_')) {
        logStep("Processing refund with payment_intent", { paymentId });
        refund = await stripe.refunds.create({
          payment_intent: paymentId,
          amount: refundAmount,
          reason: 'requested_by_customer',
          metadata: {
            order_id: orderId,
            refund_reason: 'Customer cancellation'
          }
        });
      } else if (paymentId.startsWith('cs_')) {
        // If it's a session ID, we need to get the payment_intent first
        logStep("Getting payment_intent from session", { sessionId: paymentId });
        const session = await stripe.checkout.sessions.retrieve(paymentId);
        
        if (!session.payment_intent) {
          throw new Error('No payment_intent found in session');
        }
        
        const paymentIntentId = typeof session.payment_intent === 'string' 
          ? session.payment_intent 
          : session.payment_intent.id;
          
        logStep("Processing refund with payment_intent from session", { paymentIntentId });
        refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: refundAmount,
          reason: 'requested_by_customer',
          metadata: {
            order_id: orderId,
            refund_reason: 'Customer cancellation'
          }
        });
      } else {
        throw new Error(`Unsupported payment ID format: ${paymentId}`);
      }

      logStep("Refund processed successfully", { 
        refundId: refund.id, 
        amount: refund.amount,
        status: refund.status 
      });

    } catch (stripeError: any) {
      logStep("Stripe refund error", { error: stripeError.message });
      throw new Error(`Stripe refund failed: ${stripeError.message}`);
    }

    // Log the refund in our database
    await supabase.from('notifications').insert({
      order_id: orderId,
      channel: 'stripe_refund',
      event: 'refund_processed',
      recipient: paymentId,
      success: true
    });

    logStep("Refund logged in database");

    return new Response(
      JSON.stringify({ 
        success: true, 
        refund: {
          id: refund.id,
          amount: refund.amount,
          status: refund.status,
          created: refund.created
        },
        message: 'Refund processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});