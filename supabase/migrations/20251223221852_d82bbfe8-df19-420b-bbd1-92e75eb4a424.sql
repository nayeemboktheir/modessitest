-- Allow storefront (public/anon) to read ONLY non-sensitive Facebook Pixel settings
-- (Pixel ID + enabled flag). Keep all other settings (e.g., CAPI token) admin-only.

CREATE POLICY "Public can read FB Pixel settings"
ON public.admin_settings
FOR SELECT
TO public
USING (key IN ('fb_pixel_id', 'fb_pixel_enabled'));
