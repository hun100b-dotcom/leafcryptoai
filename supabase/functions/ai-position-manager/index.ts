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

    // 1. 활성화된 AI 시그널 가져오기
    const { data: activeSignals, error: fetchError } = await supabase
      .from("ai_trading_signals")
      .select("*")
      .eq("status", "ACTIVE");

    if (fetchError) throw fetchError;

    if (!activeSignals || activeSignals.length === 0) {
      console.log("No active signals to manage");
      return new Response(JSON.stringify({ message: "No active signals" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Managing ${activeSignals.length} active signals`);

    // 2. 각 시그널의 현재 가격 확인
    const symbols = [...new Set(activeSignals.map(s => s.symbol + "USDT"))];
    const pricePromises = symbols.map(async (symbol) => {
      const res = await fetch(`https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`);
      const data = await res.json();
      return { symbol: symbol.replace("USDT", ""), price: parseFloat(data.price) };
    });

    const prices = await Promise.all(pricePromises);
    const priceMap = new Map(prices.map(p => [p.symbol, p.price]));

    console.log("Current prices:", Object.fromEntries(priceMap));

    const results: any[] = [];
    const urgentAlerts: any[] = [];

    // 3. 각 시그널 상태 업데이트
    for (const signal of activeSignals) {
      const currentPrice = priceMap.get(signal.symbol);
      if (!currentPrice) continue;

      const isLong = signal.position === "LONG";
      let newStatus = "ACTIVE";
      let closePrice: number | null = null;
      let pnlPercent: number | null = null;

      // 목표가/손절가 도달 체크
      if (isLong) {
        if (currentPrice >= signal.target_price) {
          newStatus = "WIN";
          closePrice = currentPrice;
          pnlPercent = ((currentPrice - signal.entry_price) / signal.entry_price) * 100 * signal.leverage;
        } else if (currentPrice <= signal.stop_loss) {
          newStatus = "LOSS";
          closePrice = currentPrice;
          pnlPercent = ((currentPrice - signal.entry_price) / signal.entry_price) * 100 * signal.leverage;
        }
      } else {
        // SHORT
        if (currentPrice <= signal.target_price) {
          newStatus = "WIN";
          closePrice = currentPrice;
          pnlPercent = ((signal.entry_price - currentPrice) / signal.entry_price) * 100 * signal.leverage;
        } else if (currentPrice >= signal.stop_loss) {
          newStatus = "LOSS";
          closePrice = currentPrice;
          pnlPercent = ((signal.entry_price - currentPrice) / signal.entry_price) * 100 * signal.leverage;
        }
      }

      // 최고가/최저가 업데이트
      const highestPrice = Math.max(signal.highest_price_reached || signal.entry_price, currentPrice);
      const lowestPrice = Math.min(signal.lowest_price_reached || signal.entry_price, currentPrice);

      // 급격한 가격 변동 감지 (긴급 알림)
      const priceChangePercent = ((currentPrice - signal.entry_price) / signal.entry_price) * 100;
      const isUrgent = Math.abs(priceChangePercent) >= 3; // 3% 이상 변동

      if (isUrgent && newStatus === "ACTIVE") {
        const direction = priceChangePercent > 0 ? "상승" : "하락";
        urgentAlerts.push({
          symbol: signal.symbol,
          advice_type: "WARNING",
          advice_content: `⚠️ ${signal.symbol} ${direction} 알림: 진입가 대비 ${priceChangePercent.toFixed(2)}% 변동\n현재가: $${currentPrice.toLocaleString()}`,
          is_urgent: true,
          urgency_reason: `${Math.abs(priceChangePercent).toFixed(1)}% ${direction}`,
          triggered_by: "PRICE_SPIKE",
          price_at_time: currentPrice,
          confidence: signal.confidence,
        });
      }

      // 상태 업데이트
      const updateData: any = {
        highest_price_reached: highestPrice,
        lowest_price_reached: lowestPrice,
      };

      if (newStatus !== "ACTIVE") {
        updateData.status = newStatus;
        updateData.close_price = closePrice;
        updateData.pnl_percent = pnlPercent;
        updateData.closed_at = new Date().toISOString();

        console.log(`Signal ${signal.id} closed: ${newStatus} with PnL ${pnlPercent?.toFixed(2)}%`);
      }

      const { error: updateError } = await supabase
        .from("ai_trading_signals")
        .update(updateData)
        .eq("id", signal.id);

      if (updateError) {
        console.error(`Failed to update signal ${signal.id}:`, updateError);
      }

      // 함께 진입한 사용자 포지션도 업데이트
      if (newStatus !== "ACTIVE") {
        const { error: managedError } = await supabase
          .from("ai_managed_positions")
          .update({
            status: newStatus,
            close_price: closePrice,
            current_pnl: pnlPercent,
            closed_at: new Date().toISOString(),
          })
          .eq("signal_id", signal.id)
          .eq("status", "ACTIVE");

        if (managedError) {
          console.error(`Failed to update managed positions for signal ${signal.id}:`, managedError);
        }
      }

      results.push({
        signalId: signal.id,
        symbol: signal.symbol,
        status: newStatus,
        currentPrice,
        pnlPercent,
      });
    }

    // 4. 긴급 알림 저장 (중복 방지: 최근 5분 내 같은 알림 없으면)
    if (urgentAlerts.length > 0) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      
      for (const alert of urgentAlerts) {
        const { data: existing } = await supabase
          .from("ai_advice_history")
          .select("id")
          .eq("symbol", alert.symbol)
          .eq("is_urgent", true)
          .gte("created_at", fiveMinutesAgo)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("ai_advice_history").insert(alert);
          console.log(`Urgent alert created for ${alert.symbol}`);
        }
      }
    }

    // 5. 성과 통계 업데이트
    await updatePerformanceStats(supabase);

    return new Response(JSON.stringify({ 
      success: true, 
      results,
      urgentAlertsCount: urgentAlerts.length 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Position Manager error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function updatePerformanceStats(supabase: any) {
  try {
    // 전체 통계 계산
    const { data: allSignals } = await supabase
      .from("ai_trading_signals")
      .select("*")
      .in("status", ["WIN", "LOSS"]);

    if (!allSignals || allSignals.length === 0) return;

    const wins = allSignals.filter((s: any) => s.status === "WIN").length;
    const losses = allSignals.filter((s: any) => s.status === "LOSS").length;
    const totalPnl = allSignals.reduce((acc: number, s: any) => acc + (s.pnl_percent || 0), 0);
    const avgLeverage = allSignals.reduce((acc: number, s: any) => acc + s.leverage, 0) / allSignals.length;

    const pnlValues = allSignals.map((s: any) => s.pnl_percent || 0);
    const bestTrade = Math.max(...pnlValues);
    const worstTrade = Math.min(...pnlValues);

    // 평균 보유 시간 계산
    const holdTimes = allSignals
      .filter((s: any) => s.closed_at)
      .map((s: any) => {
        const created = new Date(s.created_at).getTime();
        const closed = new Date(s.closed_at).getTime();
        return (closed - created) / 1000 / 60; // minutes
      });
    const avgHoldTime = holdTimes.length > 0 
      ? Math.round(holdTimes.reduce((a, b) => a + b, 0) / holdTimes.length)
      : 0;

    // ALL_TIME 통계 upsert
    const { error } = await supabase
      .from("ai_performance_stats")
      .upsert({
        period_type: "ALL_TIME",
        period_start: new Date("2024-01-01").toISOString(),
        symbol: null,
        total_signals: allSignals.length,
        wins,
        losses,
        win_rate: wins / (wins + losses) * 100,
        total_pnl: totalPnl,
        avg_pnl: totalPnl / allSignals.length,
        avg_leverage: avgLeverage,
        best_trade_pnl: bestTrade,
        worst_trade_pnl: worstTrade,
        avg_hold_time_minutes: avgHoldTime,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: "period_type,period_start",
      });

    if (error) {
      console.error("Failed to update performance stats:", error);
    } else {
      console.log("Performance stats updated");
    }
  } catch (error) {
    console.error("Error updating performance stats:", error);
  }
}
