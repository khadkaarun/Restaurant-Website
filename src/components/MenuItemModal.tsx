// Updated: 2025-07-29 16:30:22
// Updated: 2025-07-29 16:30:19
// Updated: 2025-07-29 16:30:18
import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Plus, Minus, Flame, Leaf, Star } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  image_url?: string;
  category: {
    name: string;
  };
}

interface ToppingItem {
  id: string;
  name: string;
  price_cents: number;
}

interface MenuItemModalProps {
  item: MenuItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const MenuItemModal = ({ item, isOpen, onClose }: MenuItemModalProps) => {
  const [toppings, setToppings] = useState<ToppingItem[]>([]);
  const [selectedToppings, setSelectedToppings] = useState<Record<string, number>>({});
  const [proteinChoice, setProteinChoice] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [userInteractedWithTextarea, setUserInteractedWithTextarea] = useState(false);
  const [availableVariants, setAvailableVariants] = useState<{variant_name: string, price_modifier_cents: number}[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { addItem } = useCart();

  // Get protein options based on item name
  const getProteinOptions = () => {
    if (!item) return [];
    
    const itemName = item.name.toLowerCase();
    
    // Katsu Sando: katsu chicken or katsu pork (shared across katsu dishes)
    if (itemName.includes('katsu sando')) {
      return [
        { id: 'katsu-chicken', name: 'Chicken', price: 0, isDefault: true },
        { id: 'katsu-pork', name: 'Pork', price: 0 }
      ];
    }
    
    // Onigiri: chicken karaage, salmon, tuna (all separate from other dishes)
    if (itemName.includes('onigiri')) {
      return [
        { id: 'onigiri-karaage', name: 'Chicken Karaage', price: 0, isDefault: true },
        { id: 'onigiri-salmon', name: 'Salmon', price: 0 },
        { id: 'onigiri-tuna', name: 'Tuna', price: 0 }
      ];
    }
    
    // Shrimp Shumai and Gyoza: fried or steamed
    if (itemName.includes('shumai') || itemName.includes('gyoza')) {
      return [
        { id: 'steamed', name: 'Steamed', price: 0, isDefault: true },
        { id: 'fried', name: 'Fried', price: 0 }
      ];
    }
    
    // Combined Teriyaki items: chicken $10 (base), salmon $12, tofu $9 (separate from other proteins)
    if (itemName.includes('chicken teriyaki') || itemName.includes('salmon teriyaki') || itemName.includes('tofu teriyaki') || itemName === 'teriyaki') {
      return [
        { id: 'teriyaki-chicken', name: 'Chicken', price: 0, isDefault: itemName.includes('chicken') || itemName === 'teriyaki' },
        { id: 'teriyaki-salmon', name: 'Salmon', price: 200, isDefault: itemName.includes('salmon') },
        { id: 'teriyaki-tofu', name: 'Tofu', price: -100, isDefault: itemName.includes('tofu') }
      ];
    }
    
    // Combined Japanese Katsu Curry: katsu chicken or katsu pork (shared across katsu dishes)
    if (itemName.includes('japanese katsu curry')) {
      return [
        { id: 'katsu-chicken', name: 'Chicken', price: 0, isDefault: itemName.includes('chicken') },
        { id: 'katsu-pork', name: 'Pork', price: 0, isDefault: itemName.includes('pork') }
      ];
    }
    
    // Combined Katsu Don: don chicken or don pork (unique variants)
    if (itemName.includes('katsu don')) {
      return [
        { id: 'don-chicken', name: 'Chicken', price: 0, isDefault: itemName.includes('chicken') },
        { id: 'don-pork', name: 'Pork', price: 0, isDefault: itemName.includes('pork') }
      ];
    }
    
    // Combined Pho: chicken or beef (boiled chicken/beef shared with udon)
    if (itemName.includes('pho')) {
      return [
        { id: 'boiled-chicken', name: 'Chicken', price: 0, isDefault: itemName.includes('chicken') },
        { id: 'boiled-beef', name: 'Beef', price: 0, isDefault: itemName.includes('beef') }
      ];
    }
    
    // Combined Curry Udon: katsu chicken or katsu pork (shared across katsu dishes)
    if (itemName.includes('curry udon')) {
      return [
        { id: 'katsu-chicken', name: 'Chicken', price: 0, isDefault: itemName.includes('chicken') },
        { id: 'katsu-pork', name: 'Pork', price: 0, isDefault: itemName.includes('pork') }
      ];
    }
    
    // Combined regular Udon: chicken, beef, shrimp tempura, tofu (boiled chicken/beef shared with pho)
    if (itemName.includes('udon') && !itemName.includes('curry')) {
      return [
        { id: 'boiled-chicken', name: 'Chicken', price: 0, isDefault: itemName.includes('chicken') },
        { id: 'boiled-beef', name: 'Beef', price: 0, isDefault: itemName.includes('beef') },
        { id: 'shrimp-tempura', name: 'Shrimp Tempura', price: 0, isDefault: itemName.includes('shrimp') },
        { id: 'udon-tofu', name: 'Tofu', price: 0, isDefault: itemName.includes('tofu') }
      ];
    }
    
    // Spicy Chicken Karaage Ramen: separate karaage from onigiri
    if (itemName.includes('spicy chicken karaage ramen')) {
      return [
        { id: 'ramen-karaage', name: 'Chicken Karaage', price: 0, isDefault: true }
      ];
    }
    
    // Gyudon has NO options - beef only, if beef out of stock, whole item unavailable
    if (itemName.includes('gyudon')) {
      return [];
    }
    
    // Default: no protein options for other items
    return [];
  };

  const proteinOptions = getProteinOptions();
  const shouldShowToppings = item && (
    item.category?.name.toLowerCase().includes('ramen') ||
    item.category?.name.toLowerCase().includes('rice') ||
    item.category?.name.toLowerCase().includes('soba') ||
    item.category?.name.toLowerCase().includes('udon')
  );

  useEffect(() => {
    const fetchToppings = async () => {
      try {
        // Fetch toppings directly using the known category name
        const { data, error } = await supabase
          .from('menu_items')
          .select(`
            id, 
            name, 
            price_cents,
            stock_status,
            category:menu_categories!inner(name)
          `)
          .eq('category.name', 'Topping & Extra')
          .eq('is_available', true)
          .eq('stock_status', 'in_stock')
          .order('name');

        if (error) {
          console.error('Supabase error fetching toppings:', error);
          return;
        }
        
        console.log('Fetched toppings:', data);
        setToppings(data || []);
      } catch (error) {
        console.error('Error fetching toppings:', error);
        // Set empty toppings array on error to prevent blocking interactions
        setToppings([]);
      }
    };

    const checkVariantAvailability = async () => {
      if (!item) return;
      
      try {
        // Check if any variants exist for this item
        const { data: variants, error } = await supabase
          .from('menu_item_variants')
          .select('*')
          .eq('menu_item_id', item.id);

        if (error) {
          console.error('Error checking variants:', error);
          return;
        }

        // Filter protein options to only show available ones
        if (variants && variants.length > 0) {
          const availableVariantsList = variants.filter(v => v.stock_status === 'in_stock');
          const availableVariantsWithPrices = availableVariantsList.map(v => ({
            variant_name: v.variant_name,
            price_modifier_cents: v.price_modifier_cents
          }));
          setAvailableVariants(availableVariantsWithPrices);
          const availableVariantNames = availableVariantsList.map(v => v.variant_name);
          
          // If current selection is not available, switch to first available
          const currentVariantName = getVariantNameFromOptionId(proteinChoice);
          if (proteinChoice && !availableVariantNames.includes(currentVariantName)) {
            const firstAvailable = proteinOptions.find(p => availableVariantNames.includes(getVariantNameFromOptionId(p.id)));
            if (firstAvailable) {
              setProteinChoice(firstAvailable.id);
            }
          }
        } else {
          // No variants exist, all options are available
          setAvailableVariants([]);
        }
      } catch (error) {
        console.error('Error checking variant availability:', error);
      }
    };

    if (isOpen) {
      fetchToppings();
      checkVariantAvailability();
      
      // Reset state when modal opens
      setSelectedToppings({});
      setProteinChoice(proteinOptions.find(p => p.isDefault)?.id || '');
      setQuantity(1);
      setSpecialInstructions('');
      setUserInteractedWithTextarea(false);
      
      // Force blur any focused inputs when modal opens to prevent keyboard popup
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement && typeof activeElement.blur === 'function') {
          activeElement.blur();
        }
        if (textareaRef.current) {
          textareaRef.current.blur();
        }
      }, 100);
    }
  }, [isOpen, item]); // Depend on item as well to check variants when item changes

  // Helper function to map option ID to variant name
  const getVariantNameFromOptionId = (optionId: string) => {
    const mapping: Record<string, string> = {
      'katsu-chicken': item?.name?.toLowerCase().includes('curry udon') ? 'katsu_chicken' : 'curry_chicken',  // curry udon vs katsu curry
      'katsu-pork': item?.name?.toLowerCase().includes('curry udon') ? 'katsu_pork' : 'curry_pork',          // curry udon vs katsu curry
      'don-chicken': 'don_chicken',  // katsu don unique variants
      'don-pork': 'don_pork',        // katsu don unique variants
      'onigiri-karaage': 'chicken_karaage',
      'onigiri-salmon': 'salmon',
      'onigiri-tuna': 'tuna',
      'steamed': 'steamed',
      'fried': 'fried',
      'teriyaki-chicken': 'chicken',
      'teriyaki-salmon': 'salmon',
      'teriyaki-tofu': 'tofu',
      'boiled-chicken': 'chicken',
      'boiled-beef': 'beef',
      'shrimp-tempura': 'shrimp_tempura',
      'udon-tofu': 'tofu',
      'ramen-karaage': 'chicken_karaage'
    };
    return mapping[optionId] || optionId;
  };

  const formatPrice = (priceCents: number) => {
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const getTotalPrice = () => {
    if (!item) return 0;
    
    let basePrice = item.price_cents;
    
    // Add protein price modification from database variants
    if (proteinChoice && availableVariants.length > 0) {
      const variantName = getVariantNameFromOptionId(proteinChoice);
      const variant = availableVariants.find(v => v.variant_name === variantName);
      if (variant) {
        basePrice += variant.price_modifier_cents;
      }
    }
    
    // Calculate total with quantity
    const itemTotal = basePrice * quantity;
    
    // Add toppings price
    const toppingsPrice = Object.entries(selectedToppings).reduce((total, [toppingId, toppingQuantity]) => {
      const topping = toppings.find(t => t.id === toppingId);
      return total + (topping ? topping.price_cents * toppingQuantity * quantity : 0);
    }, 0);
    
    return itemTotal + toppingsPrice;
  };

  const handleToppingQuantityChange = (toppingId: string, newQuantity: number) => {
    console.log('Topping quantity change:', toppingId, newQuantity);
    setSelectedToppings(prev => {
      if (newQuantity <= 0) {
        const { [toppingId]: removed, ...rest } = prev;
        return rest;
      } else {
        return { ...prev, [toppingId]: newQuantity };
      }
    });
  };

  const handleAddToCart = () => {
    // Manually blur textarea and any focused inputs before proceeding
    if (textareaRef.current) {
      textareaRef.current.blur();
    }
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && typeof activeElement.blur === 'function') {
      activeElement.blur();
    }
    if (!item) return;

    // Create item description with customizations
    let itemDescription = item.name;
    const customizations = [];
    
    const selectedProtein = proteinOptions.find(p => p.id === proteinChoice);
    // Always show protein choice if protein options exist and one is selected
    if (selectedProtein && proteinOptions.length > 0) {
      customizations.push(selectedProtein.name);
    }
    
    if (customizations.length > 0) {
      itemDescription += ` (${customizations.join(', ')})`;
    }

    // Calculate final price per item
    let finalPrice = item.price_cents;
    if (selectedProtein) finalPrice += selectedProtein.price;

    // Add base item to cart with special instructions (which will be included in emails)
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: `${item.id}-${Date.now()}-${i}`,
        menu_item_id: item.id,
        name: itemDescription,
        price_cents: finalPrice,
        special_instructions: specialInstructions || undefined
      });
    }

    // Add selected toppings
    Object.entries(selectedToppings).forEach(([toppingId, toppingQuantity]) => {
      const topping = toppings.find(t => t.id === toppingId);
      if (topping && toppingQuantity > 0) {
        for (let i = 0; i < quantity; i++) {
          for (let j = 0; j < toppingQuantity; j++) {
            addItem({
              id: `${topping.id}-addon-${Date.now()}-${i}-${j}`,
              menu_item_id: topping.id,
              name: `${topping.name} (add-on)`,
              price_cents: topping.price_cents,
              special_instructions: `Add-on for ${item.name}`
            });
          }
        }
      }
    });

    toast({
      title: "Added to cart",
      description: `${itemDescription} ${quantity > 1 ? `(x${quantity})` : ''} has been added to your cart`,
    });

    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        // Blur textarea when modal closes to dismiss keyboard and reset zoom
        if (textareaRef.current) {
          textareaRef.current.blur();
        }
      }
      onClose();
    }}>
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto"
        onClick={(e) => {
          console.log('Dialog content clicked');
          e.stopPropagation();
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{item.name}</DialogTitle>
          <DialogDescription>
            Customize your {item.name} with your preferred options and add it to your cart.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Image */}
          {item.image_url && (
            <div className="h-48 rounded-lg overflow-hidden">
              <img 
                src={item.image_url} 
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Item Details */}
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <Badge variant="outline" className="mb-2">{item.category?.name}</Badge>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-2 text-sm text-muted-foreground">4.8 (120+ reviews)</span>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
              <Badge variant="secondary" className="text-lg font-semibold ml-4">
                {formatPrice(item.price_cents)}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Leaf className="w-3 h-3 text-green-500" />
                <span>Fresh Ingredients</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Flame className="w-3 h-3 text-orange-500" />
                <span>Made to Order</span>
              </div>
              <Badge variant="outline" className="text-xs">Most Popular</Badge>
            </div>
          </div>

          <Separator />

          {/* Protein Choice */}
          {proteinOptions.length > 0 && (
            <>
              <div>
                <h4 className="font-semibold mb-4 flex items-center">
                  Options
                  <Badge variant="secondary" className="ml-2 text-xs">Required</Badge>
                </h4>
                <RadioGroup 
                  value={proteinChoice} 
                  onValueChange={(value) => {
                    console.log('Protein choice changed:', value);
                    setProteinChoice(value);
                  }}
                >
                  {proteinOptions.map((protein) => {
                    const variantName = getVariantNameFromOptionId(protein.id);
                    // Check if this variant is available - if no variants exist, all are available
                    const isAvailable = availableVariants.length === 0 || availableVariants.some(v => v.variant_name === variantName);
                    
                    return (
                      <div key={protein.id} className={`flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 ${!isAvailable ? 'opacity-50' : ''}`}>
                        <RadioGroupItem value={protein.id} id={protein.id} disabled={!isAvailable} />
                        <Label htmlFor={protein.id} className={`flex-1 cursor-pointer flex justify-between items-center ${!isAvailable ? 'cursor-not-allowed' : ''}`}>
                          <span className="text-sm font-medium">
                            {protein.name}
                            {!isAvailable && <span className="text-red-500 ml-2">(Out of Stock)</span>}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {protein.price === 0 ? (
                              protein.isDefault ? 'Included' : 'No charge'
                            ) : protein.price > 0 ? (
                              `+${formatPrice(protein.price)}`
                            ) : (
                              formatPrice(protein.price)
                            )}
                          </span>
                        </Label>
                        {protein.isDefault && (
                          <Badge variant="outline" className="text-xs">Popular</Badge>
                        )}
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
              <Separator />
            </>
          )}

          {/* Modern Toppings & Extras */}
          {shouldShowToppings && toppings.length > 0 && (
            <>
              <div>
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <span>🍜</span>
                  Customize Your Dish
                  <Badge variant="outline" className="text-xs">Optional</Badge>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {toppings.map((topping) => {
                    const currentQuantity = selectedToppings[topping.id] || 0;
                    return (
                      <div key={topping.id} className="p-4 rounded-xl border-2 border-muted hover:border-primary/20 transition-all duration-200 bg-card">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex-1">
                            <h5 className="font-medium text-sm">{topping.name}</h5>
                            <p className="text-xs text-muted-foreground mt-1">
                              {topping.name === 'Bamboo' && 'Adds crunch & flavor'}
                              {topping.name === 'Corn' && 'Sweet & tender'}
                              {topping.name === 'Garlic' && 'Extra savory kick'}
                              {topping.name === 'Mushroom' && 'Earthy & umami'}
                              {topping.name === 'Noodle' && 'Extra portion'}
                              {topping.name === 'Pork Belly' && 'Rich & tender'}
                              {topping.name === 'Pork Chashu' && 'Slow-braised pork'}
                              {topping.name === 'Rice' && 'Extra portion'}
                              {topping.name === 'Soft boiled egg' && 'Creamy & perfect'}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge variant="secondary" className="text-xs font-medium">
                              +{formatPrice(topping.price_cents)}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Minus clicked for:', topping.name, currentQuantity);
                                handleToppingQuantityChange(topping.id, Math.max(0, currentQuantity - 1));
                              }}
                              disabled={currentQuantity <= 0}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-medium text-sm min-w-[1.5rem] text-center">
                              {currentQuantity}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Plus clicked for:', topping.name, currentQuantity);
                                handleToppingQuantityChange(topping.id, currentQuantity + 1);
                              }}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          
                          {currentQuantity > 0 && (
                            <div className="text-xs text-primary font-medium">
                              {formatPrice(topping.price_cents * currentQuantity)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Special Instructions */}
          <div>
            <Label htmlFor="instructions" className="font-semibold">Special Instructions (Optional)</Label>
            <Textarea
              ref={textareaRef}
              id="instructions"
              placeholder="Any special requests or dietary requirements..."
              value={specialInstructions}
              onChange={(e) => {
                console.log('Textarea onChange:', e.target.value);
                setSpecialInstructions(e.target.value);
              }}
              onInput={(e) => {
                console.log('Textarea onInput:', e.currentTarget.value);
              }}
              onClick={(e) => {
                console.log('Textarea clicked');
                e.stopPropagation();
              }}
              className="mt-2 text-base pointer-events-auto" // 16px font-size to prevent iOS zoom
              rows={3}
              autoFocus={false}
              onPointerDown={() => {
                console.log('Textarea pointer down');
                setUserInteractedWithTextarea(true);
              }}
              onFocus={(e) => {
                console.log('Textarea focused');
                // Only allow focus if user explicitly interacted with the textarea
                if (!userInteractedWithTextarea && window.innerWidth <= 768) {
                  e.target.blur();
                }
              }}
            />
          </div>

          {/* Quantity and Add to Cart */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-semibold text-lg min-w-[2rem] text-center">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            <Button 
              onClick={handleAddToCart}
              size="lg"
              className="rounded-full px-8"
              disabled={proteinOptions.length > 0 && !proteinChoice}
            >
              Add {quantity} to Cart • {formatPrice(getTotalPrice())}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MenuItemModal;