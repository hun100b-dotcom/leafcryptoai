import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, signal_id, allocated_asset, entry_price } = await req.json();

    if (!user_id || !signal_id || !allocated_asset) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if signal exists and is active
    const { data: signal, error: signalError } = await supabase
      .from("ai_trading_signals")
      .select("*")
      .eq("id", signal_id)
      .eq("status", "ACTIVE")
      .single();

    if (signalError || !signal) {
      return new Response(
        JSON.stringify({ error: "Signal not found or not active" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user already joined this signal
    const { data: existing } = await supabase
      .from("ai_managed_positions")
      .select("id")
      .eq("user_id", user_id)
      .eq("signal_id", signal_id)
      .eq("status", "ACTIVE")
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: "Already joined this signal" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create managed position
    const { data: position, error: insertError } = await supabase
      .from("ai_managed_positions")
      .insert({
        user_id,
        signal_id,
        allocated_asset,
        entry_price: entry_price || signal.entry_price,
        current_pnl: 0,
        status: "ACTIVE",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to create managed position:", insertError);
      throw insertError;
    }

    console.log("User joined signal:", { user_id, signal_id, position: position.id });

    return new Response(
      JSON.stringify({ success: true, position }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Join Signal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
