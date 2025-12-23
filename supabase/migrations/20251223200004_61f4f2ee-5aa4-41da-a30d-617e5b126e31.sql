-- Create table for incomplete/draft orders
CREATE TABLE public.draft_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text NOT NULL,
  shipping_name text,
  shipping_phone text,
  shipping_street text,
  shipping_district text,
  shipping_city text,
  shipping_postal_code text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric DEFAULT 0,
  shipping_cost numeric DEFAULT 0,
  total numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  converted_at timestamp with time zone,
  is_converted boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE public.draft_orders ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert/update draft orders (for guest users)
CREATE POLICY "Anyone can create draft orders"
ON public.draft_orders
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can update their draft orders"
ON public.draft_orders
FOR UPDATE
USING (true);

-- Admins can view all draft orders
CREATE POLICY "Admins can manage all draft orders"
ON public.draft_orders
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_draft_orders_updated_at
BEFORE UPDATE ON public.draft_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create index for faster queries
CREATE INDEX idx_draft_orders_session ON public.draft_orders(session_id);
CREATE INDEX idx_draft_orders_converted ON public.draft_orders(is_converted);