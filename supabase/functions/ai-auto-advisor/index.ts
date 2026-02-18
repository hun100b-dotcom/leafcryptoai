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

    // 2. Binance에서 시장 데이터 + Anomaly Detection용 확장 데이터
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT",
      "ADAUSDT", "AVAXUSDT", "DOTUSDT", "MATICUSDT", "LINKUSDT",
      "UNIUSDT", "ATOMUSDT", "NEARUSDT", "APTUSDT", "ARBUSDT",
      "OPUSDT", "INJUSDT", "SUIUSDT", "TIAUSDT", "SEIUSDT"];
    
    const marketDataPromises = symbols.map(async (symbol) => {
      try {
        const [priceRes, ratioRes] = await Promise.all([
          fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`),
          fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`)
        ]);
        
        const priceData = await priceRes.json();
        const ratioData = await ratioRes.json();
        
        return {
          symbol: symbol.replace("USDT", ""),
          price: parseFloat(priceData.lastPrice || priceData.price || '0'),
          change24h: parseFloat(priceData.priceChangePercent || '0'),
          volume: parseFloat(priceData.volume || '0'),
          quoteVolume: parseFloat(priceData.quoteVolume || '0'),
          highPrice: parseFloat(priceData.highPrice || '0'),
          lowPrice: parseFloat(priceData.lowPrice || '0'),
          longRatio: ratioData[0] ? parseFloat(ratioData[0].longAccount) * 100 : 50,
        };
      } catch {
        return null;
      }
    });

    const rawMarketData = await Promise.all(marketDataPromises);
    const marketData = rawMarketData.filter(m => m && m.price > 0) as NonNullable<typeof rawMarketData[0]>[];

    // 3. Anomaly Detection System
    const anomalies: any[] = [];
    
    for (const data of marketData) {
      // 급등/급락 감지 (5% 이상)
      if (Math.abs(data.change24h) >= 5) {
        anomalies.push({
          symbol: data.symbol,
          type: data.change24h > 0 ? "PRICE_SURGE" : "PRICE_CRASH",
          severity: Math.abs(data.change24h) >= 10 ? "CRITICAL" : "HIGH",
          detail: `${data.change24h > 0 ? '급등' : '급락'} ${data.change24h.toFixed(2)}%`,
          price: data.price,
        });
      }
      
      // 극단적 롱/숏 비율 (과매수/과매도)
      if (data.longRatio >= 72 || data.longRatio <= 28) {
        anomalies.push({
          symbol: data.symbol,
          type: data.longRatio >= 72 ? "EXTREME_LONG_BIAS" : "EXTREME_SHORT_BIAS",
          severity: (data.longRatio >= 80 || data.longRatio <= 20) ? "CRITICAL" : "HIGH",
          detail: `롱비율 ${data.longRatio.toFixed(1)}% - ${data.longRatio >= 72 ? '과매수 청산 위험' : '과매도 반등 가능'}`,
          price: data.price,
        });
      }

      // 변동성 이상 (일중 변동폭이 가격의 8% 이상)
      if (data.highPrice > 0 && data.lowPrice > 0) {
        const intraRange = (data.highPrice - data.lowPrice) / data.lowPrice * 100;
        if (intraRange >= 8) {
          anomalies.push({
            symbol: data.symbol,
            type: "VOLATILITY_ANOMALY",
            severity: intraRange >= 15 ? "CRITICAL" : "HIGH",
            detail: `일중 변동폭 ${intraRange.toFixed(1)}% - 대규모 청산 발생 가능`,
            price: data.price,
          });
        }
      }
    }

    // 4. 활성 포지션 위험도 체크
    const positionRisks: any[] = [];
    if (activeSignals && activeSignals.length > 0) {
      for (const signal of activeSignals) {
        const currentData = marketData.find(m => m.symbol === signal.symbol);
        if (!currentData) continue;

        const currentPrice = currentData.price;
        const entryPrice = signal.entry_price;
        const stopLoss = signal.stop_loss;
        
        // SL 근접 경고 (SL까지 거리가 전체의 30% 이하)
        const slDistance = Math.abs(currentPrice - stopLoss);
        const totalRange = Math.abs(entryPrice - stopLoss);
        if (totalRange > 0 && slDistance / totalRange < 0.3) {
          positionRisks.push({
            symbol: signal.symbol,
            type: "SL_PROXIMITY",
            detail: `${signal.position} 포지션 손절가 근접! 현재가 $${currentPrice.toLocaleString()} → SL $${stopLoss}`,
          });
        }
      }
    }

    if (!geminiApiKey) {
      // 로컬 폴백: API 없이도 anomaly 기반 긴급 알림은 생성
      if (anomalies.filter(a => a.severity === 'CRITICAL').length > 0) {
        const criticalAnomaly = anomalies.find(a => a.severity === 'CRITICAL')!;
        await supabase.from("ai_advice_history").insert({
          symbol: criticalAnomaly.symbol,
          advice_type: "URGENT",
          advice_content: `🚨 [Anomaly Detection] ${criticalAnomaly.symbol}: ${criticalAnomaly.detail}. 즉시 포지션 점검 필요.`,
          confidence: 85,
          is_urgent: true,
          urgency_reason: criticalAnomaly.detail,
          triggered_by: "ANOMALY_DETECTION",
          price_at_time: criticalAnomaly.price,
        });
      }
      return new Response(JSON.stringify({ message: "Local anomaly check done", anomalies }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 5. AI 조언 생성 (강화된 프롬프트)
    const topMarketData = marketData.slice(0, 10); // 상위 10개만 프롬프트에
    const advicePrompt = `당신은 암호화폐 선물 트레이딩 시스템의 중앙 통합 로직 엔진 'Leaf-Master'입니다.

## 현재 시장 상황 (바이낸스 상위 종목 전수 조사)
${topMarketData.map(d => `- ${d.symbol}: $${d.price.toLocaleString()} (24h: ${d.change24h > 0 ? '+' : ''}${d.change24h.toFixed(2)}%), 롱비율: ${d.longRatio.toFixed(1)}%`).join('\n')}

## 활성 포지션
${activeSignals && activeSignals.length > 0 
  ? activeSignals.map(s => `- ${s.symbol} ${s.position} (진입: $${s.entry_price}, TP: $${s.target_price}, SL: $${s.stop_loss}, ${s.leverage}x)`).join('\n')
  : '현재 활성 포지션 없음'}

## Anomaly Detection 결과
${anomalies.length > 0 
  ? anomalies.map(a => `- [${a.severity}] ${a.symbol}: ${a.type} - ${a.detail}`).join('\n')
  : '특이사항 없음'}

## 포지션 위험 경고
${positionRisks.length > 0
  ? positionRisks.map(r => `- ⚠️ ${r.symbol}: ${r.detail}`).join('\n')
  : '포지션 위험 없음'}

## 작성할 조언
1. Anomaly 감지 시 즉시 긴급 경고 (is_urgent: true)
2. 포지션 위험 경고가 있으면 우선 보고
3. 시장 전반 분석 및 대응 전략
4. 과거 유사 패턴과의 비교 (있는 경우 "과거 로그와 유사한 구조" 언급)

신뢰도를 0-100으로 산출하여 제시하세요. 간결하고 실전적인 조언을 제공하세요.`;

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
            content: "당신은 'Leaf-Master' - 냉철한 시니어 퀀트 트레이더 AI입니다. Anomaly Detection 결과를 최우선으로 처리하고, 선제적으로 개입하여 리스크를 경고합니다. JSON tool call로 응답하세요." 
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
                    enum: ["HOLD", "WARNING", "EVENT", "URGENT"],
                    description: "조언 유형 (Anomaly 감지 시 URGENT)" 
                  },
                  advice_content: { type: "string", description: "조언 내용 (신뢰도 포함)" },
                  confidence: { type: "number", description: "확신도 (0-100)" },
                  is_urgent: { type: "boolean", description: "긴급 여부 (Anomaly 감지 시 true)" },
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
      return new Response(JSON.stringify({ message: "No advice generated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const advice = JSON.parse(toolCall.function.arguments);
    console.log("AI advice generated:", advice);

    // 6. 중복 체크 후 저장
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentAdvice } = await supabase
      .from("ai_advice_history")
      .select("id")
      .eq("symbol", advice.symbol)
      .gte("created_at", tenMinutesAgo)
      .limit(1);

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
          triggered_by: anomalies.length > 0 ? "ANOMALY_DETECTION" : positionRisks.length > 0 ? "SL_PROXIMITY" : "CRON",
          price_at_time: symbolPrice,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({ 
        success: true, 
        advice: savedAdvice,
        anomalies,
        positionRisks,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      message: "Recent advice exists, skipping",
      anomalies,
      positionRisks,
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
