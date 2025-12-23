import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useFacebookPixel } from '@/hooks/useFacebookPixel';

export function FacebookPixelTracker() {
  const location = useLocation();
  const { trackPageView, isEnabled } = useFacebookPixel();

  useEffect(() => {
    if (isEnabled) {
      trackPageView();
    }
  }, [location.pathname, isEnabled, trackPageView]);

  return null;
}
