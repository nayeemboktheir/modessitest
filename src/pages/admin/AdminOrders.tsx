import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Search, Eye, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getAllOrders, updateOrderStatus } from '@/services/adminService';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  product_name: string;
  product_image: string | null;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  payment_status: string;
  payment_method: string;
  total: number;
  subtotal: number;
  shipping_cost: number | null;
  discount: number | null;
  shipping_name: string;
  shipping_phone: string;
  shipping_street: string;
  shipping_city: string;
  shipping_district: string;
  shipping_postal_code: string | null;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  order_items: OrderItem[];
}

const statusOptions = [
  { value: 'pending', label: 'Pending', icon: Clock, color: 'bg-yellow-500' },
  { value: 'processing', label: 'Processing', icon: Package, color: 'bg-blue-500' },
  { value: 'shipped', label: 'Shipped', icon: Truck, color: 'bg-purple-500' },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, color: 'bg-red-500' },
];

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await getAllOrders();
      setOrders(data || []);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(search.toLowerCase()) ||
      order.shipping_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openOrderDetail = (order: Order) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || '');
    setIsDetailOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await updateOrderStatus(orderId, newStatus, trackingNumber || undefined);
      toast.success('Order status updated');
      loadOrders();
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus, tracking_number: trackingNumber });
      }
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status);
    if (!statusOption) return <Badge>{status}</Badge>;

    const Icon = statusOption.icon;
    return (
      <Badge className={`${statusOption.color} text-white gap-1`}>
        <Icon className="h-3 w-3" />
        {statusOption.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardContent className="p-0">
            <div className="space-y-4 p-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Orders</h1>
        <p className="text-muted-foreground">Manage and track customer orders</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or customer..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    <div>
                      <div>{order.shipping_name}</div>
                      <div className="text-sm text-muted-foreground">{order.shipping_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(order.created_at), 'MMM dd, yyyy')}</TableCell>
                  <TableCell>${Number(order.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge variant={order.payment_status === 'paid' ? 'default' : 'outline'}>
                      {order.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openOrderDetail(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_number}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Customer Information</h3>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>{selectedOrder.shipping_name}</p>
                    <p>{selectedOrder.shipping_phone}</p>
                    <p>{selectedOrder.shipping_street}</p>
                    <p>{selectedOrder.shipping_district}, {selectedOrder.shipping_city}</p>
                    {selectedOrder.shipping_postal_code && <p>{selectedOrder.shipping_postal_code}</p>}
                  </div>
                </div>
                <div>
                  <h3 className="font-medium mb-2">Order Details</h3>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>Date: {format(new Date(selectedOrder.created_at), 'PPpp')}</p>
                    <p>Payment: {selectedOrder.payment_method.toUpperCase()}</p>
                    <p>Payment Status: {selectedOrder.payment_status}</p>
                    {selectedOrder.notes && <p>Notes: {selectedOrder.notes}</p>}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Items</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.order_items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3">
                      {item.product_image && (
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${Number(item.price).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between text-sm">
                  <span>Subtotal</span>
                  <span>${Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Shipping</span>
                  <span>${Number(selectedOrder.shipping_cost || 0).toFixed(2)}</span>
                </div>
                {selectedOrder.discount && Number(selectedOrder.discount) > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-${Number(selectedOrder.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                  <span>Total</span>
                  <span>${Number(selectedOrder.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-medium">Update Status</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={selectedOrder.status}
                      onValueChange={(value) => handleStatusChange(selectedOrder.id, value)}
                      disabled={updating}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tracking Number</Label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
