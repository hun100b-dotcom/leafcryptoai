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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { user_id, reset_type = 'all' } = await req.json();

    console.log("Starting data reset:", { user_id, reset_type });

    const results: Record<string, boolean> = {};

    // Reset AI positions and signals (함께진입)
    if (reset_type === 'ai_only' || reset_type === 'all') {
      // Delete AI managed positions
      const { error: managedError } = await supabase
        .from("ai_managed_positions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      results.ai_managed_positions = !managedError;
      if (managedError) console.error("Failed to delete ai_managed_positions:", managedError);

      // Delete all AI trading signals
      const { error: signalsError } = await supabase
        .from("ai_trading_signals")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      results.ai_trading_signals = !signalsError;
      if (signalsError) console.error("Failed to delete ai_trading_signals:", signalsError);

      // Delete AI advice history
      const { error: adviceError } = await supabase
        .from("ai_advice_history")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      results.ai_advice_history = !adviceError;
      if (adviceError) console.error("Failed to delete ai_advice_history:", adviceError);

      // Delete AI self reviews
      const { error: reviewsError } = await supabase
        .from("ai_self_reviews")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      results.ai_self_reviews = !reviewsError;
      if (reviewsError) console.error("Failed to delete ai_self_reviews:", reviewsError);

      // Delete AI performance stats
      const { error: statsError } = await supabase
        .from("ai_performance_stats")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      results.ai_performance_stats = !statsError;
      if (statsError) console.error("Failed to delete ai_performance_stats:", statsError);
    }

    // Reset manual user positions (직접진입)
    if (reset_type === 'manual_only' || reset_type === 'all') {
      const { error: userPosError } = await supabase
        .from("user_positions")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      results.user_positions = !userPosError;
      if (userPosError) console.error("Failed to delete user_positions:", userPosError);
    }

    console.log("Data reset completed:", results);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Data reset completed (type: ${reset_type})`,
        deleted: results
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Reset data error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
