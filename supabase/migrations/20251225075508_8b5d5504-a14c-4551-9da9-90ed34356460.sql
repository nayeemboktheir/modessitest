-- Add order_source column to orders table
ALTER TABLE public.orders 
ADD COLUMN order_source text NOT NULL DEFAULT 'web';

-- Update existing orders to be marked as 'web' orders
UPDATE public.orders SET order_source = 'web' WHERE order_source IS NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.orders.order_source IS 'Source of order: web, manual, phone, etc.';