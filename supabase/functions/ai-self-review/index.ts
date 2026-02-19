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

    // 1. 종료된 시그널 가져오기 (최근 7일 또는 전체)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    const { data: recentSignals, error: fetchError } = await supabase
      .from("ai_trading_signals")
      .select("*")
      .in("status", ["WIN", "LOSS"])
      .gte("created_at", weekAgo)
      .order("created_at", { ascending: false });

    if (fetchError) throw fetchError;

    // 종료된 시그널이 없어도 전체 기록으로 복기
    if (!recentSignals || recentSignals.length === 0) {
      const { data: allSignals } = await supabase
        .from("ai_trading_signals")
        .select("*")
        .in("status", ["WIN", "LOSS"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (!allSignals || allSignals.length === 0) {
        console.log("No closed signals to review at all");
        return new Response(JSON.stringify({ message: "No signals to review" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      // Use all signals for review
      return await generateReview(supabase, allSignals, geminiApiKey!, GEMINI_API_URL, new Date(allSignals[allSignals.length - 1].created_at).toISOString(), now, corsHeaders);
    }

    console.log(`Reviewing ${recentSignals.length} signals from last 7 days`);

    return await generateReview(supabase, recentSignals, geminiApiKey!, GEMINI_API_URL, weekAgo, now, corsHeaders);

  } catch (error) {
    console.error("AI Self Review error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateReview(supabase: any, signals: any[], geminiApiKey: string, apiUrl: string, periodStart: string, periodEnd: string, corsHeaders: Record<string, string>) {
  const wins = signals.filter((s: any) => s.status === "WIN").length;
  const losses = signals.filter((s: any) => s.status === "LOSS").length;
  const winRate = (wins / signals.length) * 100;
  const totalPnl = signals.reduce((acc: number, s: any) => acc + (s.pnl_percent || 0), 0);

  const reviewPrompt = `당신은 암호화폐 선물 트레이더 AI입니다. 거래를 복기하고 자기 리뷰를 작성해주세요.

## 거래 결과 요약
- 총 거래: ${signals.length}건
- 승리: ${wins}건 / 패배: ${losses}건
- 승률: ${winRate.toFixed(1)}%
- 총 수익률: ${totalPnl.toFixed(2)}%

## 상세 거래 내역
${signals.slice(0, 15).map((s: any) => `
- ${s.symbol} ${s.position} (${s.leverage}x)
  진입: $${s.entry_price} → 청산: $${s.close_price}
  결과: ${s.status} (${s.pnl_percent?.toFixed(2)}%)
  근거: ${s.evidence_reasoning || '없음'}
`).join('\n')}

## 작성할 내용
1. 전반적인 거래 성과 평가
2. 잘한 점 (성공한 거래의 공통점)
3. 개선할 점 (실패한 거래의 원인 분석)
4. 배운 교훈 및 다음 전략 방향

냉철하고 분석적인 톤으로, 구체적인 개선 방안을 포함해 작성해주세요.`;

  const aiResponse = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${geminiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gemini-2.0-flash",
      messages: [
        { role: "system", content: "당신은 성찰하는 AI 트레이더입니다. 자신의 거래를 냉철하게 분석하고 교훈을 도출합니다." },
        { role: "user", content: reviewPrompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "create_self_review",
            description: "자기 리뷰를 작성합니다",
            parameters: {
              type: "object",
              properties: {
                review_content: { type: "string", description: "전체 리뷰 내용" },
                what_went_well: { type: "string", description: "잘한 점 요약" },
                what_to_improve: { type: "string", description: "개선할 점 요약" },
                lessons_learned: { type: "string", description: "배운 교훈 요약" }
              },
              required: ["review_content", "what_went_well", "what_to_improve", "lessons_learned"]
            }
          }
        }
      ],
      tool_choice: { type: "function", function: { name: "create_self_review" } }
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
    return new Response(JSON.stringify({ message: "Failed to generate review" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const review = JSON.parse(toolCall.function.arguments);

  const { data: savedReview, error: insertError } = await supabase
    .from("ai_self_reviews")
    .insert({
      period_start: periodStart,
      period_end: periodEnd,
      review_content: review.review_content,
      what_went_well: review.what_went_well,
      what_to_improve: review.what_to_improve,
      lessons_learned: review.lessons_learned,
      signals_reviewed: signals.length,
      win_rate_this_period: winRate,
    })
    .select()
    .single();

  if (insertError) throw insertError;

  console.log("Self review saved:", savedReview.id);

  return new Response(JSON.stringify({ success: true, review: savedReview }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
