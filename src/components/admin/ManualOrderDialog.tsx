import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Minus, Trash2, Star, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[] | null;
  stock: number;
  slug: string;
}

interface OrderItem {
  product: Product;
  quantity: number;
}

interface ManualOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderCreated: () => void;
}

export function ManualOrderDialog({ open, onOpenChange, onOrderCreated }: ManualOrderDialogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [codeSearch, setCodeSearch] = useState('');
  const [nameSearch, setNameSearch] = useState('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [creating, setCreating] = useState(false);
  
  // Customer info
  const [mobileNumber, setMobileNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [shippingNote, setShippingNote] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('steadfast');
  const [shippingZone, setShippingZone] = useState<'inside_dhaka' | 'outside_dhaka'>('outside_dhaka');
  
  // Pricing
  const [discount, setDiscount] = useState('');
  const [advance, setAdvance] = useState('');
  const [deliveryCharge, setDeliveryCharge] = useState('');

  // Default shipping costs
  const SHIPPING_COSTS = {
    inside_dhaka: 60,
    outside_dhaka: 120,
  };

  useEffect(() => {
    if (open) {
      loadProducts();
      // Set default delivery charge based on zone
      setDeliveryCharge(SHIPPING_COSTS[shippingZone].toString());
    }
  }, [open]);

  useEffect(() => {
    // Update delivery charge when zone changes (unless manually edited)
    if (!deliveryCharge || deliveryCharge === SHIPPING_COSTS.inside_dhaka.toString() || deliveryCharge === SHIPPING_COSTS.outside_dhaka.toString()) {
      setDeliveryCharge(SHIPPING_COSTS[shippingZone].toString());
    }
  }, [shippingZone]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, price, images, stock, slug')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCode = !codeSearch || p.slug.toLowerCase().includes(codeSearch.toLowerCase());
    const matchesName = !nameSearch || p.name.toLowerCase().includes(nameSearch.toLowerCase());
    return matchesCode && matchesName;
  });

  const addProduct = (product: Product) => {
    const existing = orderItems.find(item => item.product.id === product.id);
    if (existing) {
      updateQuantity(product.id, existing.quantity + 1);
    } else {
      setOrderItems([...orderItems, { product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeProduct(productId);
      return;
    }
    setOrderItems(orderItems.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const removeProduct = (productId: string) => {
    setOrderItems(orderItems.filter(item => item.product.id !== productId));
  };

  const subtotal = orderItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = Number(discount) || 0;
  const advanceAmount = Number(advance) || 0;
  const shippingCost = Number(deliveryCharge) || 0;
  const grandTotal = subtotal - discountAmount + shippingCost - advanceAmount;

  const resetForm = () => {
    setOrderItems([]);
    setMobileNumber('');
    setCustomerName('');
    setCustomerAddress('');
    setShippingNote('');
    setDeliveryMethod('steadfast');
    setShippingZone('outside_dhaka');
    setDiscount('');
    setAdvance('');
    setDeliveryCharge(SHIPPING_COSTS.outside_dhaka.toString());
    setCodeSearch('');
    setNameSearch('');
  };

  const handleSubmit = async () => {
    if (!mobileNumber.trim()) {
      toast.error('Please enter mobile number');
      return;
    }
    if (!customerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }
    if (!customerAddress.trim()) {
      toast.error('Please enter address');
      return;
    }
    if (orderItems.length === 0) {
      toast.error('Please add at least one product');
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke('place-order', {
        body: {
          userId: null,
          items: orderItems.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            productName: item.product.name,
            productImage: item.product.images?.[0] || null,
            price: item.product.price,
          })),
          shipping: {
            name: customerName,
            phone: mobileNumber,
            address: customerAddress,
          },
          shippingZone,
          notes: shippingNote,
          orderSource: 'manual',
        },
      });

      if (error) throw error;

      toast.success(`Order created successfully! Order #${data.orderNumber || data.orderId}`);
      resetForm();
      onOrderCreated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to create order:', error);
      toast.error(error.message || 'Failed to create order');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="text-lg font-semibold">New Order</DialogTitle>
        </DialogHeader>

        <div className="p-4 space-y-4">
          {/* Customer Information Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="mobileNumber" className="text-sm text-muted-foreground">Mobile Number</Label>
              <Input
                id="mobileNumber"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Mobile Number"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="customerName" className="text-sm text-muted-foreground">Name</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Customer Name"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Delivery Method</Label>
              <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="steadfast">Steadfast</SelectItem>
                  <SelectItem value="pathao">Pathao</SelectItem>
                  <SelectItem value="redx">RedX</SelectItem>
                  <SelectItem value="sundarban">Sundarban</SelectItem>
                  <SelectItem value="self">Self Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Address and Notes Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-sm text-muted-foreground">Address</Label>
              <Input
                id="address"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Enter address"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="shippingNote" className="text-sm text-muted-foreground">Shipping Note</Label>
              <Input
                id="shippingNote"
                value={shippingNote}
                onChange={(e) => setShippingNote(e.target.value)}
                placeholder="Enter shipping note"
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Shipping Zone</Label>
              <Select value={shippingZone} onValueChange={(v: 'inside_dhaka' | 'outside_dhaka') => setShippingZone(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inside_dhaka">Inside Dhaka</SelectItem>
                  <SelectItem value="outside_dhaka">Outside Dhaka</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Section - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Ordered Products */}
            <Card className="border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-semibold">Ordered Products</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 min-h-[250px]">
                {orderItems.length === 0 ? (
                  <p className="text-sm text-blue-500">No Products added. Please add products to the order</p>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map(item => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-2 p-2 bg-muted/30 rounded-md"
                      >
                        {item.product.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">৳{item.product.price}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive"
                            onClick={() => removeProduct(item.product.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="font-medium text-sm w-16 text-right">
                          ৳{item.product.price * item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Click To Add Products */}
            <Card className="border">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-base font-semibold">Click To Add Products</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {/* Search Row */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">Code/sku</Label>
                    <Input
                      value={codeSearch}
                      onChange={(e) => setCodeSearch(e.target.value)}
                      placeholder="Type to Search.."
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1 block">Name</Label>
                    <Input
                      value={nameSearch}
                      onChange={(e) => setNameSearch(e.target.value)}
                      placeholder="Type to Search.."
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Products List */}
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {loadingProducts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : filteredProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">No products found</p>
                  ) : (
                    filteredProducts.map(product => (
                      <div
                        key={product.id}
                        className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-md cursor-pointer group"
                        onClick={() => addProduct(product)}
                      >
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-14 h-14 object-cover rounded"
                          />
                        ) : (
                          <div className="w-14 h-14 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                            No img
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-blue-600">SKU: {product.slug}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-muted-foreground">Price: ৳{product.price}</p>
                            <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-500 hover:text-amber-600 opacity-70 group-hover:opacity-100"
                        >
                          <Star className="h-4 w-4 fill-current" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Discount</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Advance</Label>
              <Input
                type="number"
                value={advance}
                onChange={(e) => setAdvance(e.target.value)}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Sub Total</Label>
              <Input
                value={subtotal}
                readOnly
                className="h-8 text-sm bg-muted/50"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">DeliveryCharge</Label>
              <Input
                type="number"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-primary">Grand Total</Label>
              <Input
                value={grandTotal}
                readOnly
                className="h-8 text-sm bg-muted/50 font-semibold"
              />
            </div>
          </div>

          {/* Create Order Button */}
          <Button
            onClick={handleSubmit}
            disabled={creating}
            className="w-full h-10 bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
          >
            {creating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              `Create Order (${grandTotal.toFixed(2)}৳)`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
