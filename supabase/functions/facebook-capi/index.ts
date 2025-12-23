import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ConversionEvent {
  event_name: string;
  event_time: number;
  action_source: string;
  event_source_url?: string;
  user_data: {
    em?: string[];
    ph?: string[];
    fn?: string[];
    ln?: string[];
    client_ip_address?: string;
    client_user_agent?: string;
    fbc?: string;
    fbp?: string;
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_type?: string;
    num_items?: number;
    order_id?: string;
  };
}

interface RequestBody {
  event_name: string;
  user_data: {
    email?: string;
    phone?: string;
    first_name?: string;
    last_name?: string;
  };
  custom_data?: {
    currency?: string;
    value?: number;
    content_ids?: string[];
    content_type?: string;
    num_items?: number;
    order_id?: string;
  };
  event_source_url?: string;
}

// Hash function for user data (SHA-256)
async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch CAPI settings from admin_settings
    const { data: settings } = await supabaseClient
      .from("admin_settings")
      .select("key, value")
      .in("key", ["fb_pixel_id", "fb_capi_token", "fb_capi_enabled", "fb_test_event_code"]);

    let pixelId = "";
    let capiToken = "";
    let capiEnabled = false;
    let testEventCode = "";

    settings?.forEach((setting: { key: string; value: string }) => {
      switch (setting.key) {
        case "fb_pixel_id":
          pixelId = setting.value;
          break;
        case "fb_capi_token":
          capiToken = setting.value;
          break;
        case "fb_capi_enabled":
          capiEnabled = setting.value === "true";
          break;
        case "fb_test_event_code":
          testEventCode = setting.value;
          break;
      }
    });

    if (!capiEnabled || !pixelId || !capiToken) {
      console.log("CAPI not enabled or missing credentials");
      return new Response(
        JSON.stringify({ success: false, message: "CAPI not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: RequestBody = await req.json();
    console.log("Received CAPI event:", body.event_name);

    // Build user data with hashing
    const userData: ConversionEvent["user_data"] = {
      client_ip_address: req.headers.get("x-forwarded-for") || req.headers.get("cf-connecting-ip") || undefined,
      client_user_agent: req.headers.get("user-agent") || undefined,
    };

    if (body.user_data.email) {
      userData.em = [await hashData(body.user_data.email)];
    }
    if (body.user_data.phone) {
      // Remove non-digits and hash
      const cleanPhone = body.user_data.phone.replace(/\D/g, "");
      userData.ph = [await hashData(cleanPhone)];
    }
    if (body.user_data.first_name) {
      userData.fn = [await hashData(body.user_data.first_name)];
    }
    if (body.user_data.last_name) {
      userData.ln = [await hashData(body.user_data.last_name)];
    }

    // Build the event
    const event: ConversionEvent = {
      event_name: body.event_name,
      event_time: Math.floor(Date.now() / 1000),
      action_source: "website",
      event_source_url: body.event_source_url,
      user_data: userData,
    };

    if (body.custom_data) {
      event.custom_data = body.custom_data;
    }

    // Build request payload
    const payload: { data: ConversionEvent[]; test_event_code?: string } = {
      data: [event],
    };

    if (testEventCode) {
      payload.test_event_code = testEventCode;
    }

    console.log("Sending to Facebook CAPI:", JSON.stringify(payload, null, 2));

    // Send to Facebook Conversions API
    const fbResponse = await fetch(
      `https://graph.facebook.com/v18.0/${pixelId}/events?access_token=${capiToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const fbResult = await fbResponse.json();
    console.log("Facebook CAPI response:", fbResult);

    if (!fbResponse.ok) {
      console.error("Facebook CAPI error:", fbResult);
      return new Response(
        JSON.stringify({ success: false, error: fbResult }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, result: fbResult }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("CAPI error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
