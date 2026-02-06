import { SentimentData } from '@/types/trading';
import { motion } from 'framer-motion';
import { Users, MessageCircle, Newspaper } from 'lucide-react';

interface SentimentGaugeProps {
  sentiment: SentimentData;
}

export function SentimentGauge({ sentiment }: SentimentGaugeProps) {
  return (
    <div className="trading-card p-6">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <Users className="w-4 h-4" />
        인간지표 (Crowd Pulse)
      </h3>

      {/* Main Long/Short Gauge */}
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-long font-semibold">LONG {sentiment.longRatio}%</span>
          <span className="text-short font-semibold">SHORT {sentiment.shortRatio}%</span>
        </div>
        <div className="h-4 rounded-full overflow-hidden bg-secondary flex">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${sentiment.longRatio}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-long to-long/80"
          />
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${sentiment.shortRatio}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-short/80 to-short"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          {sentiment.longRatio > 65 
            ? '⚠️ 롱 과열 - 역발상 매매 기회' 
            : sentiment.shortRatio > 65 
            ? '⚠️ 숏 과열 - 반등 가능성'
            : '📊 중립적 시장 심리'}
        </p>
      </div>

      {/* Sub Gauges */}
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-muted-foreground">
              <MessageCircle className="w-3 h-3" />
              트위터 긍정 지수
            </span>
            <span className="font-mono text-foreground">{sentiment.twitterSentiment}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sentiment.twitterSentiment}%` }}
              transition={{ duration: 1, delay: 0.2 }}
              className="h-full bg-info"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Newspaper className="w-3 h-3" />
              뉴스 긍정 지수
            </span>
            <span className="font-mono text-foreground">{sentiment.newsSentiment}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden bg-secondary">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${sentiment.newsSentiment}%` }}
              transition={{ duration: 1, delay: 0.4 }}
              className="h-full bg-primary"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
