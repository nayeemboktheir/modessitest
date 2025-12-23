import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SteadfastOrderRequest {
  orderId: string;
  invoice: string;
  recipient_name: string;
  recipient_phone: string;
  recipient_address: string;
  cod_amount: number;
  note?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const STEADFAST_API_KEY = Deno.env.get('STEADFAST_API_KEY');
    const STEADFAST_SECRET_KEY = Deno.env.get('STEADFAST_SECRET_KEY');

    if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
      console.error('Steadfast credentials not configured');
      return new Response(
        JSON.stringify({ error: 'Steadfast credentials not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: SteadfastOrderRequest = await req.json();
    console.log('Creating Steadfast order for:', body.invoice);

    // Validate required fields
    if (!body.invoice || !body.recipient_name || !body.recipient_phone || !body.recipient_address || body.cod_amount === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call Steadfast API to create consignment
    const steadfastResponse = await fetch('https://portal.steadfast.com.bd/api/v1/create_order', {
      method: 'POST',
      headers: {
        'Api-Key': STEADFAST_API_KEY,
        'Secret-Key': STEADFAST_SECRET_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        invoice: body.invoice,
        recipient_name: body.recipient_name,
        recipient_phone: body.recipient_phone,
        recipient_address: body.recipient_address,
        cod_amount: body.cod_amount,
        note: body.note || '',
      }),
    });

    const steadfastData = await steadfastResponse.json();
    console.log('Steadfast API response:', steadfastData);

    if (!steadfastResponse.ok || steadfastData.status !== 200) {
      console.error('Steadfast API error:', steadfastData);
      return new Response(
        JSON.stringify({ 
          error: steadfastData.message || 'Failed to create Steadfast order',
          details: steadfastData.errors || steadfastData
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update order with tracking info in Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const consignmentId = steadfastData.consignment?.consignment_id;
    const trackingCode = steadfastData.consignment?.tracking_code;

    if (consignmentId && body.orderId) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ 
          tracking_number: trackingCode || consignmentId,
          status: 'processing'
        })
        .eq('id', body.orderId);

      if (updateError) {
        console.error('Failed to update order tracking:', updateError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Order sent to Steadfast successfully',
        consignment_id: consignmentId,
        tracking_code: trackingCode,
        data: steadfastData
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in steadfast-courier function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
