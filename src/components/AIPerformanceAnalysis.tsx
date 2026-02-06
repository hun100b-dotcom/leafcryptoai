import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAISignals, AISignal } from '@/hooks/useAISignals';
import { cn } from '@/lib/utils';
import { 
  TrendingUp, TrendingDown, Trophy, Target, Clock, 
  BarChart3, PieChart, Calendar, Filter, Zap,
  CheckCircle2, XCircle, Minus
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';

export function AIPerformanceAnalysis() {
  const { signals, stats, reviews, isLoading } = useAISignals();
  const [periodFilter, setPeriodFilter] = useState<'all' | 'week' | 'month'>('all');
  const [symbolFilter, setSymbolFilter] = useState<string>('all');

  // Get unique symbols
  const symbols = [...new Set(signals.map(s => s.symbol))];

  // Filter signals
  const filteredSignals = signals.filter(s => {
    if (s.status === 'ACTIVE' || s.status === 'CANCELLED') return false;
    
    if (symbolFilter !== 'all' && s.symbol !== symbolFilter) return false;
    
    if (periodFilter === 'week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return s.createdAt >= weekAgo;
    }
    if (periodFilter === 'month') {
      const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return s.createdAt >= monthAgo;
    }
    return true;
  });

  // Calculate filtered stats
  const filteredStats = {
    total: filteredSignals.length,
    wins: filteredSignals.filter(s => s.status === 'WIN').length,
    losses: filteredSignals.filter(s => s.status === 'LOSS').length,
    winRate: filteredSignals.length > 0 
      ? (filteredSignals.filter(s => s.status === 'WIN').length / filteredSignals.length) * 100 
      : 0,
    totalPnl: filteredSignals.reduce((acc, s) => acc + (s.pnlPercent || 0), 0),
    avgLeverage: filteredSignals.length > 0
      ? filteredSignals.reduce((acc, s) => acc + s.leverage, 0) / filteredSignals.length
      : 0,
  };

  // Group by symbol for analysis
  const symbolStats = symbols.map(symbol => {
    const symbolSignals = filteredSignals.filter(s => s.symbol === symbol);
    const wins = symbolSignals.filter(s => s.status === 'WIN').length;
    return {
      symbol,
      total: symbolSignals.length,
      wins,
      losses: symbolSignals.length - wins,
      winRate: symbolSignals.length > 0 ? (wins / symbolSignals.length) * 100 : 0,
      totalPnl: symbolSignals.reduce((acc, s) => acc + (s.pnlPercent || 0), 0),
    };
  }).sort((a, b) => b.winRate - a.winRate);

  // Group by leverage
  const leverageStats = [1, 2, 3, 5, 10].map(lev => {
    const levSignals = filteredSignals.filter(s => s.leverage === lev);
    const wins = levSignals.filter(s => s.status === 'WIN').length;
    return {
      leverage: lev,
      total: levSignals.length,
      wins,
      winRate: levSignals.length > 0 ? (wins / levSignals.length) * 100 : 0,
    };
  }).filter(s => s.total > 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={periodFilter} onValueChange={(v: any) => setPeriodFilter(v)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 기간</SelectItem>
              <SelectItem value="week">최근 7일</SelectItem>
              <SelectItem value="month">최근 30일</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Select value={symbolFilter} onValueChange={setSymbolFilter}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 코인</SelectItem>
            {symbols.map(symbol => (
              <SelectItem key={symbol} value={symbol}>{symbol}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="trading-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">승률</span>
          </div>
          <p className={cn(
            "text-2xl font-bold",
            filteredStats.winRate >= 50 ? "text-long" : "text-short"
          )}>
            {filteredStats.winRate.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {filteredStats.wins}승 {filteredStats.losses}패
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="trading-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">총 수익률</span>
          </div>
          <p className={cn(
            "text-2xl font-bold",
            filteredStats.totalPnl >= 0 ? "text-long" : "text-short"
          )}>
            {filteredStats.totalPnl >= 0 ? '+' : ''}{filteredStats.totalPnl.toFixed(1)}%
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="trading-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <BarChart3 className="w-4 h-4" />
            <span className="text-sm">총 거래</span>
          </div>
          <p className="text-2xl font-bold">{filteredStats.total}</p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="trading-card p-4"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Zap className="w-4 h-4" />
            <span className="text-sm">평균 레버리지</span>
          </div>
          <p className="text-2xl font-bold">{filteredStats.avgLeverage.toFixed(1)}x</p>
        </motion.div>
      </div>

      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            거래 히스토리
          </TabsTrigger>
          <TabsTrigger value="by-coin" className="flex items-center gap-2">
            <PieChart className="w-4 h-4" />
            코인별 분석
          </TabsTrigger>
          <TabsTrigger value="by-leverage" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            레버리지별
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            AI 리뷰
          </TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-3">
          {filteredSignals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              종료된 거래가 없습니다
            </div>
          ) : (
            filteredSignals.slice(0, 20).map((signal, index) => (
              <SignalHistoryItem key={signal.id} signal={signal} index={index} />
            ))
          )}
        </TabsContent>

        {/* By Coin Tab */}
        <TabsContent value="by-coin" className="space-y-3">
          {symbolStats.map((stat, index) => (
            <motion.div
              key={stat.symbol}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="trading-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{stat.symbol}</span>
                  <span className="text-sm text-muted-foreground">
                    {stat.total}건
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className={cn(
                      "font-semibold",
                      stat.winRate >= 50 ? "text-long" : "text-short"
                    )}>
                      {stat.winRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.wins}승 {stat.losses}패
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "font-semibold",
                      stat.totalPnl >= 0 ? "text-long" : "text-short"
                    )}>
                      {stat.totalPnl >= 0 ? '+' : ''}{stat.totalPnl.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
              {/* Win rate bar */}
              <div className="mt-3 h-2 bg-accent rounded-full overflow-hidden">
                <div 
                  className="h-full bg-long rounded-full transition-all"
                  style={{ width: `${stat.winRate}%` }}
                />
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* By Leverage Tab */}
        <TabsContent value="by-leverage" className="space-y-3">
          {leverageStats.map((stat, index) => (
            <motion.div
              key={stat.leverage}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="trading-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold">{stat.leverage}x</span>
                  <span className="text-sm text-muted-foreground">
                    레버리지
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {stat.total}건
                  </span>
                  <div className="text-right">
                    <p className={cn(
                      "font-semibold",
                      stat.winRate >= 50 ? "text-long" : "text-short"
                    )}>
                      {stat.winRate.toFixed(1)}%
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat.wins}승
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </TabsContent>

        {/* AI Reviews Tab */}
        <TabsContent value="reviews" className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              AI 리뷰가 아직 없습니다
            </div>
          ) : (
            reviews.map((review, index) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="trading-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(review.createdAt, { addSuffix: true, locale: ko })}
                    </span>
                  </div>
                  {review.winRateThisPeriod !== null && (
                    <span className={cn(
                      "text-sm font-semibold",
                      review.winRateThisPeriod >= 50 ? "text-long" : "text-short"
                    )}>
                      승률 {review.winRateThisPeriod.toFixed(1)}%
                    </span>
                  )}
                </div>

                <div className="prose prose-sm prose-invert max-w-none">
                  <ReactMarkdown>{review.reviewContent}</ReactMarkdown>
                </div>

                {(review.whatWentWell || review.whatToImprove || review.lessonsLearned) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                    {review.whatWentWell && (
                      <div>
                        <h4 className="text-sm font-semibold text-long mb-2">✅ 잘한 점</h4>
                        <p className="text-sm text-muted-foreground">{review.whatWentWell}</p>
                      </div>
                    )}
                    {review.whatToImprove && (
                      <div>
                        <h4 className="text-sm font-semibold text-short mb-2">⚠️ 개선할 점</h4>
                        <p className="text-sm text-muted-foreground">{review.whatToImprove}</p>
                      </div>
                    )}
                    {review.lessonsLearned && (
                      <div>
                        <h4 className="text-sm font-semibold text-primary mb-2">💡 배운 교훈</h4>
                        <p className="text-sm text-muted-foreground">{review.lessonsLearned}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SignalHistoryItem({ signal, index }: { signal: AISignal; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "trading-card p-4 border-l-4",
        signal.status === 'WIN' && "border-l-long",
        signal.status === 'LOSS' && "border-l-short"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {signal.status === 'WIN' ? (
            <CheckCircle2 className="w-5 h-5 text-long" />
          ) : (
            <XCircle className="w-5 h-5 text-short" />
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{signal.symbol}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded",
                signal.position === 'LONG' ? "bg-long/20 text-long" : "bg-short/20 text-short"
              )}>
                {signal.position}
              </span>
              <span className="text-xs text-muted-foreground">{signal.leverage}x</span>
              {signal.isUrgent && (
                <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-500">
                  긴급
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              진입: ${signal.entryPrice.toLocaleString()} → 청산: ${signal.closePrice?.toLocaleString() || '-'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className={cn(
            "font-semibold",
            (signal.pnlPercent || 0) >= 0 ? "text-long" : "text-short"
          )}>
            {(signal.pnlPercent || 0) >= 0 ? '+' : ''}{signal.pnlPercent?.toFixed(2) || '0'}%
          </p>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(signal.createdAt, { addSuffix: true, locale: ko })}
          </p>
        </div>
      </div>
      {signal.evidenceReasoning && (
        <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-border">
          {signal.evidenceReasoning}
        </p>
      )}
    </motion.div>
  );
}
