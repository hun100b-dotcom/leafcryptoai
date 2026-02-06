-- 유저 설정 테이블 (시작 자산 등)
CREATE TABLE public.user_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE,
  initial_asset NUMERIC NOT NULL DEFAULT 1000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 유저 포지션 테이블 (내 매매 기록)
CREATE TABLE public.user_positions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  position TEXT NOT NULL,
  entry_price NUMERIC NOT NULL,
  target_price NUMERIC NOT NULL,
  stop_loss NUMERIC NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  close_price NUMERIC,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  message TEXT
);

-- RLS 활성화
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽고 쓸 수 있도록 (익명 사용자 지원)
CREATE POLICY "Anyone can view user_settings"
  ON public.user_settings FOR SELECT USING (true);

CREATE POLICY "Anyone can insert user_settings"
  ON public.user_settings FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update user_settings"
  ON public.user_settings FOR UPDATE USING (true);

CREATE POLICY "Anyone can view user_positions"
  ON public.user_positions FOR SELECT USING (true);

CREATE POLICY "Anyone can insert user_positions"
  ON public.user_positions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update user_positions"
  ON public.user_positions FOR UPDATE USING (true);

CREATE POLICY "Anyone can delete user_positions"
  ON public.user_positions FOR DELETE USING (true);

-- Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_positions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_settings;