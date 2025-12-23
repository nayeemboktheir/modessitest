import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Save, BarChart3, Eye, ShoppingCart, CreditCard } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function AdminMarketing() {
  const [pixelId, setPixelId] = useState('');
  const [pixelEnabled, setPixelEnabled] = useState(false);
  const [capiToken, setCapiToken] = useState('');
  const [capiEnabled, setCapiEnabled] = useState(false);
  const [testEventCode, setTestEventCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
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
      toast.error('Failed to load marketing settings');
    } finally {
      setLoading(false);
    }
  };

  const upsertSetting = async (key: string, value: string) => {
    const { error } = await supabase
      .from('admin_settings')
      .upsert({ key, value }, { onConflict: 'key' });

    if (error) throw error;
  };

  const handleSave = async () => {
    if (pixelEnabled && !pixelId.trim()) {
      toast.error('Please enter a Facebook Pixel ID');
      return;
    }

    if (capiEnabled && !capiToken.trim()) {
      toast.error('Please enter a Conversion API Access Token');
      return;
    }

    setSaving(true);
    try {
      await Promise.all([
        upsertSetting('fb_pixel_id', pixelId.trim()),
        upsertSetting('fb_pixel_enabled', pixelEnabled.toString()),
        upsertSetting('fb_capi_token', capiToken.trim()),
        upsertSetting('fb_capi_enabled', capiEnabled.toString()),
        upsertSetting('fb_test_event_code', testEventCode.trim()),
      ]);

      toast.success('Marketing settings saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
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
        <p className="text-muted-foreground">Configure Facebook Pixel and Conversion API tracking</p>
      </div>

      <div className="grid gap-6">
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
        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Marketing Settings'}
        </Button>
      </div>
    </div>
  );
}
