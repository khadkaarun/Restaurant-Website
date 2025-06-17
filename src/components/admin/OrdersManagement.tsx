// Updated: 2025-07-29 16:30:12
// Updated: 2025-07-29 16:30:06
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Phone, Mail, X } from 'lucide-react';
import { CancelOrderDialog } from './CancelOrderDialog';
import OrderDetailsModal from '@/components/OrderDetailsModal';

type OrderStatus = 'confirmed' | 'ready_for_pickup' | 'cancelled';

interface Order {
  id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  status: OrderStatus;
  total_cents: number;
  created_at: string;
  notification_preference: string;
  special_requests?: string;
  stripe_payment_id?: string;
  order_items?: {
    id: string;
    quantity: number;
    unit_price_cents: number;
    special_instructions?: string;
    custom_name?: string;
    menu_items?: {
      name: string;
    };
  }[];
}

export function OrdersManagement() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState<Order | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

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
            custom_name,
            menu_items (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Filter to only show orders with our allowed statuses
      const filteredOrders = (data || []).filter(order => 
        ['confirmed', 'ready_for_pickup', 'cancelled'].includes(order.status)
      );
      setOrders(filteredOrders as Order[]);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (newStatus === 'cancelled') {
      const order = orders.find(o => o.id === orderId);
      if (order) {
        setOrderToCancel(order);
        setCancelDialogOpen(true);
      }
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus as OrderStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Send status update email only for confirmed and ready_for_pickup status
      if (newStatus === 'confirmed' || newStatus === 'ready_for_pickup') {
        try {
          const { data: orderWithItems } = await supabase
            .from('orders')
            .select(`
              *,
                order_items (
                  id,
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

          if (orderWithItems) {
            await supabase.functions.invoke('send-order-email', {
              body: {
                type: 'status_update',
                order: orderWithItems
              }
            });
          }
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
          // Don't block the status update if email fails
        }
      }

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      fetchOrders();
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'ready_for_pickup':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = statusFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === statusFilter);

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold">Orders Management</h2>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg">Orders ({filteredOrders.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          {/* Mobile Card Layout */}
          <div className="block sm:hidden">
            {filteredOrders.map((order) => (
              <div key={order.id} className="border-b border-border p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-mono text-sm font-medium">#{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-muted-foreground">{order.customer_name || 'Anonymous'}</p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} text-xs`}>
                    {order.status.replace('_', ' ')}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">${(order.total_cents / 100).toFixed(2)}</span>
                  <span className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex items-center gap-2">
                  {order.customer_email && <Mail className="h-4 w-4 text-muted-foreground" />}
                  {order.customer_phone && <Phone className="h-4 w-4 text-muted-foreground" />}
                  <span className="text-xs text-muted-foreground">{order.notification_preference}</span>
                </div>

                <div className="flex gap-2">
                  <Select
                    value={order.status}
                    onValueChange={(value) => updateOrderStatus(order.id, value)}
                  >
                    <SelectTrigger className="flex-1 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3"
                    onClick={() => {
                      setSelectedOrderId(order.id);
                      setShowOrderDetails(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  
                  {order.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-3 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => {
                        setOrderToCancel(order);
                        setCancelDialogOpen(true);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      {order.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      {order.customer_name || 'Anonymous'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.customer_email && (
                          <Mail className="h-4 w-4 text-muted-foreground" />
                        )}
                        {order.customer_phone && (
                          <Phone className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm text-muted-foreground">
                          {order.notification_preference}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      ${(order.total_cents / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue>
                            <Badge className={getStatusColor(order.status)}>
                              {order.status}
                            </Badge>
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="ready_for_pickup">Ready for Pickup</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedOrderId(order.id);
                            setShowOrderDetails(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        
                        {order.status !== 'cancelled' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setOrderToCancel(order);
                              setCancelDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredOrders.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No orders found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal with Swap Functionality */}
      <OrderDetailsModal
        orderId={selectedOrderId}
        isOpen={showOrderDetails}
        onClose={() => {
          setShowOrderDetails(false);
          setSelectedOrderId(null);
        }}
        onOrderUpdate={fetchOrders}
      />

      {orderToCancel && (
        <CancelOrderDialog
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
          order={orderToCancel}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
}
