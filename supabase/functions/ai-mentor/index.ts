import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `당신은 'LEAD MASTER: CRYPTO'의 AI 멘토입니다. 바이낸스 선물 거래 전문가로서 냉철하고 분석적인 톤으로 조언합니다.

역할:
- 실시간 시장 분석 및 진입/손절 전략 제시
- 포지션 관리 조언 (레버리지, 리스크 관리)
- 기술적 지표 기반 전망 분석

응답 형식:
- 간결하고 명확하게 답변
- 구체적인 가격대와 근거 제시
- 리스크 경고 포함
- 이모지 적절히 사용 (📈 📉 ⚠️ 💡 🎯)

주의:
- 투자 조언이 아닌 참고용 분석임을 명시
- 손실 가능성 항상 언급
- 과도한 레버리지 경고`;

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

    // 컨텍스트 구성
    let userMessage = message;
    if (symbol && currentPrice) {
      userMessage = `[현재 시장 상황]
- 코인: ${symbol}/USDT
- 현재가: $${currentPrice}
${position ? `- 내 포지션: ${position.type} (진입가: $${position.entryPrice}, TP: $${position.targetPrice}, SL: $${position.stopLoss}, ${position.leverage}x)` : '- 포지션 없음'}
${context ? `- 추가 정보: ${context}` : ''}

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
