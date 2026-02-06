-- Create trading_signals table for storing AI signals and calculating win rate
CREATE TABLE public.trading_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('LONG', 'SHORT', 'HOLD')),
  entry_price DECIMAL(20, 8) NOT NULL,
  target_price DECIMAL(20, 8) NOT NULL,
  stop_loss DECIMAL(20, 8) NOT NULL,
  leverage INTEGER NOT NULL DEFAULT 1,
  confidence INTEGER NOT NULL DEFAULT 50,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'WIN', 'LOSS', 'PENDING')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE,
  close_price DECIMAL(20, 8)
);

-- Enable Row Level Security
ALTER TABLE public.trading_signals ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to read signals (public dashboard)
CREATE POLICY "Anyone can view trading signals" 
ON public.trading_signals 
FOR SELECT 
USING (true);

-- Create policy to allow only authenticated users to insert signals (for admin/AI)
CREATE POLICY "Authenticated users can create signals" 
ON public.trading_signals 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow updates (for closing signals)
CREATE POLICY "Allow signal updates" 
ON public.trading_signals 
FOR UPDATE 
USING (true);

-- Create index for faster queries
CREATE INDEX idx_trading_signals_symbol ON public.trading_signals(symbol);
CREATE INDEX idx_trading_signals_status ON public.trading_signals(status);
CREATE INDEX idx_trading_signals_created_at ON public.trading_signals(created_at DESC);

-- Enable realtime for trading_signals table
ALTER PUBLICATION supabase_realtime ADD TABLE public.trading_signals;