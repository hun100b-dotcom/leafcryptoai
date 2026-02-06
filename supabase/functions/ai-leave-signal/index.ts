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
    const { position_id, user_id } = await req.json();

    if (!position_id || !user_id) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the position with signal data
    const { data: position, error: posError } = await supabase
      .from("ai_managed_positions")
      .select(`
        *,
        ai_trading_signals (
          symbol,
          position,
          entry_price
        )
      `)
      .eq("id", position_id)
      .eq("user_id", user_id)
      .eq("status", "ACTIVE")
      .single();

    if (posError || !position) {
      return new Response(
        JSON.stringify({ error: "Position not found or not active" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get current price from Binance
    const symbol = position.ai_trading_signals?.symbol + "USDT";
    const priceRes = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`);
    const priceData = await priceRes.json();
    const currentPrice = parseFloat(priceData.price);

    // Calculate PnL
    const entryPrice = position.entry_price;
    const isLong = position.ai_trading_signals?.position === "LONG";
    const pnlPercent = isLong
      ? ((currentPrice - entryPrice) / entryPrice) * 100
      : ((entryPrice - currentPrice) / entryPrice) * 100;

    // Update position to cancelled
    const { error: updateError } = await supabase
      .from("ai_managed_positions")
      .update({
        status: "CANCELLED",
        close_price: currentPrice,
        current_pnl: pnlPercent,
        closed_at: new Date().toISOString(),
      })
      .eq("id", position_id);

    if (updateError) {
      console.error("Failed to update position:", updateError);
      throw updateError;
    }

    console.log("User left signal:", { 
      position_id, 
      user_id, 
      close_price: currentPrice, 
      pnl: pnlPercent.toFixed(2) + "%" 
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        close_price: currentPrice,
        pnl_percent: pnlPercent 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("AI Leave Signal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
