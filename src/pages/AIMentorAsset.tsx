import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Bot, TrendingUp, TrendingDown, 
  Brain, Settings, Dna, RefreshCw, BarChart3, Shield, Activity
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAISignals } from '@/hooks/useAISignals';
import { useUserPositions } from '@/hooks/useUserPositions';
import { useEvolutionaryEngine } from '@/hooks/useEvolutionaryEngine';
import { AIGrowthChart } from '@/components/ai-mentor/AIGrowthChart';
import { AILearningLog } from '@/components/ai-mentor/AILearningLog';
import { WhitelistSettings } from '@/components/ai-mentor/WhitelistSettings';
import { EvolutionaryStatsPanel } from '@/components/EvolutionaryStatsPanel';
import { SelfCorrectionReport } from '@/components/SelfCorrectionReport';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const AI_INITIAL_SEED = 10000; // $10,000 starting capital

export default function AIMentorAsset() {
  const { signals, stats, reviews, refetch } = useAISignals();
  const { settings } = useUserPositions();
  const [showSettings, setShowSettings] = useState(false);
  
  const { dualMemory, evolutionaryStats, kellyCriterion } = useEvolutionaryEngine(signals);

  // Calculate AI's virtual asset based on trading history
  const aiAssetData = useMemo(() => {
    const completedSignals = signals.filter(s => s.status === 'WIN' || s.status === 'LOSS');
    
    let cumulativeReturn = 0;
    const assetHistory: { date: Date; asset: number; pnl: number }[] = [];
    
    const sortedSignals = [...completedSignals].sort(
      (a, b) => new Date(a.closedAt || a.createdAt).getTime() - new Date(b.closedAt || b.createdAt).getTime()
    );

    sortedSignals.forEach((signal) => {
      const pnlPercent = signal.pnlPercent || 0;
      cumulativeReturn += pnlPercent;
      
      assetHistory.push({
        date: new Date(signal.closedAt || signal.createdAt),
        asset: AI_INITIAL_SEED * (1 + cumulativeReturn / 100),
        pnl: pnlPercent,
      });
    });

    const currentAsset = AI_INITIAL_SEED * (1 + stats.totalPnl / 100);
    const totalReturnPercent = stats.totalPnl;
    const totalReturnAmount = currentAsset - AI_INITIAL_SEED;

    return {
      initialSeed: AI_INITIAL_SEED,
      currentAsset,
      totalReturnPercent,
      totalReturnAmount,
      assetHistory,
      completedTrades: completedSignals.length,
      reviewCount: reviews.length,
    };
  }, [signals, stats, reviews]);

  // Professional financial metrics
  const proMetrics = useMemo(() => {
    const completedSignals = signals.filter(s => s.status === 'WIN' || s.status === 'LOSS');
    const pnlValues = completedSignals.map(s => s.pnlPercent || 0);
    
    // MDD (Maximum Drawdown)
    let peak = AI_INITIAL_SEED;
    let maxDrawdown = 0;
    let running = AI_INITIAL_SEED;
    const sortedSignals = [...completedSignals].sort(
      (a, b) => new Date(a.closedAt || a.createdAt).getTime() - new Date(b.closedAt || b.createdAt).getTime()
    );
    sortedSignals.forEach(s => {
      running = running * (1 + (s.pnlPercent || 0) / 100);
      if (running > peak) peak = running;
      const dd = (peak - running) / peak * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });

    // Sharpe Ratio (simplified daily)
    const avgReturn = pnlValues.length > 0 ? pnlValues.reduce((a, b) => a + b, 0) / pnlValues.length : 0;
    const variance = pnlValues.length > 1
      ? pnlValues.reduce((acc, v) => acc + Math.pow(v - avgReturn, 2), 0) / (pnlValues.length - 1)
      : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0;

    // Profit Factor
    const grossProfit = pnlValues.filter(v => v > 0).reduce((a, b) => a + b, 0);
    const grossLoss = Math.abs(pnlValues.filter(v => v < 0).reduce((a, b) => a + b, 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;

    // ATR proxy (avg absolute PnL)
    const atr = pnlValues.length > 0 
      ? pnlValues.reduce((a, b) => a + Math.abs(b), 0) / pnlValues.length 
      : 0;

    return {
      mdd: maxDrawdown,
      sharpeRatio,
      profitFactor: profitFactor === Infinity ? 999 : profitFactor,
      atr,
      winRate: stats.winRate,
    };
  }, [signals, stats]);

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                대시보드로 돌아가기
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Bot className="w-6 h-6 text-primary" />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-long animate-pulse" />
              </div>
              <h1 className="text-lg font-bold">Leaf-Master Quantitative Dashboard</h1>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="w-4 h-4" />
            화이트리스트 설정
          </Button>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        {/* Professional Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* MDD */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-short/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">MDD</span>
                  <TrendingDown className="w-4 h-4 text-short" />
                </div>
                <p className="text-xl font-bold font-mono text-short">
                  -{proMetrics.mdd.toFixed(2)}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">최대 낙폭</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sharpe Ratio */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className={cn("border", proMetrics.sharpeRatio >= 1 ? "border-long/20" : "border-border")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Sharpe Ratio</span>
                  <BarChart3 className="w-4 h-4 text-primary" />
                </div>
                <p className={cn("text-xl font-bold font-mono", proMetrics.sharpeRatio >= 1 ? "text-long" : "text-foreground")}>
                  {proMetrics.sharpeRatio.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">위험 조정 수익률</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Win Rate */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={cn("border", proMetrics.winRate >= 50 ? "border-long/20" : "border-short/20")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Win Rate</span>
                  <Activity className="w-4 h-4 text-primary" />
                </div>
                <p className={cn("text-xl font-bold font-mono", proMetrics.winRate >= 50 ? "text-long" : "text-short")}>
                  {proMetrics.winRate.toFixed(1)}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">{stats.totalSignals}건 기준</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Profit Factor */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className={cn("border", proMetrics.profitFactor >= 1.5 ? "border-long/20" : "border-border")}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">Profit Factor</span>
                  <Shield className="w-4 h-4 text-primary" />
                </div>
                <p className={cn("text-xl font-bold font-mono", proMetrics.profitFactor >= 1.5 ? "text-long" : "text-foreground")}>
                  {proMetrics.profitFactor >= 999 ? '∞' : proMetrics.profitFactor.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">총이익/총손실</p>
              </CardContent>
            </Card>
          </motion.div>

          {/* ATR */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">ATR (Avg)</span>
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-xl font-bold font-mono">
                  {proMetrics.atr.toFixed(2)}%
                </p>
                <p className="text-[10px] text-muted-foreground mt-1">평균 변동폭</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Asset Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">현재 자산</span>
                  <TrendingUp className="w-4 h-4 text-primary" />
                </div>
                <p className="text-2xl font-bold font-mono">
                  ${aiAssetData.currentAsset.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  초기 시드: ${AI_INITIAL_SEED.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className={cn(
              "border",
              aiAssetData.totalReturnPercent >= 0 
                ? "bg-long/5 border-long/20" 
                : "bg-short/5 border-short/20"
            )}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">누적 수익률</span>
                  {aiAssetData.totalReturnPercent >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-long" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-short" />
                  )}
                </div>
                <p className={cn(
                  "text-2xl font-bold font-mono",
                  aiAssetData.totalReturnPercent >= 0 ? "text-long" : "text-short"
                )}>
                  {aiAssetData.totalReturnPercent >= 0 ? '+' : ''}
                  {aiAssetData.totalReturnPercent.toFixed(2)}%
                </p>
                <p className={cn(
                  "text-xs mt-1",
                  aiAssetData.totalReturnAmount >= 0 ? "text-long/80" : "text-short/80"
                )}>
                  {aiAssetData.totalReturnAmount >= 0 ? '+' : ''}
                  ${aiAssetData.totalReturnAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full max-w-lg">
            <TabsTrigger value="growth" className="gap-1 text-xs">
              <TrendingUp className="w-3.5 h-3.5" />
              Equity Curve
            </TabsTrigger>
            <TabsTrigger value="evolution" className="gap-1 text-xs">
              <Dna className="w-3.5 h-3.5" />
              분석 엔진
            </TabsTrigger>
            <TabsTrigger value="learning" className="gap-1 text-xs">
              <BarChart3 className="w-3.5 h-3.5" />
              학습 로그
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1 text-xs">
              <Brain className="w-3.5 h-3.5" />
              자기 복기
            </TabsTrigger>
          </TabsList>

          <TabsContent value="growth">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Equity Curve ($10,000 Seed)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIGrowthChart 
                  assetHistory={aiAssetData.assetHistory} 
                  initialSeed={AI_INITIAL_SEED}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evolution">
            <EvolutionaryStatsPanel
              stats={evolutionaryStats}
              kelly={kellyCriterion}
              memory={dualMemory}
            />
          </TabsContent>

          <TabsContent value="learning">
            <AILearningLog signals={signals} />
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-violet-500" />
                    자기 복기 기록
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {
                      refetch();
                      toast.success('복기 데이터를 새로고침했습니다');
                    }}
                    className="gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    새로고침
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dualMemory.weightAdjustments.length > 0 && (
                  <SelfCorrectionReport
                    adjustments={dualMemory.weightAdjustments}
                    stats={evolutionaryStats}
                  />
                )}

                {reviews.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    아직 복기 기록이 없습니다
                  </p>
                ) : (
                  reviews.map((review) => (
                    <div 
                      key={review.id} 
                      className="p-4 rounded-lg bg-accent/50 border border-border space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          {review.periodStart.toLocaleDateString()} ~ {review.periodEnd.toLocaleDateString()}
                        </span>
                        {review.winRateThisPeriod !== null && (
                          <span className={cn(
                            "text-sm font-mono",
                            review.winRateThisPeriod >= 50 ? "text-long" : "text-short"
                          )}>
                            승률 {review.winRateThisPeriod.toFixed(1)}%
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-foreground/90">{review.reviewContent}</p>
                      {review.lessonsLearned && (
                        <div className="text-xs bg-primary/10 rounded p-2">
                          💡 {review.lessonsLearned}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-primary">{stats.totalSignals}</p>
              <p className="text-xs text-muted-foreground">완료된 거래</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-long">{stats.wins}</p>
              <p className="text-xs text-muted-foreground">승리</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-short">{stats.losses}</p>
              <p className="text-xs text-muted-foreground">패배</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className={cn(
                "text-2xl font-bold",
                stats.winRate >= 50 ? "text-long" : "text-short"
              )}>
                {stats.winRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">승률</p>
            </CardContent>
          </Card>
        </div>
      </main>

      <WhitelistSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
}