// Lovable Cloud Function: place-order
// Public endpoint (verify_jwt=false). Uses service role key to safely create orders for guests.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type PlaceOrderBody = {
  userId?: string | null;
  items: Array<{ productId: string; quantity: number }>;
  shipping: { name: string; phone: string; address: string };
};

function isBangladeshPhone(phone: string) {
  const normalized = phone.replace(/\s/g, '');
  return /^(\+?880)?01[3-9]\d{8}$/.test(normalized);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceKey) {
      return new Response(JSON.stringify({ error: 'Server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const body = (await req.json()) as PlaceOrderBody;

    // Basic validation
    const name = (body?.shipping?.name ?? '').trim();
    const phone = (body?.shipping?.phone ?? '').trim();
    const address = (body?.shipping?.address ?? '').trim();

    if (!name || name.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid name' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!phone || phone.length > 30 || !isBangladeshPhone(phone)) {
      return new Response(JSON.stringify({ error: 'Invalid phone number' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!address || address.length > 300) {
      return new Response(JSON.stringify({ error: 'Invalid address' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!Array.isArray(body?.items) || body.items.length === 0 || body.items.length > 50) {
      return new Response(JSON.stringify({ error: 'Cart is empty' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanItems = body.items
      .map((i) => ({
        productId: String(i.productId || '').trim(),
        quantity: Number(i.quantity || 0),
      }))
      .filter((i) => i.productId && Number.isFinite(i.quantity) && i.quantity > 0 && i.quantity <= 99);

    if (cleanItems.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid items' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch products & compute totals from DB values (prevents client tampering)
    const productIds = Array.from(new Set(cleanItems.map((i) => i.productId)));

    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price, images')
      .in('id', productIds)
      .eq('is_active', true);

    if (productsError) throw productsError;

    const productById = new Map<string, { id: string; name: string; price: number; images: string[] | null }>();
    for (const p of products ?? []) {
      productById.set(p.id, {
        id: p.id,
        name: p.name,
        price: Number(p.price),
        images: (p.images as unknown as string[] | null) ?? null,
      });
    }

    // Build enriched order items
    const enrichedItems = cleanItems.map((i) => {
      const p = productById.get(i.productId);
      if (!p) return null;
      return {
        productId: p.id,
        name: p.name,
        image: p.images?.[0] ?? null,
        price: Number(p.price),
        quantity: i.quantity,
      };
    });

    if (enrichedItems.some((x) => x === null)) {
      return new Response(JSON.stringify({ error: 'Some items are unavailable' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const itemsFinal = enrichedItems as Array<{ productId: string; name: string; image: string | null; price: number; quantity: number }>;

    const subtotal = itemsFinal.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const shippingCost = subtotal >= 2000 ? 0 : 100;
    const total = subtotal + shippingCost;

    const orderId = crypto.randomUUID();

    // Create order
    const { error: orderError } = await supabase.from('orders').insert([
      {
        id: orderId,
        user_id: body.userId ?? null,
        order_number: '',
        status: 'pending',
        payment_method: 'cod',
        payment_status: 'pending',
        subtotal,
        shipping_cost: shippingCost,
        discount: 0,
        total,
        shipping_name: name,
        shipping_phone: phone,
        shipping_street: address,
        shipping_city: 'N/A',
        shipping_district: 'N/A',
        shipping_postal_code: null,
        notes: null,
      },
    ]);

    if (orderError) throw orderError;

    // Create order items
    const { error: itemsError } = await supabase.from('order_items').insert(
      itemsFinal.map((i) => ({
        order_id: orderId,
        product_id: i.productId,
        product_name: i.name,
        product_image: i.image,
        price: i.price,
        quantity: i.quantity,
      }))
    );

    if (itemsError) throw itemsError;

    return new Response(
      JSON.stringify({
        orderId,
        subtotal,
        shippingCost,
        total,
        items: itemsFinal,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('place-order error:', err);
    return new Response(JSON.stringify({ error: 'Failed to place order' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
