-- Create storage bucket for shop assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('shop-assets', 'shop-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view shop assets (public bucket)
CREATE POLICY "Anyone can view shop assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'shop-assets');

-- Only admins can upload shop assets
CREATE POLICY "Admins can upload shop assets"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'shop-assets' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can update shop assets
CREATE POLICY "Admins can update shop assets"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'shop-assets' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Only admins can delete shop assets
CREATE POLICY "Admins can delete shop assets"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'shop-assets' 
  AND has_role(auth.uid(), 'admin'::app_role)
);