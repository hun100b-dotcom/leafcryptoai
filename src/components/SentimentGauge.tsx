import { motion } from 'framer-motion';
import { Users, MessageCircle, Newspaper, RefreshCw, ExternalLink, Calendar, Clock, AlertTriangle, Zap } from 'lucide-react';
import { useBinanceLongShortRatio } from '@/hooks/useBinanceLongShortRatio';
import { NewsItem, EventItem } from '@/types/trading';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface SentimentGaugeProps {
  symbol: string;
  news: NewsItem[];
  events?: EventItem[];
}

// Major crypto events - hardcoded for demo, in production would come from API
const MAJOR_EVENTS: EventItem[] = [
  {
    id: 'fomc-2026-02',
    coin: 'ALL',
    type: 'CONFERENCE',
    title: 'FOMC 금리 결정 회의',
    timestamp: new Date('2026-02-12T19:00:00Z'),
    url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
  },
  {
    id: 'eth-dencun',
    coin: 'ETH',
    type: 'CONFERENCE',
    title: 'Ethereum Foundation AMA',
    timestamp: new Date('2026-02-15T14:00:00Z'),
    url: 'https://ethereum.org',
  },
  {
    id: 'btc-halving-anniversary',
    coin: 'BTC',
    type: 'AMA',
    title: 'Bitcoin 2026 Conference',
    timestamp: new Date('2026-02-20T09:00:00Z'),
    url: 'https://b.tc/conference',
  },
];

export function SentimentGauge({ symbol, news, events = MAJOR_EVENTS }: SentimentGaugeProps) {
  const { data: ratioData, isLoading, refetch } = useBinanceLongShortRatio(symbol);

  const longRatio = ratioData?.longRatio ?? 50;
  const shortRatio = ratioData?.shortRatio ?? 50;

  // Calculate news sentiment from actual news
  const bullishCount = news.filter(n => n.sentiment === 'bullish').length;
  const bearishCount = news.filter(n => n.sentiment === 'bearish').length;
  const totalNews = news.length || 1;
  const newsSentiment = Math.round(((bullishCount - bearishCount) / totalNews + 1) * 50);

  // Filter relevant events (within 7 days)
  const upcomingEvents = events.filter(e => {
    const hours = differenceInHours(e.timestamp, new Date());
    return hours > 0 && hours < 168; // Within 7 days
  }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const getEventTypeColor = (type: EventItem['type']) => {
    switch (type) {
      case 'AMA': return 'bg-info/20 text-info';
      case 'CONFERENCE': return 'bg-primary/20 text-primary';
      case 'LISTING': return 'bg-long/20 text-long';
      case 'UNLOCK': return 'bg-short/20 text-short';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const formatCountdown = (date: Date) => {
    const hours = differenceInHours(date, new Date());
    if (hours < 24) return `${hours}시간 후`;
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  return (
    <div className="trading-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Users className="w-3.5 h-3.5" />
          Crowd Pulse · {symbol}
        </h3>
        <button 
          onClick={refetch}
          className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors"
          title="새로고침"
        >
          <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Long/Short Gauge - Binance Official Data */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span className="flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            바이낸스 공식 롱/숏 비율 (Top Traders)
          </span>
          {ratioData?.timestamp && (
            <span className="font-mono">
              {new Date(ratioData.timestamp).toLocaleTimeString('ko-KR')}
            </span>
          )}
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-long font-bold text-lg">LONG {longRatio.toFixed(1)}%</span>
          <span className="text-short font-bold text-lg">SHORT {shortRatio.toFixed(1)}%</span>
        </div>
        <div className="h-5 rounded-full overflow-hidden bg-secondary flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${longRatio}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-long to-long/80 relative"
          >
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {longRatio > 20 ? `${longRatio.toFixed(1)}%` : ''}
            </span>
          </motion.div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${shortRatio}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-short/80 to-short relative"
          >
            <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
              {shortRatio > 20 ? `${shortRatio.toFixed(1)}%` : ''}
            </span>
          </motion.div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {longRatio > 65 
            ? '⚠️ 롱 과열 - 역발상 매매 기회' 
            : shortRatio > 65 
            ? '⚠️ 숏 과열 - 반등 가능성'
            : '📊 중립적 시장 심리'}
        </p>
      </div>

      {/* Major Events Section */}
      {upcomingEvents.length > 0 && (
        <div className="mb-6 p-4 rounded-lg bg-accent/30 border border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            주요 이벤트 & 컨퍼런스
          </h4>
          <div className="space-y-2">
            {upcomingEvents.slice(0, 3).map((event) => {
              const hours = differenceInHours(event.timestamp, new Date());
              const isUrgent = hours < 24;
              
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-lg border transition-all",
                    isUrgent 
                      ? "border-primary bg-primary/5 animate-pulse" 
                      : "border-border bg-card/50"
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded",
                      getEventTypeColor(event.type)
                    )}>
                      {event.type}
                    </span>
                    <span className="text-[10px] font-mono text-primary">{event.coin}</span>
                  </div>
                  <p className="text-sm font-medium mb-1">{event.title}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {isUrgent && <AlertTriangle className="w-3 h-3 text-primary" />}
                      <Clock className="w-3 h-3" />
                      <span className={isUrgent ? "text-primary font-semibold" : ""}>
                        {formatCountdown(event.timestamp)}
                      </span>
                    </div>
                    {event.url && (
                      <a
                        href={event.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        공식 링크
                      </a>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* News Sentiment Based on Real Headlines */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Newspaper className="w-3 h-3" />
              뉴스 긍부정 지수 (상위 {totalNews}개 분석)
            </span>
            <span className="font-mono text-foreground font-bold">{newsSentiment}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${newsSentiment}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className={`h-full ${newsSentiment > 50 ? 'bg-long' : newsSentiment < 50 ? 'bg-short' : 'bg-info'}`}
            />
          </div>
        </div>

        {/* Top 3 News Headlines as Evidence */}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            분석 근거 뉴스
          </p>
          <div className="space-y-1">
            {news.slice(0, 3).map((item, idx) => (
              <a 
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs p-2 rounded bg-accent/30 flex items-start gap-2 hover:bg-accent/50 transition-colors group"
              >
                <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                  item.sentiment === 'bullish' ? 'bg-long' :
                  item.sentiment === 'bearish' ? 'bg-short' : 'bg-muted-foreground'
                }`} />
                <span className="line-clamp-1 group-hover:text-primary transition-colors">{item.title}</span>
                <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* AI Analysis Hint */}
      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-xs">
            <p className="font-semibold text-primary mb-1">AI 분석 요약</p>
            <p className="text-muted-foreground">
              {longRatio > 60 
                ? `롱 포지션 과열 (${longRatio.toFixed(0)}%). 단기 조정 가능성 주의.`
                : shortRatio > 60
                ? `숏 포지션 과열 (${shortRatio.toFixed(0)}%). 숏스퀴즈 가능성 모니터링.`
                : '시장 균형 상태. 추세 방향 확인 후 진입 권장.'}
              {upcomingEvents.length > 0 && ` 향후 ${upcomingEvents.length}개 주요 이벤트 예정.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
