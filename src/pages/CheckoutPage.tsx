import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { selectCartItems, selectCartTotal, clearCart } from '@/store/slices/cartSlice';
import { useAuth } from '@/hooks/useAuth';
import { createOrder } from '@/services/orderService';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Truck, CreditCard, Banknote, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

interface ShippingForm {
  name: string;
  phone: string;
  street: string;
  city: string;
  district: string;
  postalCode: string;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const cartItems = useAppSelector(selectCartItems);
  const cartTotal = useAppSelector(selectCartTotal);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  
  const [shippingForm, setShippingForm] = useState<ShippingForm>({
    name: '',
    phone: '',
    street: '',
    city: '',
    district: '',
    postalCode: '',
  });
  
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'stripe'>('cod');
  const [notes, setNotes] = useState('');
  
  const shippingCost = cartTotal >= 2000 ? 0 : 100;
  const total = cartTotal + shippingCost;

  // Load saved address if user is logged in
  useEffect(() => {
    const loadUserAddress = async () => {
      if (!user) return;
      
      const { data: addresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .maybeSingle();
      
      if (addresses) {
        setShippingForm({
          name: addresses.name,
          phone: addresses.phone,
          street: addresses.street,
          city: addresses.city,
          district: addresses.district,
          postalCode: addresses.postal_code || '',
        });
      } else {
        // Load profile info if no default address
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, phone')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (profile) {
          setShippingForm(prev => ({
            ...prev,
            name: profile.full_name || '',
            phone: profile.phone || '',
          }));
        }
      }
    };
    
    loadUserAddress();
  }, [user]);

  // Redirect to cart if empty
  useEffect(() => {
    if (!authLoading && cartItems.length === 0 && !orderSuccess) {
      navigate('/cart');
    }
  }, [cartItems, authLoading, navigate, orderSuccess]);

  const formatPrice = (price: number) => {
    return `৳${price.toLocaleString('en-BD')}`;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setShippingForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = (): boolean => {
    if (!shippingForm.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return false;
    }
    if (!shippingForm.phone.trim() || !/^(\+?880)?01[3-9]\d{8}$/.test(shippingForm.phone.replace(/\s/g, ''))) {
      toast({ title: "Valid Bangladesh phone number is required", variant: "destructive" });
      return false;
    }
    if (!shippingForm.street.trim()) {
      toast({ title: "Street address is required", variant: "destructive" });
      return false;
    }
    if (!shippingForm.city.trim()) {
      toast({ title: "City is required", variant: "destructive" });
      return false;
    }
    if (!shippingForm.district.trim()) {
      toast({ title: "District is required", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const order = await createOrder({
        userId: user?.id || null,
        items: cartItems,
        shippingAddress: shippingForm,
        paymentMethod,
        notes: notes.trim() || undefined,
      });
      
      dispatch(clearCart());
      setOrderSuccess(true);
      setOrderNumber(order.id);
      
      toast({
        title: "Order placed successfully!",
        description: "You will receive a confirmation shortly.",
      });
    } catch (error) {
      console.error('Order error:', error);
      toast({
        title: "Failed to place order",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <main className="min-h-screen bg-muted/30 py-8">
        <div className="container-custom max-w-2xl">
          <div className="bg-card rounded-xl p-8 text-center shadow-lg">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Order Confirmed!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your order. We've received your order and will process it shortly.
            </p>
            <div className="bg-muted/50 rounded-lg p-4 mb-6">
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono text-lg font-semibold text-foreground">{orderNumber}</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={() => navigate('/')} variant="outline">
                Continue Shopping
              </Button>
              {user && (
                <Button onClick={() => navigate('/orders')} className="gradient-hero">
                  View Orders
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted/30 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="mb-8">
          <Link to="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Cart
          </Link>
          <h1 className="font-display text-3xl font-bold text-foreground">Checkout</h1>
          {!user && (
            <p className="text-muted-foreground mt-2">
              Checking out as guest.{' '}
              <Link to="/auth" className="text-primary hover:underline">
                Sign in
              </Link>{' '}
              to track your orders.
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Shipping Information */}
              <div className="bg-card rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <Truck className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-foreground">Shipping Information</h2>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="Enter your full name"
                      value={shippingForm.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      placeholder="01XXX-XXXXXX"
                      value={shippingForm.phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-2">
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      name="street"
                      placeholder="House no, Road no, Area"
                      value={shippingForm.street}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="e.g., Dhaka"
                      value={shippingForm.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="district">District *</Label>
                    <Input
                      id="district"
                      name="district"
                      placeholder="e.g., Dhaka"
                      value={shippingForm.district}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code (Optional)</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      placeholder="e.g., 1205"
                      value={shippingForm.postalCode}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card rounded-xl p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-foreground">Payment Method</h2>
                </div>
                
                <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'cod' | 'stripe')}>
                  <div className="space-y-3">
                    <label
                      htmlFor="cod"
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === 'cod' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="cod" id="cod" />
                      <Banknote className="h-6 w-6 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Cash on Delivery</p>
                        <p className="text-sm text-muted-foreground">Pay when you receive your order</p>
                      </div>
                    </label>
                    
                    <label
                      htmlFor="stripe"
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        paymentMethod === 'stripe' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <RadioGroupItem value="stripe" id="stripe" />
                      <CreditCard className="h-6 w-6 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="font-medium text-foreground">Card Payment</p>
                        <p className="text-sm text-muted-foreground">Pay securely with credit/debit card</p>
                      </div>
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">Coming Soon</span>
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {/* Order Notes */}
              <div className="bg-card rounded-xl p-6 shadow-sm">
                <h2 className="font-display text-xl font-semibold text-foreground mb-4">Order Notes (Optional)</h2>
                <Textarea
                  placeholder="Add any special instructions for your order..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl p-6 shadow-sm sticky top-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <ShoppingBag className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-foreground">Order Summary</h2>
                </div>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.product.images[0] || '/placeholder.svg'}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm line-clamp-2">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-foreground text-sm">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                {/* Pricing */}
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-foreground">
                      {shippingCost === 0 ? (
                        <span className="text-primary">Free</span>
                      ) : (
                        formatPrice(shippingCost)
                      )}
                    </span>
                  </div>
                  {cartTotal < 2000 && (
                    <p className="text-xs text-muted-foreground">
                      Add {formatPrice(2000 - cartTotal)} more for free shipping
                    </p>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center mb-6">
                  <span className="font-display text-lg font-semibold text-foreground">Total</span>
                  <span className="font-display text-2xl font-bold text-primary">{formatPrice(total)}</span>
                </div>

                <Button 
                  type="submit" 
                  className="w-full gradient-hero text-primary-foreground h-12 text-base"
                  disabled={isSubmitting || cartItems.length === 0}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    `Place Order • ${formatPrice(total)}`
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-4">
                  By placing your order, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
};

export default CheckoutPage;
