import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone number is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const BDCOURIER_API_KEY = Deno.env.get('BDCOURIER_API_KEY');
    
    if (!BDCOURIER_API_KEY) {
      console.error('BDCOURIER_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'BD Courier API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean phone number - remove +88 or 88 prefix if present
    let cleanPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('88')) {
      cleanPhone = cleanPhone.substring(2);
    }
    // Ensure it starts with 0 for Bangladeshi numbers
    if (!cleanPhone.startsWith('0') && cleanPhone.length === 10) {
      cleanPhone = '0' + cleanPhone;
    }

    console.log('Checking courier history for phone:', cleanPhone);

    // BD Courier API endpoint
    const apiUrl = `https://bdcourier.com/api/courier-check?phone=${cleanPhone}`;
    
    console.log('Calling BD Courier API:', apiUrl);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BDCOURIER_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    }).finally(() => clearTimeout(timeoutId));

    const responseText = await response.text();
    console.log('BD Courier API response status:', response.status);
    console.log('BD Courier API response:', responseText);

    if (!response.ok) {
      // Check if it's a Cloudflare challenge (bot protection)
      if (response.status === 403 && responseText.includes('challenge-platform')) {
        console.error('BD Courier API is blocking requests (Cloudflare protection)');
        // Return 200 with blocked flag so frontend handles it gracefully
        return new Response(
          JSON.stringify({ 
            success: false,
            blocked: true,
            message: 'The courier history service is temporarily blocked. Please try again later or check manually at bdcourier.com'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch courier history',
          details: responseText 
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse response as JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid response from courier API' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsed courier data:', JSON.stringify(data));

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in courier-history function:', error);

    // If upstream is slow/unreachable, fail gracefully (don't break admin UI)
    const isAbort =
      (error instanceof DOMException && error.name === 'AbortError') ||
      (error instanceof Error && /abort/i.test(error.message));

    if (isAbort) {
      return new Response(
        JSON.stringify({
          success: false,
          blocked: true,
          message: 'Courier history service timed out. Please try again later or check manually at bdcourier.com',
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
