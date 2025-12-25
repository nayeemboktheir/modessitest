import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { 
  Save, BarChart3, Eye, ShoppingCart, CreditCard, Facebook, 
  Ticket, Plus, Trash2, Pencil, Calendar, Percent, DollarSign 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

type Coupon = {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_amount: number | null;
  max_discount_amount: number | null;
  usage_limit: number | null;
  used_count: number | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean | null;
  created_at: string;
};

export default function AdminMarketing() {
  // Facebook state
  const [pixelId, setPixelId] = useState('');
  const [pixelEnabled, setPixelEnabled] = useState(false);
  const [capiToken, setCapiToken] = useState('');
  const [capiEnabled, setCapiEnabled] = useState(false);
  const [testEventCode, setTestEventCode] = useState('');
  const [savingFb, setSavingFb] = useState(false);
  const [loadingFb, setLoadingFb] = useState(true);

  // Coupon state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [savingCoupon, setSavingCoupon] = useState(false);

  // Coupon form state
  const [couponForm, setCouponForm] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    min_order_amount: 0,
    max_discount_amount: 0,
    usage_limit: 0,
    starts_at: '',
    expires_at: '',
    is_active: true,
  });

  useEffect(() => {
    loadFacebookSettings();
    loadCoupons();
  }, []);

  // Facebook functions
  const loadFacebookSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')
        .in('key', [
          'fb_pixel_id',
          'fb_pixel_enabled',
          'fb_capi_token',
          'fb_capi_enabled',
          'fb_test_event_code',
        ]);

      if (error) throw error;

      data?.forEach((setting) => {
        switch (setting.key) {
          case 'fb_pixel_id':
            setPixelId(setting.value);
            break;
          case 'fb_pixel_enabled':
            setPixelEnabled(setting.value === 'true');
            break;
          case 'fb_capi_token':
            setCapiToken(setting.value);
            break;
          case 'fb_capi_enabled':
            setCapiEnabled(setting.value === 'true');
            break;
          case 'fb_test_event_code':
            setTestEventCode(setting.value);
            break;
        }
      });
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load Facebook settings');
    } finally {
      setLoadingFb(false);
    }
  };

  const upsertSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) throw error;
  };

  const handleSaveFacebook = async () => {
    if (pixelEnabled && !pixelId.trim()) {
      toast.error('Please enter a Facebook Pixel ID');
      return;
    }

    if (capiEnabled && !capiToken.trim()) {
      toast.error('Please enter a Conversion API Access Token');
      return;
    }

    setSavingFb(true);
    try {
      await Promise.all([
        upsertSetting('fb_pixel_id', pixelId.trim()),
        upsertSetting('fb_pixel_enabled', pixelEnabled.toString()),
        upsertSetting('fb_capi_token', capiToken.trim()),
        upsertSetting('fb_capi_enabled', capiEnabled.toString()),
        upsertSetting('fb_test_event_code', testEventCode.trim()),
      ]);

      toast.success('Facebook settings saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSavingFb(false);
    }
  };

  // Coupon functions
  const loadCoupons = async () => {
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCoupons(data || []);
    } catch (error) {
      console.error('Failed to load coupons:', error);
      toast.error('Failed to load coupons');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const openCouponDialog = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm({
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        min_order_amount: coupon.min_order_amount || 0,
        max_discount_amount: coupon.max_discount_amount || 0,
        usage_limit: coupon.usage_limit || 0,
        starts_at: coupon.starts_at ? coupon.starts_at.split('T')[0] : '',
        expires_at: coupon.expires_at ? coupon.expires_at.split('T')[0] : '',
        is_active: coupon.is_active ?? true,
      });
    } else {
      setEditingCoupon(null);
      setCouponForm({
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_amount: 0,
        max_discount_amount: 0,
        usage_limit: 0,
        starts_at: '',
        expires_at: '',
        is_active: true,
      });
    }
    setCouponDialogOpen(true);
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    if (couponForm.discount_value <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    setSavingCoupon(true);
    try {
      const couponData = {
        code: couponForm.code.toUpperCase().trim(),
        discount_type: couponForm.discount_type,
        discount_value: couponForm.discount_value,
        min_order_amount: couponForm.min_order_amount || null,
        max_discount_amount: couponForm.max_discount_amount || null,
        usage_limit: couponForm.usage_limit || null,
        starts_at: couponForm.starts_at || null,
        expires_at: couponForm.expires_at || null,
        is_active: couponForm.is_active,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from('coupons')
          .update(couponData)
          .eq('id', editingCoupon.id);

        if (error) throw error;
        toast.success('Coupon updated successfully');
      } else {
        const { error } = await supabase
          .from('coupons')
          .insert(couponData);

        if (error) throw error;
        toast.success('Coupon created successfully');
      }

      setCouponDialogOpen(false);
      loadCoupons();
    } catch (error: any) {
      console.error('Save coupon error:', error);
      if (error.code === '23505') {
        toast.error('Coupon code already exists');
      } else {
        toast.error('Failed to save coupon');
      }
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;

    try {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Coupon deleted');
      loadCoupons();
    } catch (error) {
      console.error('Delete coupon error:', error);
      toast.error('Failed to delete coupon');
    }
  };

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !coupon.is_active })
        .eq('id', coupon.id);

      if (error) throw error;
      loadCoupons();
    } catch (error) {
      console.error('Toggle coupon error:', error);
      toast.error('Failed to update coupon status');
    }
  };

  if (loadingFb && loadingCoupons) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Marketing</h1>
        <p className="text-muted-foreground">Manage Facebook tracking and promotional coupons</p>
      </div>

      <Tabs defaultValue="facebook" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="facebook" className="gap-2">
            <Facebook className="h-4 w-4" />
            Facebook
          </TabsTrigger>
          <TabsTrigger value="coupons" className="gap-2">
            <Ticket className="h-4 w-4" />
            Coupons
          </TabsTrigger>
        </TabsList>

        {/* Facebook Tab */}
        <TabsContent value="facebook" className="space-y-6">
          {/* Facebook Pixel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    Facebook Pixel
                  </CardTitle>
                  <CardDescription>
                    Track website visitors and their actions for Facebook Ads
                  </CardDescription>
                </div>
                <Switch
                  checked={pixelEnabled}
                  onCheckedChange={setPixelEnabled}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pixelId">Pixel ID</Label>
                <Input
                  id="pixelId"
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                  placeholder="Enter your Facebook Pixel ID (e.g., 123456789012345)"
                  disabled={!pixelEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Find your Pixel ID in Facebook Events Manager → Data Sources
                </p>
              </div>

              {pixelEnabled && pixelId && (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Pixel will track: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion API */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-purple-600" />
                    Conversion API (CAPI)
                  </CardTitle>
                  <CardDescription>
                    Server-side tracking for better data accuracy and privacy compliance
                  </CardDescription>
                </div>
                <Switch
                  checked={capiEnabled}
                  onCheckedChange={setCapiEnabled}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="capiToken">Access Token</Label>
                <Input
                  id="capiToken"
                  type="password"
                  value={capiToken}
                  onChange={(e) => setCapiToken(e.target.value)}
                  placeholder="Enter your Conversion API Access Token"
                  disabled={!capiEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Generate a token in Events Manager → Settings → Conversions API
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testEventCode">Test Event Code (Optional)</Label>
                <Input
                  id="testEventCode"
                  value={testEventCode}
                  onChange={(e) => setTestEventCode(e.target.value)}
                  placeholder="e.g., TEST12345"
                  disabled={!capiEnabled}
                />
                <p className="text-xs text-muted-foreground">
                  Use this to test events in Events Manager before going live
                </p>
              </div>

              {capiEnabled && capiToken && (
                <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <p className="text-sm text-purple-800 dark:text-purple-200">
                    ✓ CAPI will send: Purchase events with order data for better attribution
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Events Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Tracked Events</CardTitle>
              <CardDescription>Events that will be sent to Facebook when enabled</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Eye className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-sm">PageView</p>
                    <p className="text-xs text-muted-foreground">Every page visit</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Eye className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">ViewContent</p>
                    <p className="text-xs text-muted-foreground">Product detail views</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <ShoppingCart className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium text-sm">AddToCart</p>
                    <p className="text-xs text-muted-foreground">Items added to cart</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <CreditCard className="h-5 w-5 text-purple-500" />
                  <div>
                    <p className="font-medium text-sm">Purchase</p>
                    <p className="text-xs text-muted-foreground">Completed orders</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button onClick={handleSaveFacebook} disabled={savingFb} className="gap-2">
            <Save className="h-4 w-4" />
            {savingFb ? 'Saving...' : 'Save Facebook Settings'}
          </Button>
        </TabsContent>

        {/* Coupons Tab */}
        <TabsContent value="coupons" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-primary" />
                    Discount Coupons
                  </CardTitle>
                  <CardDescription>
                    Create and manage promotional discount codes
                  </CardDescription>
                </div>
                <Button onClick={() => openCouponDialog()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Coupon
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingCoupons ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : coupons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No coupons created yet</p>
                  <p className="text-sm">Click "Add Coupon" to create your first discount code</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Discount</TableHead>
                        <TableHead>Min. Order</TableHead>
                        <TableHead>Usage</TableHead>
                        <TableHead>Validity</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell className="font-mono font-semibold">{coupon.code}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {coupon.discount_type === 'percentage' ? (
                                <>
                                  <Percent className="h-3 w-3" />
                                  {coupon.discount_value}%
                                </>
                              ) : (
                                <>
                                  <DollarSign className="h-3 w-3" />
                                  ৳{coupon.discount_value}
                                </>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {coupon.min_order_amount ? `৳${coupon.min_order_amount}` : '-'}
                          </TableCell>
                          <TableCell>
                            {coupon.usage_limit 
                              ? `${coupon.used_count || 0}/${coupon.usage_limit}`
                              : `${coupon.used_count || 0}/∞`
                            }
                          </TableCell>
                          <TableCell className="text-xs">
                            {coupon.expires_at ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(coupon.expires_at), 'dd MMM yyyy')}
                              </div>
                            ) : (
                              'No expiry'
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant={coupon.is_active ? 'default' : 'secondary'}
                              className="cursor-pointer"
                              onClick={() => toggleCouponStatus(coupon)}
                            >
                              {coupon.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openCouponDialog(coupon)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteCoupon(coupon.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Coupon Dialog */}
      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="couponCode">Coupon Code *</Label>
              <Input
                id="couponCode"
                value={couponForm.code}
                onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SAVE20"
                className="font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select
                  value={couponForm.discount_type}
                  onValueChange={(value) => setCouponForm({ ...couponForm, discount_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountValue">Discount Value *</Label>
                <Input
                  id="discountValue"
                  type="number"
                  value={couponForm.discount_value || ''}
                  onChange={(e) => setCouponForm({ ...couponForm, discount_value: Number(e.target.value) })}
                  placeholder={couponForm.discount_type === 'percentage' ? '20' : '100'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrder">Min. Order Amount</Label>
                <Input
                  id="minOrder"
                  type="number"
                  value={couponForm.min_order_amount || ''}
                  onChange={(e) => setCouponForm({ ...couponForm, min_order_amount: Number(e.target.value) })}
                  placeholder="500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxDiscount">Max Discount</Label>
                <Input
                  id="maxDiscount"
                  type="number"
                  value={couponForm.max_discount_amount || ''}
                  onChange={(e) => setCouponForm({ ...couponForm, max_discount_amount: Number(e.target.value) })}
                  placeholder="200"
                  disabled={couponForm.discount_type === 'fixed'}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="usageLimit">Usage Limit (0 = unlimited)</Label>
              <Input
                id="usageLimit"
                type="number"
                value={couponForm.usage_limit || ''}
                onChange={(e) => setCouponForm({ ...couponForm, usage_limit: Number(e.target.value) })}
                placeholder="100"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startsAt">Start Date</Label>
                <Input
                  id="startsAt"
                  type="date"
                  value={couponForm.starts_at}
                  onChange={(e) => setCouponForm({ ...couponForm, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Expiry Date</Label>
                <Input
                  id="expiresAt"
                  type="date"
                  value={couponForm.expires_at}
                  onChange={(e) => setCouponForm({ ...couponForm, expires_at: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={couponForm.is_active}
                onCheckedChange={(checked) => setCouponForm({ ...couponForm, is_active: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCouponDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCoupon} disabled={savingCoupon}>
              {savingCoupon ? 'Saving...' : editingCoupon ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
