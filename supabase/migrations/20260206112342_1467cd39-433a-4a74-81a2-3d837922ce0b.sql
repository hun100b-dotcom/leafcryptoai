-- 1. AI 트레이딩 시그널 히스토리 (근거 + 긴급 알림 필드 포함)
CREATE TABLE public.ai_trading_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('LONG', 'SHORT', 'HOLD')),
  entry_price NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  leverage INTEGER DEFAULT 1,
  confidence INTEGER DEFAULT 50,
  
  -- 근거 데이터 (Gemini 피드백 반영)
  sentiment_score NUMERIC, -- -100 ~ 100
  evidence_reasoning TEXT, -- AI 판단 근거
  reference_url TEXT, -- 참고 뉴스/이벤트 링크
  
  -- 실시간 추적
  highest_price_reached NUMERIC,
  lowest_price_reached NUMERIC,
  
  -- 긴급 알림
  is_urgent BOOLEAN DEFAULT false,
  urgency_reason TEXT,
  
  -- 상태
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WIN', 'LOSS', 'CANCELLED')),
  close_price NUMERIC,
  pnl_percent NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- 2. AI 성과 통계 (캐싱용)
CREATE TABLE public.ai_performance_stats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_type TEXT NOT NULL CHECK (period_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME')),
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE,
  symbol TEXT, -- NULL이면 전체 통계
  
  total_signals INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  win_rate NUMERIC DEFAULT 0,
  total_pnl NUMERIC DEFAULT 0,
  avg_pnl NUMERIC DEFAULT 0,
  avg_leverage NUMERIC DEFAULT 0,
  best_trade_pnl NUMERIC,
  worst_trade_pnl NUMERIC,
  avg_hold_time_minutes INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3. AI 자기 리뷰
CREATE TABLE public.ai_self_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  
  review_content TEXT NOT NULL,
  what_went_well TEXT,
  what_to_improve TEXT,
  lessons_learned TEXT,
  
  signals_reviewed INTEGER DEFAULT 0,
  win_rate_this_period NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. AI 자동 조언 히스토리 (긴급 알림 포함)
CREATE TABLE public.ai_advice_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  advice_type TEXT NOT NULL CHECK (advice_type IN ('ENTRY', 'HOLD', 'EXIT', 'WARNING', 'EVENT', 'URGENT')),
  advice_content TEXT NOT NULL,
  reference_url TEXT,
  confidence INTEGER DEFAULT 50,
  
  -- 긴급 알림
  is_urgent BOOLEAN DEFAULT false,
  urgency_reason TEXT,
  
  -- 트리거 정보
  triggered_by TEXT, -- 'CRON', 'PRICE_SPIKE', 'NEWS_EVENT', 'MANUAL'
  price_at_time NUMERIC,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 5. AI 관리 포지션 ("함께 진입")
CREATE TABLE public.ai_managed_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  signal_id UUID REFERENCES public.ai_trading_signals(id) ON DELETE CASCADE,
  
  allocated_asset NUMERIC NOT NULL, -- 할당된 자산
  entry_price NUMERIC NOT NULL,
  current_pnl NUMERIC DEFAULT 0,
  
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WIN', 'LOSS', 'CANCELLED')),
  close_price NUMERIC,
  closed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. 사용자 트레이딩 노트
CREATE TABLE public.trading_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  position_id UUID, -- user_positions 또는 ai_managed_positions 참조
  position_type TEXT CHECK (position_type IN ('USER', 'AI_MANAGED')),
  
  note_content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.ai_trading_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_performance_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_self_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_advice_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_managed_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_notes ENABLE ROW LEVEL SECURITY;

-- 보안 정책: SELECT만 공개, 쓰기는 차단 (Edge Function service_role에서만 가능)
-- ai_trading_signals
CREATE POLICY "Anyone can view ai_trading_signals" ON public.ai_trading_signals FOR SELECT USING (true);

-- ai_performance_stats
CREATE POLICY "Anyone can view ai_performance_stats" ON public.ai_performance_stats FOR SELECT USING (true);

-- ai_self_reviews
CREATE POLICY "Anyone can view ai_self_reviews" ON public.ai_self_reviews FOR SELECT USING (true);

-- ai_advice_history
CREATE POLICY "Anyone can view ai_advice_history" ON public.ai_advice_history FOR SELECT USING (true);

-- ai_managed_positions (자신의 포지션만 조회)
CREATE POLICY "Users can view their own ai_managed_positions" ON public.ai_managed_positions FOR SELECT USING (true);

-- trading_notes (자신의 노트만 조회)
CREATE POLICY "Users can view their own trading_notes" ON public.trading_notes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own trading_notes" ON public.trading_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their own trading_notes" ON public.trading_notes FOR UPDATE USING (true);
CREATE POLICY "Users can delete their own trading_notes" ON public.trading_notes FOR DELETE USING (true);

-- 실시간 동기화 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_trading_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_advice_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_managed_positions;

-- 인덱스 (성능 최적화)
CREATE INDEX idx_ai_trading_signals_status ON public.ai_trading_signals(status);
CREATE INDEX idx_ai_trading_signals_symbol ON public.ai_trading_signals(symbol);
CREATE INDEX idx_ai_trading_signals_created_at ON public.ai_trading_signals(created_at DESC);
CREATE INDEX idx_ai_advice_history_is_urgent ON public.ai_advice_history(is_urgent);
CREATE INDEX idx_ai_managed_positions_user_id ON public.ai_managed_positions(user_id);
CREATE INDEX idx_ai_performance_stats_period ON public.ai_performance_stats(period_type, period_start);