// Updated: 2025-07-29 16:30:23
// Updated: 2025-07-29 16:30:18
// Updated: 2025-07-29 16:30:13
// Updated: 2025-07-29 16:30:00
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: {
    id: string;
    customer_name?: string;
    customer_email?: string;
    total_cents: number;
    stripe_payment_id?: string;
  };
  onSuccess: () => void;
}

export function CancelOrderDialog({ open, onOpenChange, order, onSuccess }: CancelOrderDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    if (confirmText !== 'confirm cancellation') {
      toast({
        title: "Incorrect confirmation",
        description: "Please type 'confirm cancellation' exactly to proceed.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if we have a payment ID (could be Stripe session or payment_intent)
      const hasPaymentId = order.stripe_payment_id && order.stripe_payment_id.trim() !== '';
      
      // Process refund only if there's a payment ID
      if (hasPaymentId) {
        const { error: refundError } = await supabase.functions.invoke('refund-stripe-payment', {
          body: {
            paymentId: order.stripe_payment_id,
            orderId: order.id,
            amount: order.total_cents
          }
        });

        if (refundError) {
          console.error('Refund error:', refundError);
          throw new Error('Failed to process refund');
        }
      }

      // Update order status to cancelled
      const { error: updateError } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);

      if (updateError) throw updateError;

      // Send cancellation email
      try {
        const { data: orderWithItems } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              id,
              quantity,
              unit_price_cents,
              menu_items (
                name,
                description
              )
            )
          `)
          .eq('id', order.id)
          .single();

        if (orderWithItems) {
          await supabase.functions.invoke('send-order-email', {
            body: {
              type: 'cancellation',
              order: orderWithItems
            }
          });
        }
      } catch (emailError) {
        console.error('Failed to send cancellation email:', emailError);
        // Don't block the cancellation if email fails
      }

      toast({
        title: "Order cancelled successfully",
        description: hasPaymentId 
          ? "The order has been cancelled and refund has been processed."
          : "The order has been cancelled.",
      });

      onSuccess();
      onOpenChange(false);
      setConfirmText('');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "Error cancelling order",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-base sm:text-lg">Cancel Order</AlertDialogTitle>
          <AlertDialogDescription className="text-sm">
            Are you sure you want to cancel this order? This action cannot be undone.
            {order.stripe_payment_id && order.stripe_payment_id.trim() !== '' 
              ? " A full refund will be processed automatically." 
              : " No payment was processed for this order."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="py-2 sm:py-4">
          <div className="space-y-2">
            <Label htmlFor="confirm-text" className="text-sm">
              Type "confirm cancellation" to proceed:
            </Label>
            <Input
              id="confirm-text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="confirm cancellation"
              className="font-mono text-sm h-9 sm:h-10"
            />
          </div>
          
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-muted rounded-lg">
            <h4 className="font-medium mb-2 text-sm">Order Details:</h4>
            <p className="text-xs sm:text-sm"><strong>Order ID:</strong> {order.id.slice(0, 8)}...</p>
            <p className="text-xs sm:text-sm"><strong>Customer:</strong> {order.customer_name || 'Anonymous'}</p>
            <p className="text-xs sm:text-sm"><strong>Total:</strong> ${(order.total_cents / 100).toFixed(2)}</p>
          </div>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel onClick={() => setConfirmText('')} className="w-full sm:w-auto">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            disabled={confirmText !== 'confirm cancellation' || loading}
            className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Cancelling...' : 'Cancel Order'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}