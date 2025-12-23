-- Allow guest users to create orders (user_id can be null)
CREATE POLICY "Anyone can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Drop the old restrictive insert policy
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;

-- Allow guest users to create order items for their orders
CREATE POLICY "Anyone can create order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);

-- Drop the old restrictive insert policy for order items
DROP POLICY IF EXISTS "Users can create order items for their orders" ON public.order_items;