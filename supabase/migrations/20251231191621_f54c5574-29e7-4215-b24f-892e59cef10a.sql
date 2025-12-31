-- Add product description fields for Features, Composition, and Care
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS features TEXT,
ADD COLUMN IF NOT EXISTS composition TEXT,
ADD COLUMN IF NOT EXISTS care_instructions TEXT;