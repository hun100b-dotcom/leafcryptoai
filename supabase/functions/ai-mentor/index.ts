import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const SYSTEM_PROMPT = `당신은 'Leaf-Master'입니다. 단순한 챗봇이 아니라, 이 트레이딩 시스템의 모든 데이터를 총괄하는 **중앙 통합 로직 엔진(Central Integrated Logic Engine)**입니다.

## 핵심 정체성
- 냉철한 시니어 퀀트 트레이더로서 데이터 중심으로 보고합니다.
- 모든 응답은 현재 시장 데이터, 과거 매매 로그, 가중치 조정 이력을 기반으로 합니다.
- 게임 요소(등급, 레벨, 스킬 상승 등) 없이 순수 정량 분석만 제공합니다.

## 분석 프레임워크
1. **Quantum Inference Matrix**: 기술적(30%) + 센티먼트(30%) + 매크로(30%) + R/R(10%)
2. **Adaptive Market Regime**: Bull/Bear/Sideways/Volatile 국면별 전략 스위칭
3. **Self-Reflection**: 편향성 검증, 리스크 검증 후 최종 판단

## 재진입 전략 (Continuous Scanning Mode)
포지션 종료 즉시 다음 기회를 스캔합니다:
- Trend Follow: EMA 20/50 정배열 확인 시 추격 타점 분석
- Mean Reversion: 볼린저 밴드 하단 이탈 후 회귀 신호 감지
- Volatility Breakout: Squeeze 돌파 확인 시 즉시 진입 준비
- 비정형 데이터(호가창 비대칭, 매집 흔적, 상관관계 급변)도 주도적으로 분석

## 선제적 개입 로직
- 임계 가격 접근, 손절가 근접 시 사용자가 묻기 전에 경고
- 과거 유사 패턴 감지 시 "과거 로그와 유사한 시장 구조 감지. 선제적 대응 제안" 보고
- 모든 제안에 신뢰도 0~100% 산출

## 매크로 통합
- DXY, 테더 도미넌스, 나스닥 상관관계를 수치화
- 나스닥 상관관계(r)가 0.8 이상일 경우 거시 지표 가중치 1.5배 상향
- S_final = (0.4 × Technical) + (0.3 × Sentiment) + (0.3 × Macro)

## RAG 기반 응답
- 아래 제공되는 [과거 매매 로그]와 [자기 복기 기록]을 반드시 참고하세요.
- 유사한 시장 구조나 패턴이 있으면 "과거 로그 #N과 유사하며..." 형식으로 언급하세요.
- 과거 실패에서 배운 교훈을 현재 판단에 반영하세요.

## 응답 형식
- 간결하고 명확하게 답변 (3-5문장)
- 구체적인 가격대와 근거 제시
- 진입 추천 시 반드시 TP/SL 제시
- 통계적 신뢰도를 0~100% 사이로 산출하여 제시
- 이모지 적절히 사용 (📈 📉 ⚠️ 💡 🎯 🔥 💰)

## 주의사항
- 투자 조언이 아닌 참고용 분석임을 명시
- 손실 가능성 항상 언급
- 과도한 레버리지 경고 (20x 이상은 고위험)
- 사용자의 현재 자산 대비 적정 포지션 크기 조언`;

// Local fallback when API fails
function generateLocalFallback(symbol: string, currentPrice: number): string {
  return `⚠️ AI 엔진 일시 중단 - 로컬 분석 모드 활성화

📊 ${symbol}/USDT 현재가: $${currentPrice?.toLocaleString() || 'N/A'}

🔍 **로컬 분석 (제한적)**:
- API 연결이 일시적으로 불안정합니다.
- 현재 보유 포지션이 있다면 손절가를 재확인하세요.
- 급격한 시장 변동 시 포지션 크기를 축소하는 것을 권장합니다.

💡 **권장 조치**:
1. 기존 포지션의 TP/SL 재점검
2. 신규 진입 보류 (데이터 불충분)
3. 잠시 후 다시 시도

_이 분석은 로컬 폴백이며 AI 정밀 분석이 아닙니다._`;
}

// RAG: Fetch similar past signals and reviews from DB
async function fetchRAGContext(supabaseUrl: string, serviceKey: string, symbol: string): Promise<string> {
  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    
    // Fetch recent signals for this symbol (most relevant)
    const { data: symbolSignals } = await supabase
      .from('ai_trading_signals')
      .select('symbol, position, entry_price, target_price, stop_loss, status, pnl_percent, evidence_reasoning, created_at, closed_at')
      .eq('symbol', symbol)
      .in('status', ['WIN', 'LOSS'])
      .order('created_at', { ascending: false })
      .limit(5);

    // Fetch recent reviews
    const { data: reviews } = await supabase
      .from('ai_self_reviews')
      .select('review_content, lessons_learned, what_went_well, what_to_improve, win_rate_this_period, created_at')
      .order('created_at', { ascending: false })
      .limit(3);

    // Fetch overall stats
    const { data: allSignals } = await supabase
      .from('ai_trading_signals')
      .select('status, pnl_percent')
      .in('status', ['WIN', 'LOSS']);

    let ragContext = '\n\n## [과거 매매 로그 - RAG 검색 결과]';
    
    if (symbolSignals && symbolSignals.length > 0) {
      ragContext += `\n### ${symbol} 최근 매매 기록:`;
      symbolSignals.forEach((s, i) => {
        ragContext += `\n로그 #${i + 1}: ${s.position} @ $${s.entry_price} → ${s.status}(${s.pnl_percent ? (s.pnl_percent > 0 ? '+' : '') + s.pnl_percent.toFixed(1) + '%' : 'N/A'}) | ${s.evidence_reasoning?.substring(0, 100) || '근거 없음'}`;
      });
    } else {
      ragContext += `\n${symbol}에 대한 과거 매매 기록 없음.`;
    }

    if (allSignals && allSignals.length > 0) {
      const wins = allSignals.filter(s => s.status === 'WIN').length;
      const total = allSignals.length;
      const totalPnl = allSignals.reduce((a, s) => a + (s.pnl_percent || 0), 0);
      ragContext += `\n\n### 전체 성과 요약: 총 ${total}건, 승률 ${(wins / total * 100).toFixed(1)}%, 누적 PnL: ${totalPnl.toFixed(1)}%`;
    }

    if (reviews && reviews.length > 0) {
      ragContext += '\n\n### 자기 복기 기록:';
      reviews.forEach((r, i) => {
        ragContext += `\n복기 #${i + 1}: ${r.lessons_learned || r.review_content?.substring(0, 150) || 'N/A'}`;
        if (r.what_to_improve) ragContext += ` | 개선점: ${r.what_to_improve.substring(0, 100)}`;
      });
    }

    return ragContext;
  } catch (err) {
    console.error('RAG context fetch error:', err);
    return '\n\n[RAG 데이터 로딩 실패 - 기본 분석 모드]';
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, symbol, currentPrice, position, context } = await req.json();
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || '';
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || '';
    
    if (!GEMINI_API_KEY) {
      const fallback = generateLocalFallback(symbol, currentPrice);
      return new Response(JSON.stringify({ choices: [{ message: { content: fallback } }] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // RAG: Fetch relevant historical context
    const ragContext = await fetchRAGContext(supabaseUrl, supabaseServiceKey, symbol || 'BTC');

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
${ragContext}

[질문]
${message}`;
    }

    console.log("AI Mentor request (with RAG):", userMessage.substring(0, 500));

    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.0-flash",
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
      
      console.error("AI gateway error:", response.status);
      const fallback = generateLocalFallback(symbol, currentPrice);
      return new Response(
        `data: ${JSON.stringify({ choices: [{ delta: { content: fallback } }] })}\n\ndata: [DONE]\n\n`,
        { headers: { ...corsHeaders, "Content-Type": "text/event-stream" } }
      );
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
