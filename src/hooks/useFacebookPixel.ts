import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

declare global {
  interface Window {
    fbq: (...args: any[]) => void;
    _fbq: any;
  }
}

interface FacebookPixelConfig {
  pixelId: string;
  enabled: boolean;
}

let isInitialized = false;
let pixelConfig: FacebookPixelConfig | null = null;

const loadPixelScript = (pixelId: string) => {
  if (isInitialized) return;

  // Facebook Pixel base code
  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${pixelId}');
  `;
  document.head.appendChild(script);

  // Add noscript fallback
  const noscript = document.createElement('noscript');
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.body.appendChild(noscript);

  isInitialized = true;
};

export const useFacebookPixel = () => {
  const [config, setConfig] = useState<FacebookPixelConfig | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      if (pixelConfig) {
        setConfig(pixelConfig);
        return;
      }

      try {
        const { data } = await supabase
          .from('admin_settings')
          .select('key, value')
          .in('key', ['fb_pixel_id', 'fb_pixel_enabled']);

        let id = '';
        let enabled = false;

        data?.forEach((setting) => {
          if (setting.key === 'fb_pixel_id') id = setting.value;
          if (setting.key === 'fb_pixel_enabled') enabled = setting.value === 'true';
        });

        const newConfig = { pixelId: id, enabled: enabled && !!id };
        pixelConfig = newConfig;
        setConfig(newConfig);

        if (newConfig.enabled) {
          loadPixelScript(newConfig.pixelId);
        }
      } catch (error) {
        console.error('Failed to load Facebook Pixel config:', error);
      }
    };

    loadConfig();
  }, []);

  const trackPageView = useCallback(() => {
    if (config?.enabled && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [config]);

  const trackViewContent = useCallback(
    (params: { content_ids: string[]; content_name: string; content_type: string; value: number; currency: string }) => {
      if (config?.enabled && window.fbq) {
        window.fbq('track', 'ViewContent', params);
      }
    },
    [config]
  );

  const trackAddToCart = useCallback(
    (params: { content_ids: string[]; content_name: string; content_type: string; value: number; currency: string }) => {
      if (config?.enabled && window.fbq) {
        window.fbq('track', 'AddToCart', params);
      }
    },
    [config]
  );

  const trackInitiateCheckout = useCallback(
    (params: { content_ids: string[]; num_items: number; value: number; currency: string }) => {
      if (config?.enabled && window.fbq) {
        window.fbq('track', 'InitiateCheckout', params);
      }
    },
    [config]
  );

  const trackPurchase = useCallback(
    (params: { content_ids: string[]; content_type: string; value: number; currency: string; num_items: number }) => {
      if (config?.enabled && window.fbq) {
        window.fbq('track', 'Purchase', params);
      }
    },
    [config]
  );

  return {
    isEnabled: config?.enabled ?? false,
    trackPageView,
    trackViewContent,
    trackAddToCart,
    trackInitiateCheckout,
    trackPurchase,
  };
};
