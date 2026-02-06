import { CoinData, AISignal, NewsItem, SentimentData, EventItem } from '@/types/trading';

export const mockCoins: CoinData[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 97234.56, change24h: 2.34, volume24h: 45000000000, aiWinRate: 78 },
  { symbol: 'ETH', name: 'Ethereum', price: 3456.78, change24h: -1.23, volume24h: 18000000000, aiWinRate: 72 },
  { symbol: 'SOL', name: 'Solana', price: 178.90, change24h: 5.67, volume24h: 5200000000, aiWinRate: 81 },
  { symbol: 'BNB', name: 'BNB', price: 654.32, change24h: 0.89, volume24h: 2100000000, aiWinRate: 69 },
  { symbol: 'XRP', name: 'Ripple', price: 2.34, change24h: -0.56, volume24h: 3400000000, aiWinRate: 65 },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.3456, change24h: 8.90, volume24h: 2800000000, aiWinRate: 58 },
  { symbol: 'ADA', name: 'Cardano', price: 0.98, change24h: 3.21, volume24h: 890000000, aiWinRate: 62 },
  { symbol: 'AVAX', name: 'Avalanche', price: 38.76, change24h: -2.34, volume24h: 720000000, aiWinRate: 70 },
];

export const mockSignals: AISignal[] = [
  {
    id: '1',
    symbol: 'BTC',
    position: 'LONG',
    entryPrice: 96800,
    targetPrice: 99500,
    stopLoss: 95200,
    leverage: 10,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    confidence: 85,
    status: 'ACTIVE',
    message: 'BTC 강한 상승 모멘텀 포착. RSI 과매도 해소 후 반등 시그널. 레버리지 10x 진입 권장.'
  },
  {
    id: '2',
    symbol: 'ETH',
    position: 'SHORT',
    entryPrice: 3520,
    targetPrice: 3380,
    stopLoss: 3600,
    leverage: 5,
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    confidence: 72,
    status: 'WIN',
    message: 'ETH 저항선 돌파 실패. 단기 조정 예상. 보수적 레버리지 권장.'
  },
  {
    id: '3',
    symbol: 'SOL',
    position: 'LONG',
    entryPrice: 172,
    targetPrice: 195,
    stopLoss: 165,
    leverage: 15,
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    confidence: 91,
    status: 'ACTIVE',
    message: 'SOL 생태계 호재 다수 포착. 트위터 긍정 언급 급증. 공격적 진입 가능.'
  },
];

export const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Bitcoin ETF 거래량 역대 최고치 갱신',
    source: 'Bloomberg',
    sentiment: 'bullish',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
  },
  {
    id: '2',
    title: 'SEC, 이더리움 스테이킹 규제 검토 착수',
    source: 'Reuters',
    sentiment: 'bearish',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
  },
  {
    id: '3',
    title: 'Solana 네트워크 TVL 사상 최고치 돌파',
    source: 'CoinDesk',
    sentiment: 'bullish',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
  },
  {
    id: '4',
    title: '바이낸스, 신규 선물 페어 10종 추가 상장',
    source: 'The Block',
    sentiment: 'neutral',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
  },
];

export const mockSentiment: SentimentData = {
  longRatio: 62,
  shortRatio: 38,
  twitterSentiment: 71,
  newsSentiment: 58,
};

export const mockEvents: EventItem[] = [
  {
    id: '1',
    title: 'Bitcoin 반감기 D-Day',
    coin: 'BTC',
    type: 'CONFERENCE',
    timestamp: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
  },
  {
    id: '2',
    title: 'Solana Breakpoint 2025',
    coin: 'SOL',
    type: 'AMA',
    timestamp: new Date(Date.now() + 1000 * 60 * 60 * 6),
  },
  {
    id: '3',
    title: 'ARB 토큰 언락 (1.2B)',
    coin: 'ARB',
    type: 'UNLOCK',
    timestamp: new Date(Date.now() + 1000 * 60 * 60 * 48),
  },
];
