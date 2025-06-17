// Updated: 2025-07-29 16:30:07
// Updated: 2025-07-29 16:30:05
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';

type StockStatus = 'in_stock' | 'out_today' | 'out_indefinite' | 'out_until';

interface MenuItem {
  id: string;
  name: string;
  category_id: string;
  stock_status: StockStatus;
  out_until?: string;
  stock_notes?: string;
  menu_categories?: {
    name: string;
  };
  menu_item_variants?: MenuItemVariant[];
}

interface MenuItemVariant {
  id: string;
  variant_type: string;
  variant_name: string;
  stock_status: StockStatus;
  out_until?: string;
}

export function StockManagement() {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsResult, categoriesResult] = await Promise.all([
        supabase
          .from('menu_items')
          .select(`
            id,
            name,
            category_id,
            stock_status,
            out_until,
            stock_notes,
            menu_categories (
              name
            ),
            menu_item_variants (
              id,
              variant_type,
              variant_name,
              stock_status,
              out_until
            )
          `)
          .order('name'),
        supabase
          .from('menu_categories')
          .select('id, name')
          .order('sort_order')
      ]);

      if (itemsResult.error) throw itemsResult.error;
      if (categoriesResult.error) throw categoriesResult.error;

      setMenuItems((itemsResult.data || []) as MenuItem[]);
      setCategories(categoriesResult.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateStockStatus = async (itemId: string, status: StockStatus, until?: string) => {
    try {
      console.log('Attempting to update stock status:', { itemId, status, until });
      
      const updateData: any = { stock_status: status };
      
      if (status === 'out_until' && until) {
        updateData.out_until = until;
      } else {
        updateData.out_until = null;
      }

      console.log('Update data:', updateData);

      const { error, data } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', itemId)
        .select();

      console.log('Supabase response:', { error, data });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Stock status updated successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error updating stock status:', error);
      toast({
        title: "Error",
        description: "Failed to update stock status",
        variant: "destructive",
      });
    }
  };

  const updateVariantStockStatus = async (variantId: string, status: StockStatus, until?: string) => {
    try {
      const updateData: any = { stock_status: status };
      
      if (status === 'out_until' && until) {
        updateData.out_until = until;
      } else {
        updateData.out_until = null;
      }

      const { error } = await supabase
        .from('menu_item_variants')
        .update(updateData)
        .eq('id', variantId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Variant stock status updated successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error updating variant stock status:', error);
      toast({
        title: "Error",
        description: "Failed to update variant stock status",
        variant: "destructive",
      });
    }
  };

  const toggleItemExpansion = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusColor = (status: StockStatus) => {
    switch (status) {
      case 'in_stock':
        return 'bg-green-100 text-green-800';
      case 'out_today':
        return 'bg-yellow-100 text-yellow-800';
      case 'out_indefinite':
        return 'bg-red-100 text-red-800';
      case 'out_until':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (item: MenuItem) => {
    switch (item.stock_status) {
      case 'in_stock':
        return 'In Stock';
      case 'out_today':
        return 'Out Today';
      case 'out_indefinite':
        return 'Out Indefinitely';
      case 'out_until':
        return `Out Until ${item.out_until ? new Date(item.out_until).toLocaleDateString() : ''}`;
      default:
        return 'Unknown';
    }
  };

  const filteredItems = selectedCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category_id === selectedCategory);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading menu items...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Stock Management</h2>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={fetchData} variant="outline">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredItems.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 flex items-center gap-2">
                  {item.menu_item_variants && item.menu_item_variants.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleItemExpansion(item.id)}
                      className="p-1 h-auto"
                    >
                      {expandedItems.has(item.id) ? 
                        <ChevronDown className="h-4 w-4" /> : 
                        <ChevronRight className="h-4 w-4" />
                      }
                    </Button>
                  )}
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.menu_categories?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge className={getStatusColor(item.stock_status)}>
                    {getStatusLabel(item)}
                  </Badge>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={item.stock_status === 'in_stock' ? 'default' : 'outline'}
                      onClick={() => updateStockStatus(item.id, 'in_stock')}
                    >
                      In Stock
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={item.stock_status === 'out_today' ? 'default' : 'outline'}
                      onClick={() => updateStockStatus(item.id, 'out_today')}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Out Today
                    </Button>
                    
                    <Button
                      size="sm"
                      variant={item.stock_status === 'out_indefinite' ? 'default' : 'outline'}
                      onClick={() => updateStockStatus(item.id, 'out_indefinite')}
                    >
                      Out Indefinitely
                    </Button>
                  </div>
                </div>
              </div>

              {item.stock_status === 'out_until' && (
                <div className="mt-3 flex gap-2">
                  <Input
                    type="datetime-local"
                    placeholder="Select date and time"
                    onChange={(e) => {
                      if (e.target.value) {
                        updateStockStatus(item.id, 'out_until', e.target.value);
                      }
                    }}
                    className="max-w-xs"
                  />
                </div>
              )}

              {/* Variants Section */}
              {expandedItems.has(item.id) && item.menu_item_variants && item.menu_item_variants.length > 0 && (
                <div className="mt-4 pl-6 border-l-2 border-border">
                  <h4 className="font-medium text-sm mb-3">Variants</h4>
                  <div className="space-y-3">
                    {item.menu_item_variants.map((variant) => (
                      <div key={variant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{variant.variant_name}</p>
                          <p className="text-xs text-muted-foreground">{variant.variant_type}</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(variant.stock_status)}>
                            {variant.stock_status === 'in_stock' ? 'In Stock' :
                             variant.stock_status === 'out_today' ? 'Out Today' :
                             variant.stock_status === 'out_indefinite' ? 'Out Indefinitely' :
                             variant.stock_status === 'out_until' ? `Out Until ${variant.out_until ? new Date(variant.out_until).toLocaleDateString() : ''}` :
                             'Unknown'
                            }
                          </Badge>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant={variant.stock_status === 'in_stock' ? 'default' : 'outline'}
                              onClick={() => updateVariantStockStatus(variant.id, 'in_stock')}
                              className="text-xs px-2 py-1 h-auto"
                            >
                              In Stock
                            </Button>
                            
                            <Button
                              size="sm"
                              variant={variant.stock_status === 'out_today' ? 'default' : 'outline'}
                              onClick={() => updateVariantStockStatus(variant.id, 'out_today')}
                              className="text-xs px-2 py-1 h-auto"
                            >
                              Out Today
                            </Button>
                            
                            <Button
                              size="sm"
                              variant={variant.stock_status === 'out_indefinite' ? 'default' : 'outline'}
                              onClick={() => updateVariantStockStatus(variant.id, 'out_indefinite')}
                              className="text-xs px-2 py-1 h-auto"
                            >
                              Out Indefinitely
                            </Button>
                          </div>
                        </div>
                        
                        {variant.stock_status === 'out_until' && (
                          <div className="mt-2 flex gap-2">
                            <Input
                              type="datetime-local"
                              placeholder="Select date and time"
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateVariantStockStatus(variant.id, 'out_until', e.target.value);
                                }
                              }}
                              className="max-w-xs text-xs"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}