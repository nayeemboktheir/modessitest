import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbq: ((...args: any[]) => void) & { 
      push?: (...args: any[]) => void;
      loaded?: boolean;
      version?: string;
      queue?: any[];
      callMethod?: (...args: any[]) => void;
    };
    _fbq: any;
  }
}

interface FacebookPixelConfig {
  pixelId: string;
  enabled: boolean;
}

let pixelConfig: FacebookPixelConfig | null = null;
let isPixelLoading = false;
let pixelLoadPromise: Promise<void> | null = null;

const loadPixelScript = (pixelId: string): Promise<void> => {
  if (pixelLoadPromise) return pixelLoadPromise;
  
  if (window.fbq && window.fbq.loaded) {
    return Promise.resolve();
  }

  isPixelLoading = true;
  
  pixelLoadPromise = new Promise((resolve) => {
    // Initialize fbq function before script loads
    const fbq = function(...args: any[]) {
      if (fbq.callMethod) {
        fbq.callMethod.apply(fbq, args);
      } else {
        fbq.queue?.push(args);
      }
    } as Window['fbq'];
    
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    window.fbq = fbq;

    // Load the Facebook Pixel script
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    script.onload = () => {
      console.log('Facebook Pixel script loaded successfully');
      // Initialize the pixel
      window.fbq('init', pixelId);
      console.log('Facebook Pixel initialized with ID:', pixelId);
      isPixelLoading = false;
      resolve();
    };
    script.onerror = () => {
      console.error('Failed to load Facebook Pixel script');
      isPixelLoading = false;
      resolve();
    };
    
    const firstScript = document.getElementsByTagName('script')[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.head.appendChild(script);
    }

    // Add noscript fallback
    const noscript = document.createElement('noscript');
    const img = document.createElement('img');
    img.height = 1;
    img.width = 1;
    img.style.display = 'none';
    img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
    noscript.appendChild(img);
    document.body.appendChild(noscript);
  });

  return pixelLoadPromise;
};

export const useFacebookPixel = () => {
  const [config, setConfig] = useState<FacebookPixelConfig | null>(pixelConfig);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadConfig = async () => {
      // Use cached config if available
      if (pixelConfig) {
        setConfig(pixelConfig);
        if (pixelConfig.enabled && pixelConfig.pixelId) {
          await loadPixelScript(pixelConfig.pixelId);
          setIsReady(true);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_settings')
          .select('key, value')
          .in('key', ['fb_pixel_id', 'fb_pixel_enabled']);

        if (error) {
          console.error('Failed to fetch pixel settings:', error);
          return;
        }

        let id = '';
        let enabled = false;

        data?.forEach((setting) => {
          if (setting.key === 'fb_pixel_id') id = setting.value;
          if (setting.key === 'fb_pixel_enabled') enabled = setting.value === 'true';
        });

        const newConfig = { pixelId: id, enabled: enabled && !!id };
        pixelConfig = newConfig;
        setConfig(newConfig);

        console.log('Facebook Pixel config loaded:', { enabled: newConfig.enabled, hasPixelId: !!id });

        if (newConfig.enabled) {
          await loadPixelScript(newConfig.pixelId);
          setIsReady(true);
        }
      } catch (error) {
        console.error('Failed to load Facebook Pixel config:', error);
      }
    };

    loadConfig();
  }, []);

  const trackPageView = useCallback(() => {
    if (config?.enabled && window.fbq) {
      console.log('Tracking PageView');
      window.fbq('track', 'PageView');
    }
  }, [config]);

  const trackViewContent = useCallback(
    (params: { content_ids: string[]; content_name: string; content_type: string; value: number; currency: string }) => {
      if (config?.enabled && window.fbq) {
        console.log('Tracking ViewContent:', params);
        window.fbq('track', 'ViewContent', params);
      }
    },
    [config]
  );

  const trackAddToCart = useCallback(
    (params: { content_ids: string[]; content_name: string; content_type: string; value: number; currency: string }) => {
      if (config?.enabled && window.fbq) {
        console.log('Tracking AddToCart:', params);
        window.fbq('track', 'AddToCart', params);
      }
    },
    [config]
  );

  const trackInitiateCheckout = useCallback(
    (params: { content_ids: string[]; num_items: number; value: number; currency: string }) => {
      if (config?.enabled && window.fbq) {
        console.log('Tracking InitiateCheckout:', params);
        window.fbq('track', 'InitiateCheckout', params);
      }
    },
    [config]
  );

  const trackPurchase = useCallback(
    (params: { content_ids: string[]; content_type: string; value: number; currency: string; num_items: number }) => {
      if (config?.enabled && window.fbq) {
        console.log('Tracking Purchase:', params);
        window.fbq('track', 'Purchase', params);
      }
    },
    [config]
  );

  return {
    isEnabled: config?.enabled ?? false,
    isReady,
    trackPageView,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
  };
};
