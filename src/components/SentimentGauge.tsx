import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, MessageCircle, Newspaper, RefreshCw, ExternalLink, Calendar, Clock, AlertTriangle, Zap, Bot, Info, TrendingUp, TrendingDown, HelpCircle } from 'lucide-react';
import { useBinanceLongShortRatio } from '@/hooks/useBinanceLongShortRatio';
import { NewsItem, EventItem } from '@/types/trading';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SentimentGaugeProps {
  symbol: string;
  news: NewsItem[];
  events?: EventItem[];
}

// Major crypto events
const MAJOR_EVENTS: (EventItem & { description: string; impact: string })[] = [
  {
    id: 'fomc-2026-02',
    coin: 'ALL',
    type: 'CONFERENCE',
    title: 'FOMC 금리 결정 회의',
    timestamp: new Date('2026-02-12T19:00:00Z'),
    url: 'https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm',
    description: '미국 연방준비제도(Fed)의 기준 금리 결정 회의. 금리 인하 시 위험 자산(암호화폐 포함) 상승 유도, 금리 동결/인상 시 하락 압력.',
    impact: '금리 동결 예상. 파월 의장의 발언 톤에 따라 변동성 확대 가능. 매파적 발언 시 단기 하락, 비둘기파적 발언 시 상승 모멘텀 기대.',
  },
  {
    id: 'eth-dencun',
    coin: 'ETH',
    type: 'CONFERENCE',
    title: 'Ethereum Foundation AMA',
    timestamp: new Date('2026-02-15T14:00:00Z'),
    url: 'https://ethereum.org',
    description: '이더리움 재단 공식 AMA(Ask Me Anything) 세션. 로드맵 업데이트, 신규 EIP 발표, 생태계 방향성 논의.',
    impact: '이더리움 L2 확장 및 수수료 감소 관련 발표 예상. ETH 가격에 긍정적 영향 가능성 높으나, 기대에 못 미칠 경우 실망 매도 주의.',
  },
  {
    id: 'btc-conference',
    coin: 'BTC',
    type: 'AMA',
    title: 'Bitcoin 2026 Conference',
    timestamp: new Date('2026-02-20T09:00:00Z'),
    url: 'https://b.tc/conference',
    description: '세계 최대 비트코인 컨퍼런스. 기관 투자, 규제, 기술 혁신 등 비트코인 생태계 전반에 대한 주요 발표 진행.',
    impact: '기관 투자자 참여 확대 및 긍정적 규제 신호 발표 가능. 비트코인 현물 ETF 추가 승인 관련 논의가 핵심 이벤트.',
  },
];

export function SentimentGauge({ symbol, news }: SentimentGaugeProps) {
  const { data: ratioData, isLoading, refetch } = useBinanceLongShortRatio(symbol);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

  const longRatio = ratioData?.longRatio ?? 50;
  const shortRatio = ratioData?.shortRatio ?? 50;

  // Calculate news sentiment from actual news
  const bullishCount = news.filter(n => n.sentiment === 'bullish').length;
  const bearishCount = news.filter(n => n.sentiment === 'bearish').length;
  const totalNews = news.length || 1;
  const newsSentiment = Math.round(((bullishCount - bearishCount) / totalNews + 1) * 50);

  // Filter relevant events (within 14 days)
  const upcomingEvents = MAJOR_EVENTS.filter(e => {
    const hours = differenceInHours(e.timestamp, new Date());
    return hours > 0 && hours < 336;
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

  // Generate AI analysis summary
  const generateAISummary = async () => {
    setIsSummaryLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-auto-advisor', {
        body: { 
          symbol, 
          type: 'SENTIMENT_ANALYSIS',
          context: {
            longRatio,
            shortRatio,
            newsSentiment,
            newsHeadlines: news.slice(0, 5).map(n => `[${n.sentiment}] ${n.title}`),
            upcomingEvents: upcomingEvents.map(e => `${e.title} (${formatCountdown(e.timestamp)})`),
          }
        }
      });
      if (data?.advice) {
        setAiSummary(data.advice);
      }
    } catch (err) {
      console.error('Failed to generate AI summary:', err);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // Long/short ratio interpretation
  const getLongShortInterpretation = () => {
    if (longRatio > 70) return { text: '극단적 롱 과열 — 대규모 롱 스퀴즈(Long Squeeze) 위험이 매우 높습니다. 역추세 매매를 고려하세요.', sentiment: 'bearish' };
    if (longRatio > 60) return { text: '롱 포지션 쏠림 — 조정 시 하락 폭이 커질 수 있습니다. 진입 시 손절라인을 타이트하게 설정하세요.', sentiment: 'bearish' };
    if (shortRatio > 70) return { text: '극단적 숏 과열 — 숏 스퀴즈(Short Squeeze) 가능성이 매우 높습니다. 역추세 반등 매수를 고려하세요.', sentiment: 'bullish' };
    if (shortRatio > 60) return { text: '숏 포지션 쏠림 — 반등 시 숏 커버링이 발생할 수 있습니다. 저가 매수 기회를 탐색하세요.', sentiment: 'bullish' };
    return { text: '롱/숏 균형 상태 — 추세 형성 전 관망이 유리합니다. 방향 확인 후 진입하세요.', sentiment: 'neutral' };
  };

  const interpretation = getLongShortInterpretation();

  // News sentiment interpretation
  const getNewsSentimentInterpretation = () => {
    if (newsSentiment >= 75) return '뉴스 심리가 매우 긍정적입니다. 호재성 뉴스가 다수이며, 시장 참여자들의 낙관론이 확산되고 있습니다.';
    if (newsSentiment >= 60) return '뉴스 심리가 다소 긍정적입니다. 호재가 우세하나, 일부 부정적 뉴스에 주의가 필요합니다.';
    if (newsSentiment <= 25) return '뉴스 심리가 매우 부정적입니다. 악재성 뉴스가 다수이며, 공포심리가 확산될 수 있습니다.';
    if (newsSentiment <= 40) return '뉴스 심리가 다소 부정적입니다. 악재가 우세하나, 과매도 반등 가능성도 존재합니다.';
    return '뉴스 심리가 중립적입니다. 호재와 악재가 균형을 이루고 있어 방향성 탐색이 필요합니다.';
  };

  return (
    <TooltipProvider>
      <div className="trading-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4" />
            인간지표 (Crowd Pulse) - {symbol}
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
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 cursor-help">
                  <ExternalLink className="w-3 h-3" />
                  바이낸스 공식 롱/숏 비율 (Top Traders)
                  <HelpCircle className="w-3 h-3" />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">바이낸스 선물 거래소의 상위 트레이더(Top Traders)들이 보유한 롱/숏 포지션 비율입니다. 이 데이터는 바이낸스 공식 API에서 실시간으로 가져옵니다.</p>
              </TooltipContent>
            </Tooltip>
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
          {/* Detailed interpretation */}
          <div className="mt-3 p-3 rounded-lg bg-accent/30 border border-border">
            <div className="flex items-start gap-2">
              <Info className={cn(
                "w-4 h-4 mt-0.5 flex-shrink-0",
                interpretation.sentiment === 'bullish' ? 'text-long' : 
                interpretation.sentiment === 'bearish' ? 'text-short' : 'text-muted-foreground'
              )} />
              <div className="text-xs">
                <p className="font-semibold mb-1">
                  {interpretation.sentiment === 'bullish' ? '🟢 매수 우위 해석' : 
                   interpretation.sentiment === 'bearish' ? '🔴 매도 우위 해석' : '⚪ 중립 해석'}
                </p>
                <p className="text-muted-foreground">{interpretation.text}</p>
                <p className="text-muted-foreground/70 mt-1 italic text-[10px]">
                  ※ 바이낸스 Top Trader 기준. 롱 비율이 높을수록 대중이 매수에 몰려있어 역방향 리스크가 커집니다.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Major Events Section with AI Preview */}
        {upcomingEvents.length > 0 && (
          <div className="mb-6 p-4 rounded-lg bg-accent/30 border border-border">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              주요 이벤트 & 컨퍼런스
            </h4>
            <p className="text-[10px] text-muted-foreground/70 mb-3">
              암호화폐 시장에 영향을 미칠 수 있는 예정된 이벤트입니다. AI 멘토가 각 이벤트의 영향을 미리 분석합니다.
            </p>
            <div className="space-y-3">
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
                        ? "border-primary bg-primary/5" 
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
                    
                    {/* Event description */}
                    <p className="text-xs text-muted-foreground mb-2">{event.description}</p>
                    
                    {/* AI Preview */}
                    <div className="p-2 rounded bg-primary/5 border border-primary/10 mb-2">
                      <div className="flex items-start gap-1.5">
                        <Bot className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                        <div className="text-[11px]">
                          <span className="font-semibold text-primary">AI 멘토 프리뷰: </span>
                          <span className="text-foreground/80">{event.impact}</span>
                        </div>
                      </div>
                    </div>

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

        {/* News Sentiment */}
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center gap-1 text-muted-foreground cursor-help">
                    <Newspaper className="w-3 h-3" />
                    뉴스 긍부정 지수 (상위 {totalNews}개 분석)
                    <HelpCircle className="w-3 h-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-xs">최근 주요 암호화폐 뉴스의 긍정/부정 비율을 분석한 지수입니다. 50% 이상이면 시장 분위기가 긍정적, 50% 미만이면 부정적입니다.</p>
                </TooltipContent>
              </Tooltip>
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
            {/* News sentiment interpretation */}
            <p className="text-[11px] text-muted-foreground mt-2">
              {getNewsSentimentInterpretation()}
            </p>
          </div>

          {/* Top 3 News Headlines as Evidence */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <MessageCircle className="w-3 h-3" />
              분석 근거 뉴스
            </p>
            <div className="space-y-1">
              {news.slice(0, 3).map((item) => (
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
                  <div className="flex-1 min-w-0">
                    <span className="line-clamp-1 group-hover:text-primary transition-colors">{item.title}</span>
                    <span className={cn(
                      "text-[10px] ml-1",
                      item.sentiment === 'bullish' ? 'text-long' :
                      item.sentiment === 'bearish' ? 'text-short' : 'text-muted-foreground'
                    )}>
                      ({item.sentiment === 'bullish' ? '긍정' : item.sentiment === 'bearish' ? '부정' : '중립'})
                    </span>
                  </div>
                  <ExternalLink className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced AI Analysis Summary */}
        <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">AI 멘토 종합 분석</span>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center gap-1 text-[10px] text-muted-foreground cursor-help">
                  <Info className="w-3 h-3" /> 실시간 데이터 기반
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs">롱/숏 비율, 뉴스 심리, 예정 이벤트 등 현재 시장 데이터를 종합하여 AI가 분석한 결과입니다.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="space-y-3 text-xs">
            {/* Market Position Analysis */}
            <div className="flex items-start gap-2">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                longRatio > 60 ? "bg-short/20" : shortRatio > 60 ? "bg-long/20" : "bg-muted"
              )}>
                {longRatio > 60 ? <TrendingDown className="w-3 h-3 text-short" /> : 
                 shortRatio > 60 ? <TrendingUp className="w-3 h-3 text-long" /> : 
                 <Users className="w-3 h-3 text-muted-foreground" />}
              </div>
              <div>
                <p className="font-semibold text-foreground">📊 포지션 분석</p>
                <p className="text-muted-foreground">
                  현재 {symbol} 롱/숏 비율은 {longRatio.toFixed(1)}:{shortRatio.toFixed(1)}입니다. 
                  {longRatio > 65 
                    ? ` 롱 포지션이 ${longRatio.toFixed(0)}%로 과열 상태입니다. 대중의 낙관론이 정점에 달해있어, 대규모 청산 발생 시 급격한 하락이 발생할 수 있습니다. 역추세 숏 포지션이 유리한 구간이며, 롱 보유 시 손절라인을 반드시 설정하세요.`
                    : shortRatio > 65
                    ? ` 숏 포지션이 ${shortRatio.toFixed(0)}%로 과열 상태입니다. 공포심리가 극대화되어 있어, 반등 시 숏 커버링(숏 포지션 청산)이 발생하며 가격이 급등할 수 있습니다. 저가 매수 기회를 탐색하세요.`
                    : ` 균형 잡힌 상태로, 양방향 모두 진입 가능합니다. 추세 방향이 확인된 후 순방향 진입을 권장합니다.`
                  }
                </p>
              </div>
            </div>

            {/* News Impact Analysis */}
            <div className="flex items-start gap-2">
              <div className={cn(
                "w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                newsSentiment > 60 ? "bg-long/20" : newsSentiment < 40 ? "bg-short/20" : "bg-muted"
              )}>
                <Newspaper className={cn(
                  "w-3 h-3",
                  newsSentiment > 60 ? "text-long" : newsSentiment < 40 ? "text-short" : "text-muted-foreground"
                )} />
              </div>
              <div>
                <p className="font-semibold text-foreground">📰 뉴스 심리 분석</p>
                <p className="text-muted-foreground">
                  현재 뉴스 심리지수는 {newsSentiment}%로, 
                  {newsSentiment > 60 
                    ? ` 긍정적인 뉴스가 우세합니다. 호재 뉴스(${bullishCount}개)가 악재(${bearishCount}개)보다 많아 시장 참여자들의 심리가 낙관적입니다. 다만 이미 호재가 가격에 반영되었을 수 있으므로 추격 매수는 주의가 필요합니다.`
                    : newsSentiment < 40
                    ? ` 부정적인 뉴스가 우세합니다. 악재 뉴스(${bearishCount}개)가 호재(${bullishCount}개)보다 많아 공포심리가 확산되고 있습니다. 단, 극단적 공포 구간에서는 저가 매수 기회가 발생할 수 있습니다.`
                    : ` 중립적인 상태입니다. 호재(${bullishCount}개)와 악재(${bearishCount}개)가 균형을 이루고 있어 당장의 방향성 판단이 어렵습니다. 주요 이벤트 결과에 따라 방향이 결정될 가능성이 높습니다.`
                  }
                </p>
              </div>
            </div>

            {/* Event Impact Analysis */}
            {upcomingEvents.length > 0 && (
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-primary/20">
                  <Calendar className="w-3 h-3 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">📅 이벤트 리스크</p>
                  <p className="text-muted-foreground">
                    향후 {upcomingEvents.length}개의 주요 이벤트가 예정되어 있습니다. 
                    {upcomingEvents.some(e => differenceInHours(e.timestamp, new Date()) < 48)
                      ? ` 특히 48시간 이내에 예정된 이벤트가 있어 변동성 확대가 예상됩니다. 이벤트 전후로 포지션 규모를 줄이거나 손절라인을 타이트하게 관리하세요.`
                      : ` 가장 가까운 이벤트는 ${formatCountdown(upcomingEvents[0].timestamp)}입니다. 이벤트 접근 시 변동성이 커질 수 있으므로 미리 리스크를 관리하세요.`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Final Verdict */}
            <div className="mt-2 pt-3 border-t border-primary/20">
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-primary">💡 종합 판단</p>
                  <p className="text-foreground/80 leading-relaxed">
                    {longRatio > 65 && newsSentiment > 60
                      ? `${symbol}은 뉴스는 긍정적이나 롱 포지션이 과열되어 있습니다. "탐욕 속의 조정" 패턴 가능성이 높으므로, 신규 매수보다는 기존 롱 포지션의 익절 또는 손절 강화를 권장합니다. 숏 진입 시에는 강한 저항선 부근에서 진입하세요.`
                      : longRatio > 65 && newsSentiment < 40
                      ? `${symbol}은 악재와 롱 과열이 동시에 나타나고 있습니다. 하락 리스크가 매우 높은 상태이므로, 롱 포지션 정리를 최우선으로 하고 숏 기회를 적극 모색하세요.`
                      : shortRatio > 65 && newsSentiment < 40
                      ? `${symbol}은 뉴스도 부정적이고 숏도 과열되었습니다. 극단적 공포 상태로, 숏 스퀴즈에 의한 급반등 가능성을 주시하세요. 소규모 롱 진입을 고려할 수 있습니다.`
                      : shortRatio > 65 && newsSentiment > 60
                      ? `${symbol}은 뉴스는 긍정적이나 숏이 과열된 상황입니다. 반등 가능성이 높으며, 롱 진입에 유리한 환경입니다.`
                      : `${symbol}은 현재 시장 심리와 뉴스가 균형 상태입니다. 명확한 방향성이 나타날 때까지 관망하거나, 소규모 포지션으로 추세 탐색을 권장합니다.`
                    }
                    {upcomingEvents.length > 0 && ` 다가오는 ${upcomingEvents[0].title}에 대한 리스크 관리도 잊지 마세요.`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}