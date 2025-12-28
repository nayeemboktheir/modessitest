-- Add sections column to store the visual builder sections
ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS sections jsonb DEFAULT '[]'::jsonb;

-- Add theme settings for the visual builder
ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS theme_settings jsonb DEFAULT '{
  "primaryColor": "#000000",
  "secondaryColor": "#f5f5f5",
  "accentColor": "#ef4444",
  "backgroundColor": "#ffffff",
  "textColor": "#1f2937",
  "fontFamily": "Inter",
  "borderRadius": "8px",
  "buttonStyle": "filled"
}'::jsonb;

-- Add checkout form settings
ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS checkout_enabled boolean DEFAULT true;

ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS checkout_title text DEFAULT 'অর্ডার করতে নিচের ফর্মটি পূরণ করুন';

ALTER TABLE public.landing_pages 
ADD COLUMN IF NOT EXISTS checkout_button_text text DEFAULT 'অর্ডার কনফার্ম করুন';