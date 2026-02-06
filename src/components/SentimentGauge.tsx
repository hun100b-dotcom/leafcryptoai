import { motion } from 'framer-motion';
import { Users, MessageCircle, Newspaper, RefreshCw, ExternalLink } from 'lucide-react';
import { useBinanceLongShortRatio } from '@/hooks/useBinanceLongShortRatio';
import { NewsItem } from '@/types/trading';

interface SentimentGaugeProps {
  symbol: string;
  news: NewsItem[];
}

export function SentimentGauge({ symbol, news }: SentimentGaugeProps) {
  const { data: ratioData, isLoading, refetch } = useBinanceLongShortRatio(symbol);

  const longRatio = ratioData?.longRatio ?? 50;
  const shortRatio = ratioData?.shortRatio ?? 50;

  // Calculate news sentiment from actual news
  const bullishCount = news.filter(n => n.sentiment === 'bullish').length;
  const bearishCount = news.filter(n => n.sentiment === 'bearish').length;
  const totalNews = news.length || 1;
  const newsSentiment = Math.round(((bullishCount - bearishCount) / totalNews + 1) * 50);

  return (
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
              <div 
                key={item.id}
                className="text-xs p-2 rounded bg-accent/30 flex items-start gap-2"
              >
                <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                  item.sentiment === 'bullish' ? 'bg-long' :
                  item.sentiment === 'bearish' ? 'bg-short' : 'bg-muted-foreground'
                }`} />
                <span className="line-clamp-1">{item.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
