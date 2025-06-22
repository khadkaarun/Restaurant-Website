// Updated: 2025-07-29 16:30:14
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface StoreSubscriptionRequest {
  subscription: any;
  userId?: string;
  userAgent: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { subscription, userId, userAgent }: StoreSubscriptionRequest = await req.json();

    console.log('Storing push subscription for user:', userId || 'anonymous');

    // Store the subscription in the database
    const { data, error } = await supabaseClient
      .from('push_subscriptions')
      .upsert({
        endpoint: subscription.endpoint,
        user_id: userId,
        subscription_data: JSON.stringify(subscription),
        user_agent: userAgent,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'endpoint'
      });

    if (error) {
      console.error('Error storing subscription:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store subscription' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Subscription stored successfully');

    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in store-push-subscription function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});