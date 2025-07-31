import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { toZonedTime, formatInTimeZone } from "npm:date-fns-tz@3.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubstitutionEmailRequest {
  customerEmail: string;
  customerName: string;
  orderId: string;
  substitutionType: 'item_swap' | 'variant_swap' | 'item_removed' | 'order_cancelled' | 'item_swap_payment_required';
  originalItem: string | any;
  newItem?: string | any;
  priceDifference?: number; // positive for additional charge, negative for refund
  orderTotal?: number; // current order total
  newOrderTotal?: number; // what total will be after payment
  refundAmount?: number;
  chargeAmount?: number;
  quantityChange?: { from: number, to: number };
  paymentUrl?: string;
  reason?: string;
}

const formatPrice = (priceCents: number) => {
  return `$${(priceCents / 100).toFixed(2)}`;
};

const generateSubstitutionEmailHTML = (data: SubstitutionEmailRequest) => {
  const nyTimezone = 'America/New_York';
  const currentTime = formatInTimeZone(new Date(), nyTimezone, 'EEEE, MMMM do, yyyy \'at\' h:mm aaa');
  
  let titleText = '';
  let descriptionText = '';
  let priceChangeSection = '';
  let quantityChangeSection = '';
  
  // Handle quantity changes
  if (data.quantityChange) {
    quantityChangeSection = `
      <div style="background-color: #e0f2fe; padding: 15px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #0369a1;">
        <h4 style="margin: 0 0 5px 0; color: #0369a1; font-size: 14px;">Quantity Updated</h4>
        <p style="margin: 0; color: #0369a1; font-size: 14px;">
          Quantity changed from <strong>${data.quantityChange.from}</strong> to <strong>${data.quantityChange.to}</strong>
        </p>
      </div>
    `;
  }
  
  switch (data.substitutionType) {
    case 'item_swap':
      titleText = 'Item Substitution';
      descriptionText = `We've substituted <strong>${typeof data.originalItem === 'string' ? data.originalItem : data.originalItem.name}</strong> with <strong>${typeof data.newItem === 'string' ? data.newItem : data.newItem.name}</strong> in your order.`;
      break;
    case 'variant_swap':
      titleText = 'Variant Change';
      descriptionText = `We've changed <strong>${typeof data.originalItem === 'string' ? data.originalItem : data.originalItem.name}</strong> to <strong>${typeof data.newItem === 'string' ? data.newItem : data.newItem.name}</strong> in your order.`;
      break;
    case 'item_removed':
      titleText = 'Item Removed';
      descriptionText = `Unfortunately, <strong>${typeof data.originalItem === 'string' ? data.originalItem : data.originalItem.name}</strong> is no longer available and has been removed from your order.`;
      break;
    case 'order_cancelled':
      titleText = 'Order Cancelled';
      descriptionText = `Your entire order has been cancelled as <strong>${typeof data.originalItem === 'string' ? data.originalItem : data.originalItem.name}</strong> was the only item and is no longer available.`;
      break;
    case 'item_swap_payment_required':
      titleText = 'Payment Required for Replacement';
      descriptionText = data.reason || `We need to substitute an item in your order, but the replacement costs more. Please complete payment to finalize your order.`;
      break;
  }

  // Handle payment required scenario
  if (data.substitutionType === 'item_swap_payment_required' && data.paymentUrl && data.priceDifference) {
    priceChangeSection = `
      <div style="background-color: #fef3c7; padding: 25px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b; text-align: center;">
        <h4 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">Payment Required</h4>
        <p style="margin: 0 0 20px 0; color: #92400e; font-size: 16px;">
          Additional payment of <strong>${formatPrice(data.priceDifference)}</strong> required for replacement item.
        </p>
        <a href="${data.paymentUrl}" style="display: inline-block; background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 10px 0;">
          Complete Payment Now
        </a>
        <p style="margin: 15px 0 0 0; color: #92400e; font-size: 14px;">
          Your order will be prepared once payment is completed.
        </p>
      </div>
    `;
  } else if (data.priceDifference && data.priceDifference !== 0) {
    if (data.priceDifference > 0) {
      priceChangeSection = `
        <div style="background-color: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
          <h4 style="margin: 0 0 10px 0; color: #92400e;">Additional Charge</h4>
          <p style="margin: 0; color: #92400e;">
            An additional ${formatPrice(data.priceDifference)} has been charged to your payment method due to the price difference.
          </p>
        </div>
      `;
    } else {
      priceChangeSection = `
        <div style="background-color: #dcfce7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
          <h4 style="margin: 0 0 10px 0; color: #166534;">Refund Processed</h4>
          <p style="margin: 0; color: #166534;">
            A refund of ${formatPrice(Math.abs(data.priceDifference))} has been processed and will appear in your account within 3-5 business days.
          </p>
        </div>
      `;
    }
  }

  if (data.refundAmount && data.refundAmount > 0) {
    priceChangeSection = `
      <div style="background-color: #dcfce7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #10b981;">
        <h4 style="margin: 0 0 10px 0; color: #166534;">Refund Processed</h4>
        <p style="margin: 0; color: #166534;">
          A refund of ${formatPrice(data.refundAmount)} has been processed and will appear in your account within 3-5 business days.
        </p>
      </div>
    `;
  }

  if (data.chargeAmount && data.chargeAmount > 0) {
    priceChangeSection = `
      <div style="background-color: #fef3c7; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #f59e0b;">
        <h4 style="margin: 0 0 10px 0; color: #92400e;">Additional Charge</h4>
        <p style="margin: 0; color: #92400e;">
          An additional ${formatPrice(data.chargeAmount)} has been charged to your payment method.
        </p>
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${titleText} - Maki Express Ramen House</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background-color: #dc2626; color: white; padding: 30px; text-align: center;">
          <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Maki Express Ramen House</h1>
          <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${titleText}</p>
        </div>

        <!-- Update Message -->
        <div style="padding: 30px; text-align: center;">
          <div style="background-color: #f59e0b; color: white; width: 60px; height: 60px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; font-size: 24px;">
            ⚠
          </div>
          <h2 style="margin: 0 0 15px 0; color: #333; font-size: 24px;">Order #${data.orderId.slice(0, 8)} Updated</h2>
          <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.5;">
            ${descriptionText}
          </p>
          <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">
            Updated on ${currentTime}
          </p>
        </div>

        ${quantityChangeSection}
        ${priceChangeSection}

        <!-- Updated Order Total -->
        ${data.substitutionType === 'item_swap_payment_required' ? `
        <div style="padding: 0 30px 30px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 16px; color: #333;">Current Order Total:</span>
              <span style="font-size: 18px; color: #333;">${formatPrice(data.orderTotal || 0)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <span style="font-size: 16px; color: #333;">Additional Payment:</span>
              <span style="font-size: 18px; color: #f59e0b;">+${formatPrice(data.priceDifference || 0)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 2px solid #dc2626; padding-top: 10px;">
              <span style="font-size: 18px; font-weight: bold; color: #333;">New Total After Payment:</span>
              <span style="font-size: 20px; font-weight: bold; color: #dc2626;">${formatPrice((data.orderTotal || 0) + (data.priceDifference || 0))}</span>
            </div>
          </div>
        </div>
        ` : data.orderTotal ? `
        <div style="padding: 0 30px 30px;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <span style="font-size: 18px; font-weight: bold; color: #333;">Updated Order Total:</span>
              <span style="font-size: 20px; font-weight: bold; color: #dc2626;">${formatPrice(data.orderTotal)}</span>
            </div>
          </div>
        </div>
        ` : ''}

        <!-- Contact Info -->
        <div style="background-color: #f8f9fa; padding: 30px; margin: 20px 30px; border-radius: 8px;">
          <h3 style="margin: 0 0 15px 0; color: #dc2626; font-size: 18px;">Questions?</h3>
          <p style="margin: 0 0 10px 0; color: #333;">
            If you have any concerns about this change, please contact us:
          </p>
          <div>
            <strong style="color: #333;">Phone:</strong> (513) 721-6999<br>
            <strong style="color: #333;">Location:</strong> 209 W McMillan St, Cincinnati, OH 45219
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #374151; color: white; padding: 30px; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: bold;">Maki Express Ramen House</p>
          <p style="margin: 0; font-size: 14px; opacity: 0.8;">
            Thank you for your understanding
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const emailData: SubstitutionEmailRequest = await req.json();

    console.log(`[SUBSTITUTION EMAIL] Starting function for order:`, emailData.orderId);
    console.log(`[SUBSTITUTION EMAIL] Email data:`, JSON.stringify(emailData, null, 2));

    const subject = `Order Update #${emailData.orderId.slice(0, 8)} - Maki Express Ramen House`;
    const html = generateSubstitutionEmailHTML(emailData);

    // Send emails using the same pattern as order emails
    const isDevelopment = Deno.env.get("ENVIRONMENT") !== "production";
    const customerEmail = emailData.customerEmail;
    const restaurantEmail = "makiexpress01@gmail.com";
    
    // In development, send only to restaurant email for testing
    const toEmails = isDevelopment ? [restaurantEmail] : [customerEmail, restaurantEmail];
    
    console.log(`Sending substitution email to: ${toEmails.join(', ')}`);

    const emailResponse = await resend.emails.send({
      from: "Maki Express Ramen House <orders@arunkhadka.com>",
      to: toEmails,
      subject: isDevelopment ? `[DEV] ${subject}` : subject,
      html: html,
    });

    console.log("Substitution email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      emailResponse
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-substitution-email function:", error);
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