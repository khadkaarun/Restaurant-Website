// Updated: 2025-07-29 16:30:17
// Updated: 2025-07-29 16:29:59
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
    id: string;
    name: string;
    price_cents: number;
    category_id: string;
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

interface ItemReplacementSelectorProps {
  currentItem: OrderItem;
  availableItems: MenuItem[];
  onItemSelect: (item: MenuItem, variant?: {variant_name: string, price_modifier_cents: number}, quantity?: number) => void;
  disabled: boolean;
  formatPrice: (priceCents: number) => string;
}

export default function ItemReplacementSelector({ 
  currentItem, 
  availableItems, 
  onItemSelect, 
  disabled, 
  formatPrice 
}: ItemReplacementSelectorProps) {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<{variant_name: string, price_modifier_cents: number} | undefined>();
  const [quantity, setQuantity] = useState(currentItem.quantity);
  const [availableVariants, setAvailableVariants] = useState<MenuItemVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);

  // Fetch variants when item is selected
  useEffect(() => {
    if (selectedItemId) {
      fetchVariants(selectedItemId);
    } else {
      setAvailableVariants([]);
      setSelectedVariant(undefined);
    }
  }, [selectedItemId]);

  const fetchVariants = async (menuItemId: string) => {
    setLoadingVariants(true);
    try {
      const { data: variants, error } = await supabase
        .from('menu_item_variants')
        .select('*')
        .eq('menu_item_id', menuItemId)
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

  const handleItemSelect = () => {
    const selectedItem = availableItems.find(item => item.id === selectedItemId);
    if (!selectedItem) return;

    onItemSelect(selectedItem, selectedVariant, quantity);
  };

  const getTotalPrice = () => {
    const selectedItem = availableItems.find(item => item.id === selectedItemId);
    if (!selectedItem) return 0;

    let basePrice = selectedItem.price_cents;
    if (selectedVariant) {
      basePrice += selectedVariant.price_modifier_cents;
    }
    return basePrice * quantity;
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-background">
      <div className="space-y-2">
        <Label>Select replacement item:</Label>
        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
          <SelectTrigger>
            <SelectValue placeholder="Choose an item..." />
          </SelectTrigger>
          <SelectContent>
            {availableItems.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                <div className="flex justify-between items-center w-full">
                  <span>{item.name}</span>
                  <span className="ml-2 text-muted-foreground">{formatPrice(item.price_cents)}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedItemId && availableVariants.length > 0 && (
        <div className="space-y-2">
          <Label>Select variant:</Label>
          {loadingVariants ? (
            <div className="text-sm text-muted-foreground">Loading variants...</div>
          ) : (
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
                      <span>{variant.variant_name}</span>
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
          )}
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

      {selectedItemId && (
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
      )}

      <Button 
        onClick={handleItemSelect}
        disabled={disabled || !selectedItemId || (availableVariants.length > 0 && !selectedVariant)}
        className="w-full"
      >
        {disabled ? 'Processing...' : 'Confirm Replacement'}
      </Button>
    </div>
  );
}