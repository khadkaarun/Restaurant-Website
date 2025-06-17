import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DollarSign, Clock, User, Phone, Mail, Utensils, RefreshCw, ArrowRightLeft, MoreVertical, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import ItemReplacementButton from '@/components/ItemReplacementButton';

interface OrderItem {
  id: string;
  menu_item_id: string;
  quantity: number;
  unit_price_cents: number;
  special_instructions?: string;
  custom_name?: string;
  menu_items?: {
    name: string;
    description: string;
  };
}

interface Order {
  id: string;
  status: string;
  total_cents: number;
  created_at: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  special_requests: string | null;
  stripe_payment_id: string | null;
  order_items?: OrderItem[];
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  category_id: string;
  stock_status: string;
  menu_categories?: {
    name: string;
  };
}

interface MenuCategory {
  id: string;
  name: string;
}

interface OrderDetailsModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onOrderUpdate?: () => void;
}

interface ReplacementStep {
  item: OrderItem;
  step: 'confirm' | 'out_of_stock_choice' | 'stock_options' | 'action_choice' | 'replacement_type' | 'replacement_options';
  replacementType?: 'item' | 'protein';
  outOfStockChoice?: 'protein' | 'entire_item';
}

export default function OrderDetailsModal({ orderId, isOpen, onClose, onOrderUpdate }: OrderDetailsModalProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState<string | null>(null);
  const [replacementStep, setReplacementStep] = useState<ReplacementStep | null>(null);
  const [availableVariants, setAvailableVariants] = useState<any[]>([]);


  // Component to fetch and display variant options from database
  const VariantOptions = ({ menuItemId, currentVariant, onVariantSelect, disabled, formatPrice, basePriceCents }: {
    menuItemId: string;
    currentVariant: string;
    onVariantSelect: (variantName: string, newPriceCents: number) => void;
    disabled: boolean;
    formatPrice: (cents: number) => string;
    basePriceCents: number;
  }) => {
    const [variants, setVariants] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
      const fetchVariants = async () => {
        setLoading(true);
        try {          
          const { data, error } = await supabase
            .from('menu_item_variants')
            .select('*')
            .eq('menu_item_id', menuItemId)
            .in('stock_status', ['in_stock', 'low_stock'])
            .neq('variant_name', currentVariant)
            .order('sort_order');

          console.log('VariantOptions - Fetching for:', menuItemId, 'Current variant:', currentVariant, 'Found variants:', data?.length || 0);
          
          if (error) throw error;
          setVariants(data || []);
        } catch (error) {
          console.error('Error fetching variants:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchVariants();
    }, [menuItemId, currentVariant]);

    if (loading) {
      return <p className="text-sm text-muted-foreground text-center">Loading alternatives...</p>;
    }

    if (variants.length === 0) {
      return <p className="text-sm text-muted-foreground text-center">No alternative variants available</p>;
    }

    return (
      <>
        {variants.map((variant) => {
          // Find the base price for this menu item to ensure consistent pricing
          const menuItem = menuItems.find(item => item.id === menuItemId);
          const basePrice = menuItem?.price_cents || basePriceCents;
          const newPriceCents = basePrice + variant.price_modifier_cents;
          const displayName = variant.variant_name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          return (
            <Button
              key={variant.id}
              size="sm"
              variant="outline"
              className="w-full justify-between"
              onClick={() => onVariantSelect(variant.variant_name, newPriceCents)}
              disabled={disabled}
            >
              <span>{displayName}</span>
              <span>{formatPrice(newPriceCents)}</span>
            </Button>
          );
        })}
      </>
    );
  };

  const fetchOrder = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            menu_item_id,
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

      if (error) throw error;
      setOrder(data);
    } catch (error) {
      console.error('Error fetching order:', error);
      toast.error('Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const [itemsResult, categoriesResult] = await Promise.all([
        supabase
          .from('menu_items')
          .select(`
            id, 
            name, 
            description, 
            price_cents, 
            category_id, 
            stock_status,
            menu_categories (
              name
            )
          `)
          .eq('is_available', true)
          .order('name'),
        supabase
          .from('menu_categories')
          .select('id, name')
          .order('sort_order')
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setMenuItems(itemsResult.data || []);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  };

  const markItemOutOfStock = async (menuItemId: string, stockDuration: string, stockUntil?: string, variantName?: string) => {
    try {
      if (variantName) {
        // Mark specific variant out of stock
        const updateData: any = { stock_status: stockDuration };
        if (stockDuration === 'out_until' && stockUntil) {
          updateData.out_until = stockUntil;
        }

        const { error } = await supabase
          .from('menu_item_variants')
          .update(updateData)
          .eq('menu_item_id', menuItemId)
          .eq('variant_name', variantName);

        if (error) throw error;

        toast.success(`${variantName} variant marked out of stock`);
        
        // Check if replacement is needed and show options
        if (replacementStep?.item) {
          await handleVariantReplacement(replacementStep.item, variantName);
        } else {
          // Only close if no replacement step was active
          setReplacementStep(null);
        }
      } else {
        // Mark entire item out of stock
        const updateData: any = { stock_status: stockDuration };
        if (stockDuration === 'out_until' && stockUntil) {
          updateData.out_until = stockUntil;
        }

        const { error } = await supabase
          .from('menu_items')
          .update(updateData)
          .eq('id', menuItemId);

        if (error) throw error;

        toast.success('Item marked out of stock');
        
        // For entire item out of stock, check if there are orders with this item
        if (replacementStep?.item) {
          await handleEntireItemOutOfStock(replacementStep.item);
        } else {
          setReplacementStep(null);
        }
      }
      
      // Refresh the order data
      await fetchOrder();
      onOrderUpdate?.();
    } catch (error) {
      console.error('Error marking item out of stock:', error);
      toast.error('Failed to mark item out of stock');
    }
  };

  const handleEntireItemOutOfStock = async (orderItem: OrderItem) => {
    try {
      // Check if this is the only item in the order
      if (order?.order_items?.length === 1) {
        // Only item - offer cancellation
        if (window.confirm('This item is out of stock and it\'s the only item in your order. Do you want to cancel the entire order?')) {
          await cancelOrderItem(orderItem.id);
        }
        return;
      }

      // Multiple items - offer replacement or removal
      setReplacementStep({
        item: orderItem,
        step: 'replacement_type',
        outOfStockChoice: 'entire_item'
      });
    } catch (error) {
      console.error('Error handling entire item out of stock:', error);
      toast.error('Failed to process out of stock item');
    }
  };

  const handleVariantReplacement = async (orderItem: OrderItem, outOfStockVariant: string) => {
    try {
      // Get available variants for this item
      const { data: variants, error } = await supabase
        .from('menu_item_variants')
        .select('*')
        .eq('menu_item_id', orderItem.menu_item_id)
        .in('stock_status', ['in_stock', 'low_stock'])
        .neq('variant_name', outOfStockVariant);

      if (error) throw error;

      if (variants && variants.length > 0) {
        // Show replacement options
        setReplacementStep({
          item: orderItem,
          step: 'replacement_options',
          replacementType: 'protein',
          outOfStockChoice: 'protein'
        });
      } else {
        // No alternatives available, offer cancellation
        if (window.confirm('No alternative variants available. Do you want to cancel this order item?')) {
          await cancelOrderItem(orderItem.id);
        }
      }
    } catch (error) {
      console.error('Error handling variant replacement:', error);
      toast.error('Failed to process replacement');
    }
  };

  const cancelOrderItem = async (orderItemId: string) => {
    if (!order) return;

    try {
      const orderItem = order.order_items?.find(item => item.id === orderItemId);
      if (!orderItem) throw new Error('Order item not found');

      const refundAmount = orderItem.unit_price_cents * orderItem.quantity;
      const itemName = orderItem.custom_name || getDisplayName(orderItem.menu_items?.name || '', orderItem.unit_price_cents);

      // Check if this is the only item
      if (order.order_items?.length === 1) {
        // Process full refund
        const refundResult = await processRefund(order.total_cents);
        
        // Cancel entire order
        const { error: orderError } = await supabase
          .from('orders')
          .update({ status: 'cancelled' })
          .eq('id', order.id);

        if (orderError) throw orderError;
        
        // Send substitution email notification
        await sendSubstitutionEmail({
          substitutionType: 'order_cancelled',
          originalItem: itemName,
          refundAmount: order.total_cents,
          orderTotal: 0
        });
        
        toast.success('Order cancelled and refund processed');
      } else {
        // Process partial refund
        const refundResult = await processRefund(refundAmount);
        
        // Remove item and update total
        const { error: deleteError } = await supabase
          .from('order_items')
          .delete()
          .eq('id', orderItemId);

        if (deleteError) throw deleteError;

        // Recalculate total
        const newTotal = order.total_cents - refundAmount;
        const { error: updateError } = await supabase
          .from('orders')
          .update({ total_cents: newTotal })
          .eq('id', order.id);

        if (updateError) throw updateError;

        // Send substitution email notification
        await sendSubstitutionEmail({
          substitutionType: 'item_removed',
          originalItem: itemName,
          refundAmount,
          orderTotal: newTotal
        });

        toast.success('Item cancelled and refund processed');
      }

      await fetchOrder();
      onOrderUpdate?.();
      setReplacementStep(null);
    } catch (error) {
      console.error('Error cancelling item:', error);
      toast.error('Failed to cancel item');
    }
  };

  const swapItem = async (orderItemId: string, newMenuItemId: string, selectedVariant?: {variant_name: string, price_modifier_cents: number}, quantity?: number) => {
    if (!order) return;

    setSwapping(orderItemId);
    try {
      const newMenuItem = menuItems.find(item => item.id === newMenuItemId);
      const orderItem = order.order_items?.find(item => item.id === orderItemId);
      if (!newMenuItem || !orderItem) throw new Error('Item not found');

      const oldItemName = getDisplayName(orderItem.menu_items?.name || '', orderItem.unit_price_cents);
      
      // Calculate the final price with variant modifier
      let finalPriceCents = newMenuItem.price_cents;
      let newItemName = newMenuItem.name;
      
      if (selectedVariant) {
        finalPriceCents += selectedVariant.price_modifier_cents;
        newItemName = getVariantDisplayName(newMenuItem.name, selectedVariant.variant_name, finalPriceCents);
      }

      // Use the provided quantity or keep the original
      const finalQuantity = quantity !== undefined ? quantity : orderItem.quantity;

      // Calculate price difference (considering quantity changes)
      const oldTotal = orderItem.unit_price_cents * orderItem.quantity;
      const newTotal = finalPriceCents * finalQuantity;
      const priceDifference = newTotal - oldTotal;

      if (priceDifference > 0) {
        // Price is higher - update database immediately and create checkout for difference
        
        // First update the order item in database
        const { error: updateError } = await supabase
          .from('order_items')
          .update({
            menu_item_id: newMenuItemId,
            unit_price_cents: finalPriceCents,
            custom_name: newItemName,
            quantity: finalQuantity
          })
          .eq('id', orderItemId);

        if (updateError) throw updateError;

        // Update order total
        const newOrderTotal = order.total_cents + priceDifference;
        const { error: orderUpdateError } = await supabase
          .from('orders')
          .update({ total_cents: newOrderTotal })
          .eq('id', order.id);

        if (orderUpdateError) throw orderUpdateError;

        // Create additional charge for the price difference
        const { data: chargeData, error: chargeError } = await supabase.functions.invoke('charge-stripe-additional', {
          body: {
            orderId: order.id,
            additionalAmountCents: priceDifference,
            description: `Price difference for ${oldItemName} → ${newItemName} replacement`
          }
        });

        if (chargeError) throw chargeError;

        if (chargeData?.checkout_url) {
          // Send substitution email with payment link and correct totals
          const substitutionData = {
            customerEmail: order.customer_email,
            customerName: order.customer_name || 'Customer',
            orderId: order.id,
            substitutionType: 'item_swap_payment_required',
            originalItem: {
              name: oldItemName,
              quantity: orderItem.quantity,
              price: orderItem.unit_price_cents
            },
            newItem: {
              name: newItemName,
              quantity: finalQuantity,
              price: finalPriceCents
            },
            priceDifference: priceDifference,
            paymentUrl: chargeData.checkout_url,
            orderTotal: order.total_cents, // Original total
            newOrderTotal: newOrderTotal, // New total after substitution
            reason: `Hi ${order.customer_name || 'there'}! Unfortunately, ${oldItemName} is currently unavailable. We'd love to substitute it with ${newItemName} instead. There's a small price difference of $${(priceDifference / 100).toFixed(2)}. Please use the payment link below to authorize this change, and we'll have your delicious order ready as soon as possible!`
          };

          const { error: emailError } = await supabase.functions.invoke('send-substitution-email', {
            body: substitutionData
          });

          if (emailError) {
            console.error('Email sending failed:', emailError);
            toast.error(`Item updated but email failed: ${emailError.message}`);
          } else {
            console.log('Substitution email invoked successfully');
            toast.success(`Item updated! Payment link sent to customer for $${(priceDifference / 100).toFixed(2)} price difference.`);
          }
          
          await fetchOrder(); // Refresh order data
          onOrderUpdate?.();
          setReplacementStep(null);
          return;
        }
      }

      // If no price difference or price is lower, proceed with immediate replacement
      const { error } = await supabase
        .from('order_items')
        .update({
          menu_item_id: newMenuItemId,
          unit_price_cents: finalPriceCents,
          custom_name: newItemName,
          quantity: finalQuantity
        })
        .eq('id', orderItemId);

      if (error) throw error;

      // Update order total
      if (priceDifference !== 0) {
        const newOrderTotal = order.total_cents + priceDifference;
        const { error: updateError } = await supabase
          .from('orders')
          .update({ total_cents: newOrderTotal })
          .eq('id', order.id);

        if (updateError) throw updateError;

        // Process refund if price is lower
        if (priceDifference < 0) {
          await processRefund(Math.abs(priceDifference));
        }
      }

      // Send substitution email for completed replacement
      await sendSubstitutionEmail({
        substitutionType: 'item_swap',
        originalItem: oldItemName,
        newItem: newItemName,
        priceDifference,
        orderTotal: order.total_cents + priceDifference,
        quantityChange: finalQuantity !== orderItem.quantity ? { from: orderItem.quantity, to: finalQuantity } : undefined
      });

      toast.success('Item swapped successfully');
      await fetchOrder();
      onOrderUpdate?.();
      setReplacementStep(null);
    } catch (error) {
      console.error('Error swapping item:', error);
      toast.error('Failed to swap item');
    } finally {
      setSwapping(null);
    }
  };

  const swapProtein = async (orderItemId: string, newPriceCents: number) => {
    if (!order) return;

    setSwapping(orderItemId);
    try {
      const orderItem = order.order_items?.find(item => item.id === orderItemId);
      if (!orderItem) throw new Error('Order item not found');

      const oldItemName = getDisplayName(orderItem.menu_items?.name || '', orderItem.unit_price_cents);
      const newItemName = getDisplayName(orderItem.menu_items?.name || '', newPriceCents);

      const { error } = await supabase
        .from('order_items')
        .update({
          unit_price_cents: newPriceCents,
          custom_name: newItemName
        })
        .eq('id', orderItemId);

      if (error) throw error;

      // Update order total with price difference
      const priceDifference = (newPriceCents - orderItem.unit_price_cents) * orderItem.quantity;
      if (priceDifference !== 0) {
        const newTotal = order.total_cents + priceDifference;
        const { error: updateError } = await supabase
          .from('orders')
          .update({ total_cents: newTotal })
          .eq('id', order.id);

        if (updateError) throw updateError;
      }

      // Send substitution email notification
      await sendSubstitutionEmail({
        substitutionType: 'variant_swap',
        originalItem: oldItemName,
        newItem: newItemName,
        priceDifference,
        orderTotal: order.total_cents + priceDifference
      });

      toast.success('Protein swapped successfully');
      await fetchOrder();
      onOrderUpdate?.();
      setReplacementStep(null);
    } catch (error) {
      console.error('Error swapping protein:', error);
      toast.error('Failed to swap protein');
    } finally {
      setSwapping(null);
    }
  };

  const swapVariant = async (orderItemId: string, variantName: string, newPriceCents: number) => {
    if (!order) return;

    setSwapping(orderItemId);
    try {
      const orderItem = order.order_items?.find(item => item.id === orderItemId);
      if (!orderItem) throw new Error('Order item not found');

      // Get the base item name and create new display name with variant
      const baseItemName = orderItem.menu_items?.name || '';
      const oldItemName = orderItem.custom_name || getDisplayName(baseItemName, orderItem.unit_price_cents);
      
      // Create new name based on variant
      const newItemName = getVariantDisplayName(baseItemName, variantName, newPriceCents);

      const { error } = await supabase
        .from('order_items')
        .update({
          unit_price_cents: newPriceCents,
          custom_name: newItemName
        })
        .eq('id', orderItemId);

      if (error) throw error;

      // Handle price difference with Stripe
      const priceDifference = (newPriceCents - orderItem.unit_price_cents) * orderItem.quantity;
      let stripeResult = null;
      
      if (priceDifference !== 0) {
        const newTotal = order.total_cents + priceDifference;
        const { error: updateError } = await supabase
          .from('orders')
          .update({ total_cents: newTotal })
          .eq('id', order.id);

        if (updateError) throw updateError;

        // Process price difference with Stripe
        if (priceDifference > 0) {
          // Charge additional amount
          stripeResult = await processAdditionalCharge(priceDifference, `Variant change: ${oldItemName} → ${newItemName}`);
        } else {
          // Refund difference
          stripeResult = await processRefund(Math.abs(priceDifference));
        }
      }

      // Send substitution email notification
      await sendSubstitutionEmail({
        substitutionType: 'variant_swap',
        originalItem: oldItemName,
        newItem: newItemName,
        priceDifference,
        orderTotal: order.total_cents + priceDifference
      });

      toast.success('Variant swapped successfully');
      await fetchOrder();
      onOrderUpdate?.();
      setReplacementStep(null);
    } catch (error) {
      console.error('Error swapping variant:', error);
      toast.error('Failed to swap variant');
    } finally {
      setSwapping(null);
    }
  };

  // Get variant display name based on variant name
  const getVariantDisplayName = (baseItemName: string, variantName: string, priceCents: number) => {
    const name = baseItemName.toLowerCase();
    const variant = variantName.toLowerCase();
    
    if (name.includes('teriyaki')) {
      return `Teriyaki ${variantName.charAt(0).toUpperCase() + variantName.slice(1)}`;
    }
    
    if (name.includes('katsu curry')) {
      return `Japanese Katsu Curry (${variantName.charAt(0).toUpperCase() + variantName.slice(1)})`;
    }
    
    if (name.includes('katsu don')) {
      return `Katsu Don (${variantName.replace('don_', '').charAt(0).toUpperCase() + variantName.replace('don_', '').slice(1)})`;
    }
    
    if (name.includes('curry udon')) {
      // Format variant name consistently - remove underscore and capitalize properly
      const formattedVariant = variantName.replace('katsu_', 'Katsu ').replace('_', ' ');
      return `Curry Udon (${formattedVariant.charAt(0).toUpperCase() + formattedVariant.slice(1)})`;
    }
    
    if (name.includes('pho')) {
      return `Pho (${variantName.charAt(0).toUpperCase() + variantName.slice(1)})`;
    }
    
    if (name.includes('udon') && !name.includes('curry')) {
      const displayVariant = variantName === 'shrimp_tempura' ? 'Shrimp Tempura' : 
                           variantName.charAt(0).toUpperCase() + variantName.slice(1);
      return `Udon (${displayVariant})`;
    }
    
    if (name.includes('katsu sando')) {
      const proteinName = variantName.replace('katsu_', '');
      return `Katsu Sando (${proteinName.charAt(0).toUpperCase() + proteinName.slice(1)})`;
    }
    
    if (name.includes('onigiri')) {
      const displayVariant = variantName === 'chicken_karaage' ? 'Chicken Karaage' :
                           variantName.charAt(0).toUpperCase() + variantName.slice(1);
      return `Onigiri (${displayVariant})`;
    }
    
    return `${baseItemName} (${variantName.charAt(0).toUpperCase() + variantName.slice(1)})`;
  };

  // Get protein alternatives for an item
  const getProteinAlternatives = (itemName: string, currentPriceCents: number) => {
    const name = itemName.toLowerCase();
    
    if (name.includes('teriyaki')) {
      // Determine current protein based on price
      const currentProtein = currentPriceCents === 1200 ? 'salmon' : 
                           currentPriceCents === 900 ? 'tofu' : 'chicken';
      const alternatives = ['chicken', 'salmon', 'tofu'].filter(p => p !== currentProtein);
      return alternatives.map(protein => {
        const newPrice = protein === 'chicken' ? 1000 :
                        protein === 'salmon' ? 1200 : 900;
        return {
          protein,
          name: `Teriyaki ${protein.charAt(0).toUpperCase() + protein.slice(1)}`,
          priceCents: newPrice
        };
      });
    }
    
    if (name.includes('katsu curry') || name.includes('katsu don') || name.includes('curry udon')) {
      const currentProtein = name.includes('pork') ? 'katsu_pork' : 'katsu_chicken';
      const otherProtein = currentProtein === 'katsu_pork' ? 'katsu_chicken' : 'katsu_pork';
      let dishType = '';
      if (name.includes('katsu curry')) dishType = 'Japanese Katsu Curry';
      else if (name.includes('katsu don')) dishType = 'Katsu Don';
      else if (name.includes('curry udon')) dishType = 'Curry Udon';
      
      // Display name should show just the protein without "katsu_" prefix
      const displayProtein = otherProtein.replace('katsu_', '');
      
      return [{
        protein: otherProtein,
        name: `${dishType} (${displayProtein.charAt(0).toUpperCase() + displayProtein.slice(1)})`,
        priceCents: currentPriceCents // Keep original price for katsu swaps
      }];
    }
    
    if (name.includes('pho')) {
      const currentProtein = name.includes('beef') ? 'beef' : 'chicken';
      const otherProtein = currentProtein === 'beef' ? 'chicken' : 'beef';
      return [{
        protein: otherProtein,
        name: `Pho (${otherProtein.charAt(0).toUpperCase() + otherProtein.slice(1)})`,
        priceCents: currentPriceCents // Keep original price for pho swaps
      }];
    }
    
    if (name.includes('udon') && !name.includes('curry')) {
      const currentProtein = name.includes('chicken') ? 'chicken' :
                           name.includes('beef') ? 'beef' :
                           name.includes('shrimp') ? 'shrimp' : 'tofu';
      const allProteins = ['chicken', 'beef', 'shrimp', 'tofu'];
      const alternatives = allProteins.filter(p => p !== currentProtein);
      
      return alternatives.map(protein => ({
        protein,
        name: `Udon (${protein.charAt(0).toUpperCase() + protein.slice(1)}${protein === 'shrimp' ? ' Tempura' : ''})`,
        priceCents: currentPriceCents // Keep original price for udon swaps
      }));
    }
    
    // For any other items with protein options, keep the same price
    return [];
  };

  // Get available replacement items based on category
  const getReplacementItems = (currentItem: OrderItem, replacementType: 'item' | 'protein') => {
    const currentItemName = currentItem.menu_items?.name || '';
    
    if (replacementType === 'protein') {
      return getProteinAlternatives(currentItemName, currentItem.unit_price_cents);
    }
    
    // For full item replacement, get items from same category but not the same item
    const currentMenuItem = menuItems.find(item => item.id === currentItem.menu_item_id);
    if (!currentMenuItem) return [];
    
    return menuItems.filter(item => 
      item.category_id === currentMenuItem.category_id &&
      item.id !== currentMenuItem.id &&
      ['in_stock', 'low_stock'].includes(item.stock_status || 'in_stock')
    );
  };

  // Check if item supports protein replacement
  const supportsProteinReplacement = (itemName: string) => {
    const name = itemName.toLowerCase();
    return name.includes('teriyaki') || 
           name.includes('katsu curry') || 
           name.includes('katsu don') ||
           name.includes('pho') ||
           name.includes('udon');
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrder();
      fetchMenuItems();
    }
  }, [isOpen, orderId]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get current variant name based on item name and price
  const getCurrentVariantName = (itemName: string, priceCents: number, customName?: string) => {
    const name = itemName.toLowerCase();
    
    if (name.includes('teriyaki')) {
      if (priceCents === 1200) return 'salmon';
      if (priceCents === 900) return 'tofu';
      return 'chicken';
    }
    
    if (name.includes('katsu curry') || name.includes('katsu don') || name.includes('curry udon')) {
      // For curry udon, use custom name if available since both variants have same price
      if (customName?.toLowerCase().includes('pork') || customName?.toLowerCase().includes('katsu_pork') || customName?.toLowerCase().includes('katsu pork')) {
        return 'katsu_pork';
      }
      if (customName?.toLowerCase().includes('chicken') || customName?.toLowerCase().includes('katsu_chicken') || customName?.toLowerCase().includes('katsu chicken')) {
        return 'katsu_chicken';
      }
      // Fallback to price check (though both variants have same price for curry udon)
      if (priceCents > 1300 || name.includes('pork')) return 'katsu_pork';
      return 'katsu_chicken';
    }
    
    if (name.includes('pho')) {
      if (priceCents === 1100) return 'beef';
      return 'chicken';
    }
    
    if (name.includes('udon') && !name.includes('curry')) {
      if (priceCents === 1200) return 'beef';
      if (priceCents === 1100) return 'chicken';
      if (priceCents === 1000) return 'tofu';
      return 'shrimp_tempura';
    }
    
    if (name.includes('katsu sando')) {
      if (name.includes('pork')) return 'katsu_pork';
      return 'katsu_chicken';
    }
    
    if (name.includes('onigiri')) {
      if (name.includes('tuna')) return 'tuna';
      if (name.includes('chicken')) return 'chicken_karaage';
      return 'salmon';
    }
    
    return 'chicken'; // fallback
  };

  // Get display name with protein variant
  const getDisplayName = (baseName: string, priceCents: number) => {
    const name = baseName.toLowerCase();
    
    if (name.includes('teriyaki')) {
      if (priceCents === 1000) return 'Teriyaki Chicken';
      if (priceCents === 1200) return 'Teriyaki Salmon';
      if (priceCents === 900) return 'Teriyaki Tofu';
      return baseName; // fallback
    }
    
    if (name.includes('katsu curry')) {
      if (priceCents === 1400) return 'Katsu Curry Pork';
      if (priceCents === 1300) return 'Katsu Curry Chicken';
      return baseName;
    }
    
    if (name.includes('katsu don')) {
      if (priceCents === 1200) return 'Katsu Don Pork';
      if (priceCents === 1100) return 'Katsu Don Chicken';
      return baseName;
    }
    
    if (name.includes('pho')) {
      if (priceCents === 1100) return 'Pho Beef';
      if (priceCents === 1000) return 'Pho Chicken';
      return baseName;
    }
    
    if (name.includes('udon')) {
      if (priceCents === 1200) return 'Udon Beef';
      if (priceCents === 1100) return 'Udon Chicken';
      if (priceCents === 1000) return 'Udon Tofu';
      return baseName;
    }
    
    return baseName;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'ready_for_pickup': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  const getEstimatedPickupTime = (orderTime: string) => {
    const orderDate = new Date(orderTime);
    const pickupDate = new Date(orderDate.getTime() + 15 * 60000); // Add 15 minutes
    return pickupDate.toLocaleTimeString();
  };

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  // Send substitution email notification
  const sendSubstitutionEmail = async (emailData: {
    substitutionType: 'item_swap' | 'variant_swap' | 'item_removed' | 'order_cancelled';
    originalItem: string;
    newItem?: string;
    priceDifference?: number;
    orderTotal: number;
    refundAmount?: number;
    chargeAmount?: number;
    quantityChange?: { from: number, to: number };
  }) => {
    if (!order?.customer_email) return;

    try {
      const { error } = await supabase.functions.invoke('send-substitution-email', {
        body: {
          customerEmail: order.customer_email,
          customerName: order.customer_name || 'Customer',
          orderId: order.id,
          ...emailData
        }
      });

      if (error) {
        console.error('Error sending substitution email:', error);
        toast.error('Failed to send email notification');
      } else {
        console.log('Substitution email sent successfully');
        toast.success('Email notification sent to customer');
      }
    } catch (error) {
      console.error('Error sending substitution email:', error);
      toast.error('Failed to send email notification');
    }
  };

  // Process additional charge using new edge function
  const processAdditionalCharge = async (additionalAmountCents: number, description: string) => {
    if (!order?.stripe_payment_id) return null;

    try {
      const { data, error } = await supabase.functions.invoke('charge-stripe-additional', {
        body: {
          orderId: order.id,
          additionalAmountCents,
          description
        }
      });

      if (error) {
        console.error('Error processing additional charge:', error);
        toast.error('Failed to process additional charge');
        return null;
      }

      // Return the checkout data without opening for staff
      if (data?.checkout_url) {
        toast.success(`Additional charge of $${(additionalAmountCents / 100).toFixed(2)} created. Customer will receive payment link via email.`);
        return data;
      }

      return data;
    } catch (error) {
      console.error('Error processing additional charge:', error);
      toast.error('Failed to process additional charge');
      return null;
    }
  };

  // Process refund using existing refund-stripe-payment function
  const processRefund = async (refundAmountCents: number) => {
    if (!order?.stripe_payment_id) return null;

    try {
      const { data, error } = await supabase.functions.invoke('refund-stripe-payment', {
        body: {
          paymentId: order.stripe_payment_id,
          orderId: order.id,
          amount: refundAmountCents
        }
      });

      if (error) {
        console.error('Error processing refund:', error);
        toast.error('Failed to process refund');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error processing refund:', error);
      return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 sm:max-w-[95vw] sm:max-h-[95vh] md:max-w-2xl">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="flex items-center justify-between">
            <span>Order Details</span>
            {order && (
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : order ? (
            <div className="space-y-6 pb-6">
              {/* Order Info */}
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Order ID</p>
                      <p className="text-muted-foreground">#{order.id.slice(-8).toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="font-medium">Order Time</p>
                      <p className="text-muted-foreground">{formatDate(order.created_at)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Total</p>
                      <p className="text-muted-foreground font-semibold">${(order.total_cents / 100).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Est. Pickup</p>
                      <p className="text-muted-foreground">{getEstimatedPickupTime(order.created_at)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Customer Information
                </h3>
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{order.customer_name || 'Anonymous'}</span>
                    </div>
                    {order.customer_email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{order.customer_email}</span>
                      </div>
                    )}
                    {order.customer_phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{order.customer_phone}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Utensils className="w-4 h-4" />
                  Order Items ({order.order_items?.length || 0})
                </h3>
                <div className="space-y-3">
                  {order.order_items?.map((item) => (
                    <Card key={item.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium">{item.custom_name || getDisplayName(item.menu_items?.name || '', item.unit_price_cents)}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} • {formatPrice(item.unit_price_cents)} each
                            </p>
                            {item.special_instructions && (
                              <p className="text-xs text-muted-foreground mt-1 italic">
                                Note: {item.special_instructions}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-medium">
                              {formatPrice(item.unit_price_cents * item.quantity)}
                            </div>
                            
                            {/* Three dots menu for item actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-background border shadow-lg">
                                <DropdownMenuItem 
                                  onClick={() => setReplacementStep({ item, step: 'confirm' })}
                                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                >
                                  <RefreshCw className="w-4 h-4 mr-2" />
                                  Replace Item
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => cancelOrderItem(item.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Cancel Item
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Replacement Flow */}
                        {replacementStep?.item.id === item.id && (
                          <div className="mt-4 p-3 border rounded-lg bg-muted/50 space-y-3">
                            {/* Block editing if entire item is out of stock */}
                            {(() => {
                              const menuItem = menuItems.find(mi => mi.id === item.menu_item_id);
                              if (menuItem?.stock_status === 'out_of_stock' || menuItem?.stock_status === 'out_until') {
                                return (
                                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800 font-medium">⚠️ This entire item is out of stock</p>
                                    <p className="text-red-600 text-sm mt-1">
                                      This item is no longer available and cannot be modified.
                                    </p>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      className="mt-2"
                                      onClick={() => cancelOrderItem(item.id)}
                                    >
                                      Remove Item & Process Refund
                                    </Button>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            {/* Confirmation Step - only show if item is available */}
                            {replacementStep.step === 'confirm' && (() => {
                              const menuItem = menuItems.find(mi => mi.id === item.menu_item_id);
                              return ['in_stock', 'low_stock'].includes(menuItem?.stock_status || 'in_stock') || !menuItem;
                            })() && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium text-center">
                                  Are you sure you want to replace "{item.menu_items?.name}"?
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => setReplacementStep({ ...replacementStep, step: 'out_of_stock_choice' })}
                                    className="flex-1"
                                  >
                                    Yes, Continue
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setReplacementStep(null)}
                                    className="flex-1"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Out of Stock Choice Step */}
                            {replacementStep.step === 'out_of_stock_choice' && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium">What do you want to mark as out of stock?</p>
                                <div className="grid grid-cols-1 gap-2">
                                  {supportsProteinReplacement(item.menu_items?.name || '') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setReplacementStep({ 
                                        ...replacementStep, 
                                        step: 'stock_options',
                                        outOfStockChoice: 'protein'
                                      })}
                                    >
                                      Just This Protein Variant
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setReplacementStep({ 
                                      ...replacementStep, 
                                      step: 'stock_options',
                                      outOfStockChoice: 'entire_item'
                                    })}
                                  >
                                    Entire Item
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Stock Options Step */}
                            {replacementStep.step === 'stock_options' && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium">Mark {replacementStep.outOfStockChoice === 'protein' ? 'this protein variant' : `"${item.menu_items?.name}"`} out of stock for:</p>
                                <div className="grid grid-cols-1 gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                       const variantName = replacementStep.outOfStockChoice === 'protein' ? 
                                         getCurrentVariantName(item.menu_items?.name || '', item.unit_price_cents, item.custom_name) : 
                                         undefined;
                                      markItemOutOfStock(item.menu_item_id, 'out_today', undefined, variantName);
                                    }}
                                  >
                                    Until Midnight Today
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                       const variantName = replacementStep.outOfStockChoice === 'protein' ? 
                                         getCurrentVariantName(item.menu_items?.name || '', item.unit_price_cents, item.custom_name) : 
                                         undefined;
                                      markItemOutOfStock(item.menu_item_id, 'out_indefinite', undefined, variantName);
                                    }}
                                  >
                                    Indefinitely
                                  </Button>
                                  <Input
                                    type="datetime-local"
                                    placeholder="Select date and time"
                                    className="text-sm"
                                    min={new Date().toISOString().slice(0, 16)}
                                    onChange={(e) => {
                                      if (e.target.value) {
                                         const variantName = replacementStep.outOfStockChoice === 'protein' ? 
                                           getCurrentVariantName(item.menu_items?.name || '', item.unit_price_cents, item.custom_name) : 
                                           undefined;
                                        markItemOutOfStock(item.menu_item_id, 'out_until', e.target.value, variantName);
                                      }
                                    }}
                                  />
                                </div>
                              </div>
                            )}

                            {/* Action Choice Step */}
                            {replacementStep.step === 'action_choice' && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium">What would you like to do?</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setReplacementStep({ ...replacementStep, step: 'replacement_type' })}
                                  >
                                    Replace Item
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => cancelOrderItem(item.id)}
                                  >
                                    Cancel Item
                                  </Button>
                                </div>
                              </div>
                            )}

                            {/* Replacement Type Step */}
                            {replacementStep.step === 'replacement_type' && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium">What would you like to replace?</p>
                                <div className="grid grid-cols-1 gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setReplacementStep({ 
                                      ...replacementStep, 
                                      step: 'replacement_options',
                                      replacementType: 'item'
                                    })}
                                  >
                                    Replace Entire Item
                                  </Button>
                                  {supportsProteinReplacement(item.menu_items?.name || '') && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setReplacementStep({ 
                                        ...replacementStep, 
                                        step: 'replacement_options',
                                        replacementType: 'protein'
                                      })}
                                    >
                                      Replace Protein Only
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )}

                             {/* Replacement Options Step */}
                            {replacementStep.step === 'replacement_options' && replacementStep.replacementType && (
                              <div className="space-y-3">
                                <p className="text-sm font-medium">
                                  Choose {replacementStep.replacementType === 'item' ? 'replacement item' : 'protein alternative'}:
                                </p>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                  {replacementStep.replacementType === 'item' ? (
                                    // Full item replacements with variant selection
                                    <div className="space-y-2">
                                      {getReplacementItems(item, 'item').map((replacementItem) => (
                                        <ItemReplacementButton
                                          key={replacementItem.id}
                                          item={replacementItem}
                                          currentItem={item}
                                          onSelect={(newItem, variant, quantity) => swapItem(item.id, newItem.id, variant, quantity)}
                                          disabled={swapping === item.id}
                                          formatPrice={formatPrice}
                                        />
                                      ))}
                                    </div>
                                   ) : (
                                      // Protein alternatives from database
                                       <VariantOptions 
                                         menuItemId={item.menu_item_id}
                                         currentVariant={getCurrentVariantName(item.menu_items?.name || '', item.unit_price_cents, item.custom_name)}
                                         onVariantSelect={(variantName, newPriceCents) => swapVariant(item.id, variantName, newPriceCents)}
                                         disabled={swapping === item.id}
                                         formatPrice={formatPrice}
                                         basePriceCents={menuItems.find(mi => mi.id === item.menu_item_id)?.price_cents || item.unit_price_cents}
                                       />
                                   )}
                                </div>
                                {replacementStep.replacementType === 'item' && getReplacementItems(item, 'item').length === 0 && (
                                  <p className="text-sm text-muted-foreground text-center">
                                    No alternative items available
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Special Requests */}
              {order.special_requests && (
                <div>
                  <h3 className="font-semibold mb-3">Special Requests</h3>
                  <Card>
                    <CardContent className="p-4">
                      <p className="text-sm">{order.special_requests}</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Order Summary */}
              <div>
                <Separator className="mb-4" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="font-semibold text-lg">${(order.total_cents / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Order not found</p>
            </div>
          )}
        </ScrollArea>

        <div className="p-6 pt-2 border-t">
          <Button onClick={onClose} className="w-full">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}