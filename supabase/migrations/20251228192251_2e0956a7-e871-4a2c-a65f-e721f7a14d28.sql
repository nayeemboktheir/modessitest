-- Create landing_pages table
CREATE TABLE public.landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  
  -- Hero section
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image TEXT,
  hero_button_text TEXT,
  hero_button_link TEXT,
  hero_button_style TEXT DEFAULT 'primary',
  
  -- Features section
  features_enabled BOOLEAN DEFAULT false,
  features_title TEXT,
  features JSONB DEFAULT '[]'::jsonb,
  
  -- Products section
  products_enabled BOOLEAN DEFAULT false,
  products_title TEXT,
  product_ids UUID[] DEFAULT '{}',
  
  -- CTA section
  cta_enabled BOOLEAN DEFAULT false,
  cta_title TEXT,
  cta_subtitle TEXT,
  cta_button_text TEXT,
  cta_button_link TEXT,
  cta_background_color TEXT,
  
  -- Testimonials section
  testimonials_enabled BOOLEAN DEFAULT false,
  testimonials_title TEXT,
  testimonials JSONB DEFAULT '[]'::jsonb,
  
  -- FAQ section
  faq_enabled BOOLEAN DEFAULT false,
  faq_title TEXT,
  faqs JSONB DEFAULT '[]'::jsonb,
  
  -- Custom CSS/styling
  custom_css TEXT,
  meta_title TEXT,
  meta_description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.landing_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can view published landing pages
CREATE POLICY "Anyone can view published landing pages"
ON public.landing_pages
FOR SELECT
USING (is_published = true AND is_active = true);

-- Admins can manage all landing pages
CREATE POLICY "Admins can manage landing pages"
ON public.landing_pages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_landing_pages_updated_at
BEFORE UPDATE ON public.landing_pages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();