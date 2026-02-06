export type PositionType = 'LONG' | 'SHORT' | 'HOLD';

export interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  aiWinRate: number;
}

export interface AISignal {
  id: string;
  symbol: string;
  position: PositionType;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  leverage: number;
  timestamp: Date;
  confidence: number;
  status: 'ACTIVE' | 'WIN' | 'LOSS' | 'PENDING';
  message: string;
  closedAt?: Date;
  closePrice?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  timestamp: Date;
  url?: string;
}

export interface SentimentData {
  longRatio: number;
  shortRatio: number;
  twitterSentiment: number;
  newsSentiment: number;
}

export interface EventItem {
  id: string;
  title: string;
  coin: string;
  type: 'AMA' | 'CONFERENCE' | 'LISTING' | 'UNLOCK';
  timestamp: Date;
  url?: string;
}
