// Updated: 2025-07-29 16:30:21
// Updated: 2025-07-29 16:30:20
// Updated: 2025-07-29 16:30:15
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { LogOut, Package, Clock, CheckCircle, XCircle, Bell, BellOff, Warehouse, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import OrderDetailsModal from '@/components/OrderDetailsModal';

type OrderStatus = 'confirmed' | 'ready_for_pickup' | 'cancelled' | 'pending' | 'in_progress' | 'completed';

type StockStatus = 'in_stock' | 'out_of_stock' | 'out_today' | 'low_stock' | 'out_until_further_notice' | 'seasonal_unavailable';

interface MenuItem {
  id: string;
  name: string;
  category_id: string;
  stock_status: StockStatus;
  stock_notes?: string;
  out_until?: string;
  menu_categories?: {
    name: string;
  };
  menu_item_variants: MenuItemVariant[];
}

interface MenuItemVariant {
  id: string;
  variant_type: string;
  variant_name: string;
  stock_status: StockStatus;
  out_until?: string;
}

interface Order {
  id: string;
  status: OrderStatus;
  total_cents?: number;
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  created_at: string;
  special_requests?: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price_cents: number;
    special_instructions?: string;
    menu_items: {
      name: string;
    } | null;
  }>;
}

export default function MobileApp() {
  const { user, signOut } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [cancelOrderId, setCancelOrderId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const audioRef = useRef<{ play: () => Promise<void>; pause: () => void; currentTime: number } | null>(null);

  // Initialize notification sound with looping capability
  const [isPlayingSound, setIsPlayingSound] = useState(false);
  const soundIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Create a simple notification sound using Web Audio API
    const createNotificationSound = async () => {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(1.0, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch (error) {
        console.error('Audio context error:', error);
      }
    };
    
    audioRef.current = { play: createNotificationSound, pause: () => {}, currentTime: 0 };
  }, []);

  // Play notification sound with looping
  const playNotificationSound = () => {
    if (soundEnabled && audioRef.current) {
      // Always stop any existing sound first
      stopNotificationSound();
      
      setIsPlayingSound(true);
      // Play immediately
      audioRef.current.play();
      
      // Continue playing every 2 seconds until dismissed
      soundIntervalRef.current = setInterval(() => {
        if (audioRef.current) {
          audioRef.current.play();
        }
      }, 2000);
    }
  };

  // Stop notification sound
  const stopNotificationSound = () => {
    if (soundIntervalRef.current) {
      clearInterval(soundIntervalRef.current);
      soundIntervalRef.current = null;
    }
    setIsPlayingSound(false);
  };

  const [currentView, setCurrentView] = useState<'active' | 'history' | 'stock'>('active');
  const [filterStatus, setFilterStatus] = useState<'all' | OrderStatus>('all');
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  
  // Stock management state
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price_cents,
            special_instructions,
            menu_items (name)
          )
        `)
        .in('status', ['confirmed', 'ready_for_pickup'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price_cents,
            special_instructions,
            menu_items (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAllOrders(data || []);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch order history",
        variant: "destructive",
      });
    }
  };

  // Real-time order updates
  useEffect(() => {
    if (!user) return;

    fetchOrders();
    fetchAllOrders();
    fetchStockData();

    const channel = supabase
      .channel('orders-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const newOrder = payload.new as Order;
          if (newOrder.status === 'confirmed') {
            // If there's already an alert showing, dismiss it first
            if (newOrderAlert) {
              stopNotificationSound();
            }
            setNewOrderAlert(newOrder);
            playNotificationSound();
            fetchOrders(); // Refresh orders
            fetchAllOrders(); // Refresh history
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders(); // Refresh orders on updates
          fetchAllOrders(); // Refresh history
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, soundEnabled]);

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // First get the full order details
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price_cents,
            special_instructions,
            menu_items (
              name,
              description
            )
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;

      // Update the order status
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Send notification with full order data
      const emailType = newStatus === 'cancelled' ? 'cancellation' : 'status_update';
      await supabase.functions.invoke('send-order-email', {
        body: { 
          type: emailType,
          order: {
            ...orderData,
            status: newStatus
          }
        }
      });

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus.replace('_', ' ')}`,
      });

      fetchOrders();
      fetchAllOrders();
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateOrderStatus(orderId, 'cancelled');
      setCancelOrderId(null);
    } catch (error) {
      console.error('Error cancelling order:', error);
    }
  };

  const dismissNewOrderAlert = () => {
    stopNotificationSound();
    setNewOrderAlert(null);
  };

  // Stock management functions
  const fetchStockData = async () => {
    try {
      setStockLoading(true);
      const [itemsResponse, categoriesResponse] = await Promise.all([
        supabase
          .from('menu_items')
          .select(`
            *,
            menu_categories (name),
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
          .order('name')
      ]);

      if (itemsResponse.error) throw itemsResponse.error;
      if (categoriesResponse.error) throw categoriesResponse.error;

      setMenuItems((itemsResponse.data as MenuItem[]) || []);
      setCategories(categoriesResponse.data || []);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch stock data",
        variant: "destructive",
      });
    } finally {
      setStockLoading(false);
    }
  };

  const updateStockStatus = async (itemId: string, status: StockStatus, until?: string) => {
    try {
      const updateData: any = { stock_status: status };
      if (until && (status === 'out_today' || status === 'out_until_further_notice')) {
        updateData.out_until = until;
      } else {
        updateData.out_until = null;
      }

      const { error } = await supabase
        .from('menu_items')
        .update(updateData)
        .eq('id', itemId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Stock status updated successfully",
      });

      fetchStockData();
    } catch (error) {
      console.error('Error updating stock:', error);
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
      if (until && (status === 'out_today' || status === 'out_until_further_notice')) {
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

      fetchStockData();
    } catch (error) {
      console.error('Error updating variant stock:', error);
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

  const getStockStatusColor = (status: StockStatus) => {
    switch (status) {
      case 'in_stock': return 'bg-green-100 text-green-800 border-green-200';
      case 'low_stock': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'out_of_stock': return 'bg-red-100 text-red-800 border-red-200';
      case 'out_today': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'out_until_further_notice': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'seasonal_unavailable': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStockStatusLabel = (item: MenuItem) => {
    if (item.out_until) {
      const date = new Date(item.out_until);
      const now = new Date();
      if (date > now) {
        return `${item.stock_status.replace('_', ' ')} until ${date.toLocaleDateString()}`;
      }
    }
    return item.stock_status.replace('_', ' ');
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed': return 'bg-yellow-500';
      case 'ready_for_pickup': return 'bg-green-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed': return <Clock className="h-4 w-4" />;
      case 'ready_for_pickup': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Staff Login Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Please sign in to access order management.</p>
            <Button onClick={() => window.location.href = '/auth'} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
        <div className="p-3 sm:p-4 flex items-center justify-between">
          <h1 className="text-lg sm:text-xl font-bold">Order Management</h1>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="text-primary-foreground hover:bg-primary/80"
            >
              {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="text-primary-foreground hover:bg-primary/80"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="px-3 sm:px-4 pb-3 sm:pb-4">
          <div className="flex bg-black/20 rounded-lg p-1">
            <Button
              variant={currentView === 'active' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('active')}
              className={`flex-1 text-xs ${currentView === 'active' ? 'bg-white text-primary shadow-sm' : 'text-primary-foreground hover:bg-white/10'}`}
            >
              Active Orders
            </Button>
            <Button
              variant={currentView === 'history' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('history')}
              className={`flex-1 text-xs ${currentView === 'history' ? 'bg-white text-primary shadow-sm' : 'text-primary-foreground hover:bg-white/10'}`}
            >
              History
            </Button>
            <Button
              variant={currentView === 'stock' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentView('stock')}
              className={`flex-1 text-xs ${currentView === 'stock' ? 'bg-white text-primary shadow-sm' : 'text-primary-foreground hover:bg-white/10'}`}
            >
              <Warehouse className="h-3 w-3 mr-1" />
              Stock
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 bg-gray-50 min-h-screen">
        {currentView === 'active' ? (
          // Active Orders View
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Active Orders</h2>
              <div className="bg-primary/10 px-3 py-1 rounded-full">
                <span className="text-primary font-medium text-sm">{orders.length} active</span>
              </div>
            </div>
            
            {orders.length === 0 ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">No active orders</h3>
                  <p className="text-gray-500 text-sm">New orders will appear here when they come in</p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white" onClick={() => {
                  setSelectedOrderId(order.id);
                  setShowOrderDetails(true);
                }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">#{order.id.slice(-8)}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <Badge className={`${getStatusColor(order.status)} text-white flex items-center gap-1 px-3 py-1`}>
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{order.customer_name}</p>
                        <p className="font-semibold text-lg text-primary">${((order.total_cents || 0) / 100).toFixed(2)}</p>
                      </div>
                      <p className="text-gray-600 text-sm">{order.customer_phone}</p>
                      <div className="text-xs text-gray-500">
                        {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {order.status === 'confirmed' && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateOrderStatus(order.id, 'ready_for_pickup');
                          }}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-xs sm:text-sm py-2 sm:py-3"
                        >
                          Mark Ready
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowCancelConfirm(true);
                          setCancelOrderId(order.id);
                        }}
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 text-xs sm:text-sm py-2 sm:py-3"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        ) : currentView === 'history' ? (
          // Order History View
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Order History</h2>
              <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as typeof filterStatus)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {(() => {
              const filteredOrders = filterStatus === 'all' 
                ? allOrders 
                : allOrders.filter(order => order.status === filterStatus);
              
              return filteredOrders.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8 text-center">
                    <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Package className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">No orders found</h3>
                    <p className="text-gray-500 text-sm">No orders match the selected filter</p>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => (
                  <Card key={order.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer bg-white" onClick={() => {
                    setSelectedOrderId(order.id);
                    setShowOrderDetails(true);
                  }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">#{order.id.slice(-8)}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(order.created_at).toLocaleDateString()} {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <Badge className={`${getStatusColor(order.status)} text-white flex items-center gap-1 px-3 py-1`}>
                          {getStatusIcon(order.status)}
                          {order.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-gray-900">{order.customer_name}</p>
                          <p className="font-semibold text-lg text-primary">${((order.total_cents || 0) / 100).toFixed(2)}</p>
                        </div>
                        <p className="text-gray-600 text-sm">{order.customer_phone}</p>
                        <div className="text-xs text-gray-500">
                          {order.order_items.length} item{order.order_items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              );
            })()}
          </div>
        ) : (
          // Stock Management View
          <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Stock Management</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStockData}
                disabled={stockLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${stockLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by category" />
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

            {/* Stock Items */}
            {stockLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-500">Loading stock data...</p>
              </div>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const filteredItems = selectedCategory === 'all' 
                    ? menuItems 
                    : menuItems.filter(item => item.category_id === selectedCategory);

                  return filteredItems.length === 0 ? (
                    <Card className="border-0 shadow-sm">
                      <CardContent className="p-8 text-center">
                        <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                          <Warehouse className="h-8 w-8 text-gray-400" />
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">No items found</h3>
                        <p className="text-gray-500 text-sm">No menu items match the selected filter</p>
                      </CardContent>
                    </Card>
                  ) : (
                    filteredItems.map((item) => (
                      <Card key={item.id} className="border-0 shadow-sm bg-white">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-900 text-sm">{item.name}</h3>
                                {item.menu_item_variants.length > 0 && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleItemExpansion(item.id)}
                                    className="p-1 h-6 w-6"
                                  >
                                    {expandedItems.has(item.id) ? 
                                      <ChevronDown className="h-3 w-3" /> : 
                                      <ChevronRight className="h-3 w-3" />
                                    }
                                  </Button>
                                )}
                              </div>
                              <p className="text-xs text-gray-500">{item.menu_categories?.name}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={`text-xs px-2 py-1 ${getStockStatusColor(item.stock_status)}`}>
                                {getStockStatusLabel(item)}
                              </Badge>
                              <Select 
                                value={item.stock_status} 
                                onValueChange={(value: StockStatus) => updateStockStatus(item.id, value)}
                              >
                                <SelectTrigger className="w-32 h-8 text-xs">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="in_stock">In Stock</SelectItem>
                                  <SelectItem value="low_stock">Low Stock</SelectItem>
                                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                  <SelectItem value="out_today">Out Today</SelectItem>
                                  <SelectItem value="out_until_further_notice">Out Until Notice</SelectItem>
                                  <SelectItem value="seasonal_unavailable">Seasonal Unavailable</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {/* Variants */}
                          {expandedItems.has(item.id) && item.menu_item_variants.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                              <p className="text-xs font-medium text-gray-700 mb-2">Variants:</p>
                              {item.menu_item_variants.map((variant) => (
                                <div key={variant.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gray-800">{variant.variant_name}</p>
                                    <p className="text-xs text-gray-500">{variant.variant_type}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1">
                                    <Badge className={`text-xs px-2 py-1 ${getStockStatusColor(variant.stock_status)}`}>
                                      {variant.stock_status.replace('_', ' ')}
                                    </Badge>
                                    <Select 
                                      value={variant.stock_status} 
                                      onValueChange={(value: StockStatus) => updateVariantStockStatus(variant.id, value)}
                                    >
                                      <SelectTrigger className="w-28 h-7 text-xs">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="in_stock">In Stock</SelectItem>
                                        <SelectItem value="low_stock">Low Stock</SelectItem>
                                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                                        <SelectItem value="out_today">Out Today</SelectItem>
                                        <SelectItem value="out_until_further_notice">Out Until Notice</SelectItem>
                                        <SelectItem value="seasonal_unavailable">Seasonal Unavailable</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  );
                })()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Order Details Modal with Swap Functionality */}
      <OrderDetailsModal
        orderId={selectedOrderId}
        isOpen={showOrderDetails}
        onClose={() => {
          setShowOrderDetails(false);
          setSelectedOrderId(null);
        }}
        onOrderUpdate={() => {
          fetchOrders();
          fetchAllOrders();
        }}
      />

      {/* First Cancel Confirmation */}
      <AlertDialog open={showCancelConfirm} onOpenChange={() => setShowCancelConfirm(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Cancel Order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will start the cancellation process. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowCancelConfirm(false)}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowCancelConfirm(false);
                // Small delay to show the transition
                setTimeout(() => {
                  // The cancelOrderId is already set, just open the final confirmation
                }, 100);
              }}
              className="bg-orange-500 text-white hover:bg-orange-600"
            >
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Final Cancel Order Confirmation */}
      <AlertDialog open={!!cancelOrderId && !showCancelConfirm} onOpenChange={() => setCancelOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>🚨 FINAL CONFIRMATION</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="text-red-600 font-semibold">This will permanently cancel the order and cannot be undone.</span>
              <br /><br />
              Are you absolutely certain you want to cancel this order?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => cancelOrderId && handleCancelOrder(cancelOrderId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              YES, Cancel Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* New Order Alert */}
      <AlertDialog open={!!newOrderAlert} onOpenChange={dismissNewOrderAlert}>
        <AlertDialogContent className="max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-center text-xl">🔔 New Order!</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              A new order has been received from <strong>{newOrderAlert?.customer_name}</strong>
              <br />
              Order total: <strong>${((newOrderAlert?.total_cents || 0) / 100).toFixed(2)}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={dismissNewOrderAlert} className="w-full">
              View Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}