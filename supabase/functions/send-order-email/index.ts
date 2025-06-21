// Updated: 2025-07-29 16:30:18
// Updated: 2025-07-29 16:30:11
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { toZonedTime, formatInTimeZone } from "npm:date-fns-tz@3.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface OrderEmailRequest {
  type: 'confirmation' | 'status_update' | 'cancellation';
  order: {
    id: string;
    customer_name: string | null;
    customer_email: string;
    customer_phone?: string;
    total_cents: number;
    status: string;
    created_at: string;
    special_requests?: string;
    order_items: Array<{
      id: string;
      quantity: number;
      unit_price_cents: number;
      special_instructions?: string;
      custom_name?: string;
      menu_items: {
        name: string;
        description: string;
      };
    }>;
  };
}

const formatPrice = (priceCents: number) => {
  return `$${(priceCents / 100).toFixed(2)}`;
};

const getStatusMessage = (status: string) => {
  switch (status) {
    case 'confirmed': return 'Your order has been confirmed and we\'re preparing it now!';
    case 'in_progress': return 'Your order is being prepared by our kitchen team.';
    case 'ready_for_pickup': return 'Your order is ready for pickup! Please come to the restaurant.';
    case 'completed': return 'Thank you for your order! We hope you enjoyed your meal.';
    default: return 'Your order status has been updated.';
  }
};

const generateOrderItemsHTML = (orderItems: any[]) => {
  return orderItems.map(item => `
    <tr style="border-bottom: 1px solid #eee;">
      <td style="padding: 12px 0; font-family: Arial, sans-serif;">
        <strong>${item.custom_name || item.menu_items?.name || 'Unknown Item'}</strong>
        ${item.special_instructions ? `<br><span style="font-size: 12px; color: #666; font-style: italic;">Special Instructions: ${item.special_instructions}</span>` : ''}
      </td>
      <td style="padding: 12px 0; text-align: center; font-family: Arial, sans-serif;">
        ${item.quantity}
      </td>
      <td style="padding: 12px 0; text-align: right; font-family: Arial, sans-serif;">
        ${formatPrice(item.unit_price_cents * item.quantity)}
      </td>
    </tr>
  `).join('');
};

const generateConfirmationEmailHTML = (order: any) => {
  const nyTimezone = 'America/New_York';
  const orderDate = formatInTimeZone(
    new Date(order.created_at),
    nyTimezone,
    'EEEE, MMMM do, yyyy \'at\' h:mm aaa'
  );

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation - Maki Express Ramen House</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: #dc2626; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Maki Express Ramen House</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Order Confirmed!</p>
        </div>

        <!-- Order Success Message -->
        <div style="padding: 30px; text-align: center; border-bottom: 1px solid #eee;">
          <div style="background-color: #10b981; color: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
            ✓
          </div>
          <h2 style="margin: 0 0 10px 0; color: #333; font-size: 24px;">Thank you for your order!</h2>
          <p style="margin: 0; color: #666; font-size: 16px;">We're preparing your delicious meal and will have it ready for pickup soon.</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 30px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
            <div>
              <h3 style="margin: 0 0 5px 0; color: #333;">Order #${order.id.slice(0, 8)}</h3>
              <p style="margin: 0; color: #666; font-size: 14px;">${orderDate}</p>
              <p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Customer: ${order.customer_name || 'N/A'}</p>
              ${order.customer_phone ? `<p style="margin: 5px 0 0 0; color: #666; font-size: 14px;">Phone: ${order.customer_phone}</p>` : ''}
            </div>
            <div style="text-align: right;">
              <span style="background-color: #3b82f6; color: white; padding: 4px 12px; border-radius: 15px; font-size: 12px; text-transform: uppercase; font-weight: bold;">
                ${order.status.replace('_', ' ')}
              </span>
            </div>
          </div>

          <!-- Order Items -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="border-bottom: 2px solid #dc2626;">
                <th style="padding: 12px 0; text-align: left; color: #333; font-family: Arial, sans-serif;">Item</th>
                <th style="padding: 12px 0; text-align: center; color: #333; font-family: Arial, sans-serif;">Qty</th>
                <th style="padding: 12px 0; text-align: right; color: #333; font-family: Arial, sans-serif;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${generateOrderItemsHTML(order.order_items)}
            </tbody>
          </table>

          ${order.special_requests ? `
          <!-- Added Notes -->
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Added Notes:</h4>
            <p style="margin: 0; color: #666; font-style: italic;">${order.special_requests}</p>
          </div>
          ` : ''}

          <!-- Total -->
          <div style="text-align: right; padding-top: 20px; border-top: 2px solid #dc2626;">
            <p style="margin: 0; font-size: 18px; font-weight: bold; color: #333;">
              Total: ${formatPrice(order.total_cents)}
            </p>
          </div>
        </div>

        <!-- Pickup Information -->
        <div style="background-color: #fef3c7; padding: 30px; margin: 20px 30px; border-radius: 8px;">
          <h3 style="margin: 0 0 15px 0; color: #dc2626; font-size: 18px;">Pickup Information</h3>
          <div style="margin-bottom: 15px;">
            <strong style="color: #333;">Estimated Pickup Time:</strong><br>
            <span style="font-size: 18px; color: #dc2626; font-weight: bold;">${(() => {
              const nyTimezone = 'America/New_York';
              const orderTime = new Date(order.created_at);
              const pickupTime = new Date(orderTime.getTime() + 15 * 60000);
              return formatInTimeZone(pickupTime, nyTimezone, 'h:mm aaa');
            })()}</span>
            <div style="font-size: 14px; color: #666; margin-top: 5px;">
              (${(() => {
                const nyTimezone = 'America/New_York';
                const orderTime = new Date(order.created_at);
                const pickupTime = new Date(orderTime.getTime() + 15 * 60000);
                return formatInTimeZone(pickupTime, nyTimezone, 'EEEE, MMM do');
              })()})
            </div>
          </div>
          <div style="margin-bottom: 15px;">
            <strong style="color: #333;">Location:</strong><br>
            209 W McMillan St<br>
            Cincinnati, OH 45219
          </div>
          <div>
            <strong style="color: #333;">Phone:</strong> (513) 721-6999
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #374151; color: white; padding: 30px; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Maki Express Ramen House</p>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            Authentic Japanese ramen and Asian cuisine in Cincinnati's University Heights
          </p>
          <div style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
            <p style="margin: 0;">Hours: Mon-Sat 11AM-9PM | Sunday 12PM-9PM</p>
            <p style="margin: 5px 0 0 0;">Questions? Call us at (513) 721-6999</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateCancellationEmailHTML = (order: any) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Cancelled - Maki Express Ramen House</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: #dc2626; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Maki Express Ramen House</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Order Cancelled</p>
        </div>

        <!-- Cancellation Notice -->
        <div style="padding: 30px; text-align: center;">
          <div style="background-color: #dc2626; color: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
            ✗
          </div>
          <h2 style="margin: 0 0 15px 0; color: #333; font-size: 24px;">Order #${order.id.slice(0, 8)} Cancelled</h2>
          <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.5;">
            Your order has been cancelled and a full refund has been processed. The refund will appear in your account within 3-5 business days.
          </p>
        </div>

        <!-- Order Summary -->
        <div style="padding: 0 30px 30px;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Cancelled Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${generateOrderItemsHTML(order.order_items)}
            </tbody>
          </table>
          
          ${order.special_requests ? `
          <!-- Added Notes -->
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Added Notes:</h4>
            <p style="margin: 0; color: #666; font-style: italic;">${order.special_requests}</p>
          </div>
          ` : ''}
          
          <div style="text-align: right; padding-top: 15px; border-top: 1px solid #eee; margin-top: 15px;">
            <strong style="font-size: 16px; color: #333;">Refunded Amount: ${formatPrice(order.total_cents)}</strong>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #374151; color: white; padding: 30px; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Maki Express Ramen House</p>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            We apologize for any inconvenience. Questions? Call us at (513) 721-6999
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const generateStatusUpdateEmailHTML = (order: any) => {
  const statusColors = {
    'confirmed': '#3b82f6',
    'in_progress': '#f59e0b', 
    'ready_for_pickup': '#10b981',
    'completed': '#6366f1'
  };

  const statusColor = statusColors[order.status as keyof typeof statusColors] || '#6b7280';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Update - Maki Express Ramen House</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: #dc2626; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Maki Express Ramen House</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Order Update</p>
        </div>

        <!-- Status Update -->
        <div style="padding: 30px; text-align: center;">
          <div style="background-color: ${statusColor}; color: white; padding: 15px 30px; border-radius: 25px; display: inline-block; margin-bottom: 20px;">
            <span style="font-size: 16px; font-weight: bold; text-transform: uppercase;">
              ${order.status.replace('_', ' ')}
            </span>
          </div>
          <h2 style="margin: 0 0 15px 0; color: #333; font-size: 24px;">Order #${order.id.slice(0, 8)}</h2>
          <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.5;">
            ${getStatusMessage(order.status)}
          </p>
        </div>

        ${order.status === 'ready_for_pickup' ? `
        <!-- Pickup Info for Ready Orders -->
        <div style="background-color: #dcfce7; padding: 30px; margin: 0 30px 30px; border-radius: 8px; border-left: 4px solid #10b981;">
          <h3 style="margin: 0 0 15px 0; color: #10b981; font-size: 18px;">Ready for Pickup!</h3>
          <p style="margin: 0 0 15px 0; color: #333;">Your order is ready and waiting for you at:</p>
          <div style="margin-bottom: 15px;">
            <strong style="color: #333;">Location:</strong><br>
            209 W McMillan St<br>
            Cincinnati, OH 45219
          </div>
          <div>
            <strong style="color: #333;">Phone:</strong> (513) 721-6999
          </div>
        </div>
        ` : ''}

        <!-- Order Summary -->
        <div style="padding: 0 30px 30px;">
          <h3 style="margin: 0 0 15px 0; color: #333;">Order Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tbody>
              ${generateOrderItemsHTML(order.order_items)}
            </tbody>
          </table>
          
          ${order.special_requests ? `
          <!-- Added Notes -->
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h4 style="margin: 0 0 10px 0; color: #333;">Added Notes:</h4>
            <p style="margin: 0; color: #666; font-style: italic;">${order.special_requests}</p>
          </div>
          ` : ''}
          
          <div style="text-align: right; padding-top: 15px; border-top: 1px solid #eee; margin-top: 15px;">
            <strong style="font-size: 16px; color: #333;">Total: ${formatPrice(order.total_cents)}</strong>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #374151; color: white; padding: 30px; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Maki Express Ramen House</p>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            Questions about your order? Call us at (513) 721-6999
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, order }: OrderEmailRequest = await req.json();

    console.log(`Sending ${type} email for order:`, order.id);

    let subject: string;
    let html: string;

    if (type === 'confirmation') {
      subject = `Order Confirmation #${order.id.slice(0, 8)} - Maki Express Ramen House`;
      html = generateConfirmationEmailHTML(order);
    } else if (type === 'cancellation') {
      subject = `Order Cancelled #${order.id.slice(0, 8)} - Maki Express Ramen House`;
      html = generateCancellationEmailHTML(order);
    } else {
      subject = `Order Update #${order.id.slice(0, 8)} - ${order.status.replace('_', ' ').toUpperCase()}`;
      html = generateStatusUpdateEmailHTML(order);
    }

    // Send emails to both customer and restaurant in production
    const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";
    const customerEmail = order.customer_email;
    const restaurantEmail = "makiexpress01@gmail.com";
    
    // In development, send only to restaurant email for testing
    const toEmails = isDevelopment ? [restaurantEmail] : [customerEmail, restaurantEmail];
    
    console.log(`Sending email to: ${toEmails.join(', ')}`);

    const emailResponse = await resend.emails.send({
      from: "Maki Express Ramen House <onboarding@resend.dev>",
      to: toEmails,
      subject: isDevelopment ? `[DEV] ${subject}` : subject,
      html: html,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse,
      note: isDevelopment ? `Development mode: Email sent to ${toEmails.join(', ')}` : undefined
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-order-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);