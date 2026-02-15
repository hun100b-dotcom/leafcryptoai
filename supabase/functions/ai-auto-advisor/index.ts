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
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");
    const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. 활성화된 시그널과 현재 시장 상황 가져오기
    const { data: activeSignals } = await supabase
      .from("ai_trading_signals")
      .select("*")
      .eq("status", "ACTIVE");

    // 2. Binance에서 시장 데이터 가져오기
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];
    const marketDataPromises = symbols.map(async (symbol) => {
      const [priceRes, ratioRes] = await Promise.all([
        fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`),
        fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`)
      ]);
      
      const priceData = await priceRes.json();
      const ratioData = await ratioRes.json();
      
      return {
        symbol: symbol.replace("USDT", ""),
        price: parseFloat(priceData.price),
        change24h: parseFloat(priceData.priceChangePercent),
        volume: parseFloat(priceData.volume),
        longRatio: ratioData[0] ? parseFloat(ratioData[0].longAccount) * 100 : 50,
      };
    });

    const marketData = await Promise.all(marketDataPromises);

    // 3. 급격한 변동 감지 (이벤트 기반 긴급 알림)
    const urgentConditions: any[] = [];
    
    for (const data of marketData) {
      if (Math.abs(data.change24h) >= 5) {
        urgentConditions.push({
          symbol: data.symbol,
          type: data.change24h > 0 ? "급등" : "급락",
          change: data.change24h,
          price: data.price,
        });
      }
      
      if (data.longRatio >= 70 || data.longRatio <= 30) {
        urgentConditions.push({
          symbol: data.symbol,
          type: data.longRatio >= 70 ? "과매수" : "과매도",
          ratio: data.longRatio,
          price: data.price,
        });
      }
    }

    if (!geminiApiKey) {
      console.log("GEMINI_API_KEY not configured");
      return new Response(JSON.stringify({ message: "AI key not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. AI 조언 생성
    const advicePrompt = `당신은 암호화폐 선물 트레이더 AI 멘토입니다. 현재 시장 상황을 분석하고 조언을 제공하세요.

## 현재 시장 상황
${marketData.map(d => `- ${d.symbol}: $${d.price.toLocaleString()} (24h: ${d.change24h > 0 ? '+' : ''}${d.change24h.toFixed(2)}%), 롱비율: ${d.longRatio.toFixed(1)}%`).join('\n')}

## 활성 포지션
${activeSignals && activeSignals.length > 0 
  ? activeSignals.map(s => `- ${s.symbol} ${s.position} (진입: $${s.entry_price}, TP: $${s.target_price}, SL: $${s.stop_loss})`).join('\n')
  : '현재 활성 포지션 없음'}

## 감지된 이상 징후
${urgentConditions.length > 0 
  ? urgentConditions.map(c => `- ${c.symbol}: ${c.type} (${c.change ? `${c.change.toFixed(2)}%` : `롱비율 ${c.ratio?.toFixed(1)}%`})`).join('\n')
  : '특이사항 없음'}

## 작성할 조언
1. 현재 시장 상황에 대한 짧은 분석
2. 활성 포지션에 대한 관리 조언 (있는 경우)
3. 주의해야 할 리스크

간결하고 실전적인 조언을 제공하세요.`;

    const aiResponse = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${geminiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
        messages: [
          { 
            role: "system", 
            content: "당신은 냉철한 암호화폐 선물 트레이더 AI입니다. 간결하고 실전적인 조언을 제공합니다." 
          },
          { role: "user", content: advicePrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_advice",
              description: "시장 조언을 생성합니다",
              parameters: {
                type: "object",
                properties: {
                  symbol: { type: "string", description: "주요 대상 코인" },
                  advice_type: { 
                    type: "string", 
                    enum: ["HOLD", "WARNING", "EVENT"],
                    description: "조언 유형" 
                  },
                  advice_content: { type: "string", description: "조언 내용" },
                  confidence: { type: "number", description: "확신도 (50-100)" },
                  is_urgent: { type: "boolean", description: "긴급 여부" },
                  urgency_reason: { type: "string", description: "긴급 사유" }
                },
                required: ["symbol", "advice_type", "advice_content", "confidence", "is_urgent"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_advice" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      console.log("No tool call in response");
      return new Response(JSON.stringify({ message: "No advice generated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const advice = JSON.parse(toolCall.function.arguments);
    console.log("AI advice generated:", advice);

    // 5. 중복 체크 후 조언 저장
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentAdvice } = await supabase
      .from("ai_advice_history")
      .select("id")
      .eq("symbol", advice.symbol)
      .gte("created_at", tenMinutesAgo)
      .limit(1);

    // 긴급 알림이거나 최근 조언이 없으면 저장
    if (advice.is_urgent || !recentAdvice || recentAdvice.length === 0) {
      const symbolPrice = marketData.find(m => m.symbol === advice.symbol)?.price;
      
      const { data: savedAdvice, error: insertError } = await supabase
        .from("ai_advice_history")
        .insert({
          symbol: advice.symbol,
          advice_type: advice.is_urgent ? "URGENT" : advice.advice_type,
          advice_content: advice.advice_content,
          confidence: advice.confidence,
          is_urgent: advice.is_urgent,
          urgency_reason: advice.urgency_reason,
          triggered_by: urgentConditions.length > 0 ? "PRICE_SPIKE" : "CRON",
          price_at_time: symbolPrice,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      console.log("Advice saved:", savedAdvice.id);

      return new Response(JSON.stringify({ 
        success: true, 
        advice: savedAdvice,
        urgentConditions 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      message: "Recent advice exists, skipping",
      urgentConditions 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Auto Advisor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
