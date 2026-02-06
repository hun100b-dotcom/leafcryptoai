import { NewsItem, EventItem } from '@/types/trading';

// Mock news with URLs (will be replaced by real API data later)
export const mockNews: NewsItem[] = [
  {
    id: '1',
    title: 'Bitcoin ETF 거래량 역대 최고치 갱신',
    source: 'Bloomberg',
    sentiment: 'bullish',
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    url: 'https://www.bloomberg.com/crypto',
  },
  {
    id: '2',
    title: 'SEC, 이더리움 스테이킹 규제 검토 착수',
    source: 'Reuters',
    sentiment: 'bearish',
    timestamp: new Date(Date.now() - 1000 * 60 * 45),
    url: 'https://www.reuters.com/technology/',
  },
  {
    id: '3',
    title: 'Solana 네트워크 TVL 사상 최고치 돌파',
    source: 'CoinDesk',
    sentiment: 'bullish',
    timestamp: new Date(Date.now() - 1000 * 60 * 90),
    url: 'https://www.coindesk.com/',
  },
  {
    id: '4',
    title: '바이낸스, 신규 선물 페어 10종 추가 상장',
    source: 'The Block',
    sentiment: 'neutral',
    timestamp: new Date(Date.now() - 1000 * 60 * 120),
    url: 'https://www.theblock.co/',
  },
];

// Mock events with official URLs
export const mockEvents: EventItem[] = [
  {
    id: '1',
    title: 'Bitcoin 반감기 D-Day',
    coin: 'BTC',
    type: 'CONFERENCE',
    timestamp: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3),
    url: 'https://www.bitcoinhalving.com/',
  },
  {
    id: '2',
    title: 'Solana Breakpoint 2025',
    coin: 'SOL',
    type: 'AMA',
    timestamp: new Date(Date.now() + 1000 * 60 * 60 * 6),
    url: 'https://solana.com/breakpoint',
  },
  {
    id: '3',
    title: 'ARB 토큰 언락 (1.2B)',
    coin: 'ARB',
    type: 'UNLOCK',
    timestamp: new Date(Date.now() + 1000 * 60 * 60 * 48),
    url: 'https://token.unlocks.app/arbitrum',
  },
];
