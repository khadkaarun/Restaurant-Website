// Updated: 2025-07-29 16:30:08
// Updated: 2025-07-29 16:29:59
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

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

interface MenuItem {
  id: string;
  name: string;
  price_cents: number;
  category_id: string;
  stock_status: string;
}

interface MenuItemVariant {
  id: string;
  variant_name: string;
  price_modifier_cents: number;
  stock_status: string;
}

interface ItemReplacementButtonProps {
  item: MenuItem;
  currentItem: OrderItem;
  onSelect: (item: MenuItem, variant?: {variant_name: string, price_modifier_cents: number}, quantity?: number) => void;
  disabled: boolean;
  formatPrice: (priceCents: number) => string;
}

export default function ItemReplacementButton({ 
  item, 
  currentItem,
  onSelect, 
  disabled, 
  formatPrice 
}: ItemReplacementButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<{variant_name: string, price_modifier_cents: number} | undefined>();
  const [quantity, setQuantity] = useState(currentItem.quantity);
  const [availableVariants, setAvailableVariants] = useState<MenuItemVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Fetch variants when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchVariants();
    }
  }, [isOpen]);

  const fetchVariants = async () => {
    setLoadingVariants(true);
    try {
      const { data: variants, error } = await supabase
        .from('menu_item_variants')
        .select('*')
        .eq('menu_item_id', item.id)
        .eq('stock_status', 'in_stock')
        .order('sort_order');

      if (error) throw error;
      setAvailableVariants(variants || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
      setAvailableVariants([]);
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleConfirm = () => {
    onSelect(item, selectedVariant, quantity);
    setIsOpen(false);
  };

  const getTotalPrice = () => {
    let basePrice = item.price_cents;
    if (selectedVariant) {
      basePrice += selectedVariant.price_modifier_cents;
    }
    return basePrice * quantity;
  };

  const hasVariants = availableVariants.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="w-full justify-between"
          disabled={disabled}
        >
          <span>{item.name}</span>
          <span>{formatPrice(item.price_cents)}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Replacement: {item.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loadingVariants ? (
            <div className="text-sm text-muted-foreground">Loading options...</div>
          ) : hasVariants ? (
            <div className="space-y-2">
              <Label>Select variant:</Label>
              <Select 
                value={selectedVariant?.variant_name || ''} 
                onValueChange={(value) => {
                  const variant = availableVariants.find(v => v.variant_name === value);
                  setSelectedVariant(variant ? {
                    variant_name: variant.variant_name,
                    price_modifier_cents: variant.price_modifier_cents
                  } : undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose variant..." />
                </SelectTrigger>
                <SelectContent>
                  {availableVariants.map((variant) => (
                    <SelectItem key={variant.id} value={variant.variant_name}>
                      <div className="flex justify-between items-center w-full">
                        <span className="capitalize">{variant.variant_name.replace('_', ' ')}</span>
                        <span className="ml-2 text-muted-foreground">
                          {variant.price_modifier_cents === 0 ? '' : 
                           variant.price_modifier_cents > 0 ? 
                           `+${formatPrice(variant.price_modifier_cents)}` : 
                           formatPrice(variant.price_modifier_cents)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No variants available for this item.
            </div>
          )}

          <div className="space-y-2">
            <Label>Quantity:</Label>
            <Input
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="w-20"
            />
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Original total:</span>
                <span>{formatPrice(currentItem.unit_price_cents * currentItem.quantity)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>New total:</span>
                <span>{formatPrice(getTotalPrice())}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span>Difference:</span>
                <span className={getTotalPrice() - (currentItem.unit_price_cents * currentItem.quantity) >= 0 ? 'text-red-600' : 'text-green-600'}>
                  {getTotalPrice() - (currentItem.unit_price_cents * currentItem.quantity) >= 0 ? '+' : ''}
                  {formatPrice(getTotalPrice() - (currentItem.unit_price_cents * currentItem.quantity))}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => setIsOpen(false)} variant="outline" className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={disabled || (hasVariants && !selectedVariant)}
              className="flex-1"
            >
              {disabled ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}