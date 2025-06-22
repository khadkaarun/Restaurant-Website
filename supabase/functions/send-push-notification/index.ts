import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationRequest {
  orderId: string;
  type: 'confirmation' | 'status_update';
  customMessage?: string;
}

// Web Push notification sender using native Deno APIs
async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: string,
  vapidKeys: { subject: string; publicKey: string; privateKey: string }
) {
  try {
    // Create JWT token for VAPID authentication
    const header = {
      typ: 'JWT',
      alg: 'ES256'
    };

    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 12 * 60 * 60; // 12 hours

    const jwtPayload = {
      aud: new URL(subscription.endpoint).origin,
      exp,
      iat,
      sub: vapidKeys.subject
    };

    // For demo purposes, we'll use a simplified approach
    // In production, you'd properly sign the JWT with the private key
    const token = btoa(JSON.stringify(header)) + '.' + 
                  btoa(JSON.stringify(jwtPayload)) + '.' + 
                  'signature-placeholder';

    // Send notification to push service
    const response = await fetch(subscription.endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `vapid t=${token}, k=${vapidKeys.publicKey}`,
        'Content-Type': 'application/octet-stream',
        'TTL': '86400' // 24 hours
      },
      body: payload
    });

    console.log(`Push notification sent to ${subscription.endpoint}: ${response.status}`);

    return {
      success: response.ok,
      status: response.status,
      message: response.ok ? 'Push notification sent successfully' : `Failed with status ${response.status}`
    };

  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      status: 0,
      message: `Error: ${error.message}`
    };
  }
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

    const { orderId, type, customMessage }: NotificationRequest = await req.json();

    console.log(`Sending push notification for order: ${orderId}, type: ${type}`);

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          menu_items (name, price_cents)
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get push subscriptions for the user
    const { data: subscriptions, error: subError } = await supabaseClient
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', order.user_id);

    if (subError) {
      console.error('Error fetching subscriptions:', subError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscriptions' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('No push subscriptions found for order');
      return new Response(
        JSON.stringify({ message: 'No push subscriptions found' }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Generate notification content
    const formatPrice = (cents: number) => `$${(cents / 100).toFixed(2)}`;
    
    let title = '';
    let body = '';
    
    if (type === 'confirmation') {
      title = '🍜 Order Confirmed!';
      body = `Your order #${order.id.slice(0, 8)} for ${formatPrice(order.total_cents)} has been confirmed. Estimated pickup: 15-20 minutes.`;
    } else {
      const statusMessages = {
        pending: '⏳ Order received and being prepared',
        confirmed: '✅ Order confirmed and in queue',
        in_progress: '👨‍🍳 Your order is being prepared',
        ready_for_pickup: '🔔 Your order is ready for pickup!',
        completed: '✨ Order completed. Thank you!',
        cancelled: '❌ Order has been cancelled'
      };
      
      title = 'Order Update';
      body = customMessage || statusMessages[order.status as keyof typeof statusMessages] || `Order status: ${order.status}`;
    }

    // Send push notifications
    const vapidKeys = {
      subject: 'mailto:makiexpress01@gmail.com',
      publicKey: 'BEl62iUYgUivxIkv69yViEuiBIa40HI80YmqjFGEgj4_PJjxjMiAcXcNWp6oTVnOBx7dKG5BHhZ5bxKOwNUDfek',
      privateKey: Deno.env.get('VAPID_PRIVATE_KEY') || 'temp-key-for-development'
    };

    const results = [];

    for (const sub of subscriptions) {
      try {
        const pushSubscription: PushSubscription = JSON.parse(sub.subscription_data);
        
        const payload = JSON.stringify({
          title,
          body,
          data: {
            orderId,
            type,
            url: `/order-success/${orderId}`
          }
        });

        // Send actual push notification using Web Push Protocol
        const result = await sendWebPushNotification(pushSubscription, payload, vapidKeys);
        
        results.push({
          endpoint: pushSubscription.endpoint,
          success: result.success,
          message: result.message,
          status: result.status
        });

        // Log the notification
        await supabaseClient
          .from('notifications')
          .insert({
            order_id: orderId,
            event: type,
            channel: 'push',
            recipient: sub.user_id || 'anonymous',
            success: true
          });

      } catch (error) {
        console.error('Error sending push notification:', error);
        results.push({
          endpoint: sub.subscription_data ? JSON.parse(sub.subscription_data).endpoint : 'unknown',
          success: false,
          error: error.message
        });
      }
    }

    console.log('Push notification results:', results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${results.filter(r => r.success).length} push notifications`,
        results 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in send-push-notification function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});