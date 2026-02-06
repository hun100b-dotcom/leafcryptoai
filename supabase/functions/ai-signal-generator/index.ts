import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
}

interface LongShortRatio {
  longShortRatio: string;
  longAccount: string;
  shortAccount: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Binance에서 현재 가격 및 롱/숏 비율 가져오기
    const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "XRPUSDT", "DOGEUSDT"];
    
    const pricePromises = symbols.map(async (symbol) => {
      try {
        const [priceRes, ratioRes] = await Promise.all([
          fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}`),
          fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}&period=5m&limit=1`)
        ]);
        
        const priceData: BinanceTicker = await priceRes.json();
        const ratioData: LongShortRatio[] = await ratioRes.json();
        
        // lastPrice 필드 사용 (price가 아님)
        const price = parseFloat(priceData.lastPrice);
        const change24h = parseFloat(priceData.priceChangePercent);
        
        console.log(`${symbol} price data:`, { lastPrice: priceData.lastPrice, priceChangePercent: priceData.priceChangePercent });
        
        return {
          symbol: symbol.replace("USDT", ""),
          price: isNaN(price) ? 0 : price,
          change24h: isNaN(change24h) ? 0 : change24h,
          longRatio: ratioData[0] ? parseFloat(ratioData[0].longAccount) * 100 : 50,
          shortRatio: ratioData[0] ? parseFloat(ratioData[0].shortAccount) * 100 : 50,
        };
      } catch (err) {
        console.error(`Error fetching ${symbol}:`, err);
        return {
          symbol: symbol.replace("USDT", ""),
          price: 0,
          change24h: 0,
          longRatio: 50,
          shortRatio: 50,
        };
      }
    });

    const marketData = await Promise.all(pricePromises);
    
    // 가격이 0인 코인 필터링
    const validMarketData = marketData.filter(m => m.price > 0);
    console.log("Valid market data:", validMarketData);

    if (validMarketData.length === 0) {
      console.error("No valid market data available");
      return new Response(JSON.stringify({ error: "No valid market data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. 현재 활성화된 시그널 확인
    const { data: activeSignals } = await supabase
      .from("ai_trading_signals")
      .select("symbol")
      .eq("status", "ACTIVE");

    const activeSymbols = new Set(activeSignals?.map(s => s.symbol) || []);

    // 3. AI를 사용하여 시그널 생성 판단
    if (!lovableApiKey) {
      console.log("LOVABLE_API_KEY not configured, skipping AI analysis");
      return new Response(JSON.stringify({ message: "AI key not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 활성 시그널이 없는 코인 중 분석
    const coinsToAnalyze = validMarketData.filter(m => !activeSymbols.has(m.symbol));
    
    if (coinsToAnalyze.length === 0) {
      console.log("All coins have active signals, skipping");
      return new Response(JSON.stringify({ message: "All coins have active signals" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 각 코인의 현재가 맵 생성 (AI 응답 검증용)
    const priceMap = Object.fromEntries(validMarketData.map(m => [m.symbol, m.price]));

    const analysisPrompt = `당신은 전문 암호화폐 선물 트레이더입니다. 다음 시장 데이터를 분석하고 진입할 가치가 있는 포지션이 있는지 판단하세요.

시장 데이터:
${coinsToAnalyze.map(c => `- ${c.symbol}: 현재가 $${c.price.toFixed(c.price < 1 ? 4 : 2)} (24h: ${c.change24h > 0 ? '+' : ''}${c.change24h.toFixed(2)}%), 롱비율: ${c.longRatio.toFixed(1)}%, 숏비율: ${c.shortRatio.toFixed(1)}%`).join('\n')}

분석 기준:
1. 24시간 변동률이 ±3% 이상이면 모멘텀 신호
2. 롱/숏 비율이 극단적(>65% 또는 <35%)이면 반전 가능성
3. 급격한 가격 변동(±5% 이상)은 긴급 알림 대상

중요: entry_price는 반드시 위에 제공된 "현재가"를 정확히 사용하세요!
- LONG 포지션: target_price = entry_price * 1.02~1.05, stop_loss = entry_price * 0.98~0.99
- SHORT 포지션: target_price = entry_price * 0.95~0.98, stop_loss = entry_price * 1.01~1.02

응답 형식 (JSON):
{
  "should_create_signal": true/false,
  "is_urgent": true/false,
  "urgency_reason": "긴급 사유 (있는 경우)",
  "signal": {
    "symbol": "BTC",
    "position": "LONG" 또는 "SHORT",
    "entry_price": 위에서 제공된 현재가,
    "target_price": 목표가,
    "stop_loss": 손절가,
    "leverage": 1-10,
    "confidence": 50-100,
    "sentiment_score": -100~100,
    "evidence_reasoning": "진입 근거 설명"
  }
}

시그널을 생성하지 않을 경우: {"should_create_signal": false}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "당신은 냉철하고 분석적인 암호화폐 선물 트레이더입니다. JSON 형식으로만 응답하세요. 가격은 반드시 제공된 현재가를 사용하세요." },
          { role: "user", content: analysisPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_trading_signal",
              description: "새로운 트레이딩 시그널을 생성합니다",
              parameters: {
                type: "object",
                properties: {
                  should_create_signal: { type: "boolean" },
                  is_urgent: { type: "boolean" },
                  urgency_reason: { type: "string" },
                  signal: {
                    type: "object",
                    properties: {
                      symbol: { type: "string" },
                      position: { type: "string", enum: ["LONG", "SHORT"] },
                      entry_price: { type: "number" },
                      target_price: { type: "number" },
                      stop_loss: { type: "number" },
                      leverage: { type: "number" },
                      confidence: { type: "number" },
                      sentiment_score: { type: "number" },
                      evidence_reasoning: { type: "string" }
                    }
                  }
                },
                required: ["should_create_signal"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_trading_signal" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiResult));

    // Tool call 결과 파싱
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      console.log("No tool call in response");
      return new Response(JSON.stringify({ message: "No signal generated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const decision = JSON.parse(toolCall.function.arguments);
    console.log("AI decision:", decision);

    if (!decision.should_create_signal || !decision.signal) {
      console.log("AI decided not to create signal");
      return new Response(JSON.stringify({ message: "AI decided not to create signal" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. AI 응답 가격 검증 및 수정
    const signal = decision.signal;
    const actualPrice = priceMap[signal.symbol];
    
    if (!actualPrice || actualPrice <= 0) {
      console.error(`Invalid price for symbol ${signal.symbol}`);
      return new Response(JSON.stringify({ error: `Invalid price for ${signal.symbol}` }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI가 잘못된 가격을 제시한 경우 실제 가격으로 교정
    let entryPrice = signal.entry_price;
    let targetPrice = signal.target_price;
    let stopLoss = signal.stop_loss;

    if (entryPrice <= 0 || Math.abs(entryPrice - actualPrice) / actualPrice > 0.1) {
      console.log(`Correcting entry price from ${entryPrice} to ${actualPrice}`);
      entryPrice = actualPrice;
      
      // 포지션에 따라 TP/SL 재계산
      if (signal.position === "LONG") {
        targetPrice = actualPrice * 1.03; // +3%
        stopLoss = actualPrice * 0.985;   // -1.5%
      } else {
        targetPrice = actualPrice * 0.97; // -3%
        stopLoss = actualPrice * 1.015;   // +1.5%
      }
    }

    // TP/SL이 0이거나 비정상인 경우 재계산
    if (targetPrice <= 0 || stopLoss <= 0) {
      if (signal.position === "LONG") {
        targetPrice = entryPrice * 1.03;
        stopLoss = entryPrice * 0.985;
      } else {
        targetPrice = entryPrice * 0.97;
        stopLoss = entryPrice * 1.015;
      }
    }

    console.log("Final signal prices:", { entryPrice, targetPrice, stopLoss });

    // 5. 시그널 생성
    const { data: newSignal, error: insertError } = await supabase
      .from("ai_trading_signals")
      .insert({
        symbol: signal.symbol,
        position: signal.position,
        entry_price: entryPrice,
        target_price: targetPrice,
        stop_loss: stopLoss,
        leverage: signal.leverage || 1,
        confidence: signal.confidence || 50,
        sentiment_score: signal.sentiment_score,
        evidence_reasoning: signal.evidence_reasoning,
        is_urgent: decision.is_urgent || false,
        urgency_reason: decision.urgency_reason,
        highest_price_reached: entryPrice,
        lowest_price_reached: entryPrice,
        status: "ACTIVE",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Failed to insert signal:", insertError);
      throw insertError;
    }

    console.log("New signal created:", newSignal);

    // 6. 긴급 알림인 경우 ai_advice_history에도 기록
    if (decision.is_urgent) {
      await supabase.from("ai_advice_history").insert({
        symbol: signal.symbol,
        advice_type: "URGENT_SIGNAL",
        advice_content: `🚨 긴급 시그널: ${signal.symbol} ${signal.position} @ $${entryPrice.toLocaleString()}\n목표가: $${targetPrice.toLocaleString()} | 손절가: $${stopLoss.toLocaleString()}\n\n${signal.evidence_reasoning}`,
        is_urgent: true,
        urgency_reason: decision.urgency_reason,
        triggered_by: "AI_SIGNAL_GENERATOR",
        price_at_time: entryPrice,
        confidence: signal.confidence,
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      signal: newSignal,
      is_urgent: decision.is_urgent 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Signal Generator error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
