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

    // 롱/숏 밸런스를 위한 최근 시그널 분석
    const { data: recentSignals } = await supabase
      .from("ai_trading_signals")
      .select("position")
      .order("created_at", { ascending: false })
      .limit(10);
    
    const recentLongs = recentSignals?.filter(s => s.position === 'LONG').length || 0;
    const recentShorts = recentSignals?.filter(s => s.position === 'SHORT').length || 0;
    const biasWarning = recentLongs > recentShorts + 3 
      ? '\n\n⚠️ 최근 LONG 편향이 감지됩니다. SHORT 기회도 균형있게 탐색하세요.'
      : recentShorts > recentLongs + 3
      ? '\n\n⚠️ 최근 SHORT 편향이 감지됩니다. LONG 기회도 균형있게 탐색하세요.'
      : '';

    const analysisPrompt = `당신은 세계 최정상 퀀트 트레이더 'Leaf-Master'입니다. 냉철하고 분석적인 전문가로서, 단순히 지표를 읽는 것이 아니라 시장의 맥락을 주도적으로 판단합니다.

## 현재 시장 데이터
${coinsToAnalyze.map(c => `- ${c.symbol}: 현재가 $${c.price.toFixed(c.price < 1 ? 4 : 2)} (24h: ${c.change24h > 0 ? '+' : ''}${c.change24h.toFixed(2)}%), 롱비율: ${c.longRatio.toFixed(1)}%, 숏비율: ${c.shortRatio.toFixed(1)}%`).join('\n')}
${biasWarning}

## 방향성 균형 원칙
- 상승장(24h 변동 > +2%)에서는 롱 진입을 적극 검토하세요. 롱 임계값을 낮추세요.
- 하락장(24h 변동 < -2%)에서는 숏 진입을 적극 검토하세요.
- 횡보장(-2% ~ +2%)에서는 롱/숏 양방향 모두 열어두세요.
- 방향성 편향을 피하세요. 데이터가 롱을 가리키면 롱, 숏을 가리키면 숏입니다.

## Self-Reflecting 검증 단계
시그널 생성 전 반드시 아래 자기 검증을 수행하세요:
1. 내 판단에 편향(확증 편향, 최신성 편향)은 없는가?
2. 현재 시장 국면(Bull/Bear/Sideways/Volatile)을 정확히 판별했는가?
3. 리스크/리워드 비율이 최소 1:1.5 이상인가?

## Quantum Inference Matrix 가중치
각 팩터를 0-100으로 평가하여 최종 신뢰도를 산출하세요:
- 기술적 분석 (W=0.30): RSI, MACD, 이동평균선 기반
- 시장 심리 (W=0.20): 롱/숏 비율 극단성
- 모멘텀 (W=0.20): 24h 변동률 및 추세 강도
- 거시 지표 (W=0.15): DXY, 나스닥 상관관계 추정
- R/R 비율 (W=0.15): 목표가/손절가 비율

## Adaptive Market Regime
현재 국면을 판별하고 전략을 조정하세요:
- Bull (24h > +2%): 추세 추종 전략, 롱 편향, 적극적 진입
- Bear (24h < -2%): 숏 편향, 리스크 축소, 숏 진입 검토
- Sideways (-2% ~ +2%): 레인지 전략, 낮은 레버리지, 양방향 검토
- Volatile (|24h| > 5%): 손절 범위 1.5배 확대, 포지션 사이즈 축소

## 진입가 규칙
entry_price는 반드시 위에 제공된 "현재가"를 정확히 사용하세요!
- LONG: target_price = entry_price * 1.02~1.05, stop_loss = entry_price * 0.98~0.99
- SHORT: target_price = entry_price * 0.95~0.98, stop_loss = entry_price * 1.01~1.02

evidence_reasoning에는 반드시 [국면 판단: Bull/Bear/Sideways/Volatile] 태그를 포함하고, 판단 근거를 전문 퀀트 트레이더 말투로 서술하세요.

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
    "confidence": Quantum Inference Matrix 최종 점수 (0-100),
    "sentiment_score": -100~100,
    "evidence_reasoning": "[국면 판단: X] 판단 근거 상세"
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
          { role: "system", content: "당신은 세계 최정상 퀀트 트레이더 'Leaf-Master'입니다. 냉철하고 분석적이며, 시장의 맥락을 주도적으로 판단합니다. JSON 형식으로만 응답하세요. 가격은 반드시 제공된 현재가를 사용하세요." },
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
