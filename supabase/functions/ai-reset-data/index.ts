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

    const { user_id } = await req.json();

    console.log("Starting data reset for user:", user_id);

    // 1. Delete AI managed positions (함께 진입)
    const { error: managedError } = await supabase
      .from("ai_managed_positions")
      .delete()
      .eq("user_id", user_id);

    if (managedError) {
      console.error("Failed to delete ai_managed_positions:", managedError);
    }

    // 2. Delete user positions (내 포지션)
    const { error: userPosError } = await supabase
      .from("user_positions")
      .delete()
      .eq("user_id", user_id);

    if (userPosError) {
      console.error("Failed to delete user_positions:", userPosError);
    }

    // 3. Delete all AI trading signals
    const { error: signalsError } = await supabase
      .from("ai_trading_signals")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all

    if (signalsError) {
      console.error("Failed to delete ai_trading_signals:", signalsError);
    }

    // 4. Delete AI advice history
    const { error: adviceError } = await supabase
      .from("ai_advice_history")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (adviceError) {
      console.error("Failed to delete ai_advice_history:", adviceError);
    }

    // 5. Delete AI self reviews
    const { error: reviewsError } = await supabase
      .from("ai_self_reviews")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (reviewsError) {
      console.error("Failed to delete ai_self_reviews:", reviewsError);
    }

    // 6. Delete AI performance stats
    const { error: statsError } = await supabase
      .from("ai_performance_stats")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (statsError) {
      console.error("Failed to delete ai_performance_stats:", statsError);
    }

    // 7. Reset user settings to initial asset (optional - keep initial asset)
    // We keep user_settings as is since they might want to keep their initial asset setting

    console.log("Data reset completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "All data has been reset",
        deleted: {
          ai_managed_positions: !managedError,
          user_positions: !userPosError,
          ai_trading_signals: !signalsError,
          ai_advice_history: !adviceError,
          ai_self_reviews: !reviewsError,
          ai_performance_stats: !statsError,
        }
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
