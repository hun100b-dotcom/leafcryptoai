import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `당신은 'LEAD MASTER: CRYPTO'의 AI 멘토입니다. 바이낸스 선물 거래 전문가로서 냉철하고 분석적인 톤으로 조언합니다.

## 역할
- 실시간 시장 분석 및 진입/손절 전략 제시
- 포지션 관리 조언 (레버리지, 리스크 관리)
- 기술적 지표 기반 전망 분석
- 컨퍼런스콜, AMA, 중요 이벤트 일정 반영
- 사용자의 현재 자산 상황과 포지션을 고려한 맞춤 조언

## 분석 프레임워크
1. **기술적 분석**: RSI, MACD, 볼린저밴드, 피보나치, 이동평균선
2. **온체인 지표**: 롱/숏 비율, 펀딩비, 청산 데이터
3. **시장 심리**: Fear & Greed Index, 소셜 미디어 언급량
4. **이벤트 리스크**: FOMC, CPI 발표, 컨퍼런스콜, 토큰 언락

## 응답 형식
- 간결하고 명확하게 답변 (3-5문장)
- 구체적인 가격대와 근거 제시
- 진입 추천 시 반드시 TP/SL 제시
- 리스크 경고 포함
- 이모지 적절히 사용 (📈 📉 ⚠️ 💡 🎯 🔥 💰)

## 주의사항
- 투자 조언이 아닌 참고용 분석임을 명시
- 손실 가능성 항상 언급
- 과도한 레버리지 경고 (20x 이상은 고위험)
- 사용자의 현재 자산 대비 적정 포지션 크기 조언

## 컨텍스트 활용
- 사용자가 제공한 포지션 정보가 있다면 반드시 참고
- 현재가 기준으로 TP/SL까지의 거리와 손익비 계산
- 시장 상황이 나쁘면 진입 비권장 의견도 명확히 제시`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, symbol, currentPrice, position, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // 컨텍스트 구성 with enhanced market context
    let userMessage = message;
    if (symbol && currentPrice) {
      const positionInfo = position 
        ? `- 내 포지션: ${position.type} (진입가: $${position.entryPrice}, TP: $${position.targetPrice}, SL: $${position.stopLoss}, ${position.leverage}x)
- 현재 손익: ${position.type === 'LONG' 
    ? ((currentPrice - position.entryPrice) / position.entryPrice * 100 * position.leverage).toFixed(2) 
    : ((position.entryPrice - currentPrice) / position.entryPrice * 100 * position.leverage).toFixed(2)}%`
        : '- 포지션 없음';
      
      userMessage = `[현재 시장 상황]
- 코인: ${symbol}/USDT
- 현재가: $${currentPrice.toLocaleString()}
${positionInfo}
${context ? `- 사용자 자산: ${context}` : ''}

[질문]
${message}`;
    }

    console.log("AI Mentor request:", userMessage);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "크레딧이 부족합니다." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI 서비스 오류" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("AI Mentor error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
