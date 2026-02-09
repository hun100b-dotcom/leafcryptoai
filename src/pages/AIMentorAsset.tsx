import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Bot, TrendingUp, TrendingDown, Award, Brain, 
  Target, Zap, Trophy, Star, ChevronUp, BookOpen, Settings,
  RefreshCw, Loader2, CheckCircle2, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAISignals } from '@/hooks/useAISignals';
import { useUserPositions } from '@/hooks/useUserPositions';
import { AIGrowthChart } from '@/components/ai-mentor/AIGrowthChart';
import { AITierBadge } from '@/components/ai-mentor/AITierBadge';
import { AILearningLog } from '@/components/ai-mentor/AILearningLog';
import { WhitelistSettings } from '@/components/ai-mentor/WhitelistSettings';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const AI_INITIAL_SEED = 1000; // $1,000 starting capital

export default function AIMentorAsset() {
  const { signals, stats, reviews, refetch } = useAISignals();
  const { settings } = useUserPositions();
  const [showSettings, setShowSettings] = useState(false);
  const [isGeneratingReview, setIsGeneratingReview] = useState(false);

  // Calculate AI's virtual asset based on trading history
  const aiAssetData = useMemo(() => {
    const completedSignals = signals.filter(s => s.status === 'WIN' || s.status === 'LOSS');
    
    // Calculate cumulative returns
    let cumulativeReturn = 0;
    const assetHistory: { date: Date; asset: number; pnl: number }[] = [];
    
    // Sort by date ascending for proper cumulative calculation
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

  // Calculate AI tier based on performance
  const aiTier = useMemo(() => {
    const { totalReturnPercent, completedTrades, reviewCount } = aiAssetData;
    const score = totalReturnPercent * 2 + completedTrades * 5 + reviewCount * 10;

    if (score >= 500) return { name: '마스터', level: 5, color: 'text-purple-500', bg: 'bg-purple-500/20', icon: Trophy };
    if (score >= 300) return { name: '다이아몬드', level: 4, color: 'text-cyan-400', bg: 'bg-cyan-400/20', icon: Star };
    if (score >= 150) return { name: '골드', level: 3, color: 'text-yellow-500', bg: 'bg-yellow-500/20', icon: Award };
    if (score >= 50) return { name: '실버', level: 2, color: 'text-gray-400', bg: 'bg-gray-400/20', icon: Target };
    return { name: '브론즈', level: 1, color: 'text-orange-600', bg: 'bg-orange-600/20', icon: Zap };
  }, [aiAssetData]);

  // Calculate growth gauge (intelligence level)
  const intelligenceLevel = useMemo(() => {
    const baseLevel = 50;
    const tradesBonus = Math.min(aiAssetData.completedTrades * 2, 30);
    const reviewBonus = Math.min(aiAssetData.reviewCount * 5, 15);
    const performanceBonus = Math.min(Math.max(stats.winRate - 50, 0), 5);
    return Math.min(baseLevel + tradesBonus + reviewBonus + performanceBonus, 100);
  }, [aiAssetData, stats]);

  // Trigger self-review
  const handleGenerateReview = async () => {
    setIsGeneratingReview(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-self-review');
      if (error) throw error;
      toast.success('AI 자기 복기가 생성되었습니다');
      await refetch();
    } catch (err) {
      console.error('Failed to generate review:', err);
      toast.error('복기 생성에 실패했습니다');
    } finally {
      setIsGeneratingReview(false);
    }
  };

  // Get completed signals for per-trade review
  const completedSignals = useMemo(() => 
    signals.filter(s => s.status === 'WIN' || s.status === 'LOSS')
      .sort((a, b) => new Date(b.closedAt || b.createdAt).getTime() - new Date(a.closedAt || a.createdAt).getTime()),
    [signals]
  );

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
              <h1 className="text-lg font-bold">AI 멘토 자산 & 성장</h1>
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
        {/* Top Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Current Asset */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">AI 현재 자산</span>
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

          {/* Total Return */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
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

          {/* AI Tier */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className={cn("border", aiTier.bg, `border-current/20`)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">AI 등급</span>
                  <aiTier.icon className={cn("w-4 h-4", aiTier.color)} />
                </div>
                <div className="flex items-center gap-2">
                  <AITierBadge tier={aiTier} />
                  <span className={cn("text-lg font-bold", aiTier.color)}>
                    {aiTier.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  레벨 {aiTier.level}/5
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Intelligence Growth */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border-violet-500/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">AI 지능 레벨</span>
                  <Brain className="w-4 h-4 text-violet-500" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl font-bold text-violet-500">{intelligenceLevel}%</span>
                  <motion.div
                    animate={{ y: [0, -3, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <ChevronUp className="w-4 h-4 text-violet-500" />
                  </motion.div>
                </div>
                <Progress value={intelligenceLevel} className="h-2 bg-violet-500/20" />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="growth" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              성장 곡선
            </TabsTrigger>
            <TabsTrigger value="learning" className="gap-2">
              <BookOpen className="w-4 h-4" />
              학습 로그
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <Brain className="w-4 h-4" />
              자기 복기
            </TabsTrigger>
          </TabsList>

          <TabsContent value="growth">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  자산 성장 곡선
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

          <TabsContent value="learning">
            <AILearningLog signals={signals} />
          </TabsContent>

          <TabsContent value="reviews">
            <div className="space-y-6">
              {/* Generate Review Button */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-violet-500" />
                      AI 자기 복기 기록
                    </div>
                    <Button 
                      size="sm" 
                      onClick={handleGenerateReview}
                      disabled={isGeneratingReview}
                      className="gap-2"
                    >
                      {isGeneratingReview ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4" />
                      )}
                      복기 생성
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Reviews - Overall Summary */}
                  {reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                      <p className="text-muted-foreground mb-2">아직 복기 기록이 없습니다</p>
                      <p className="text-xs text-muted-foreground">상단 "복기 생성" 버튼을 눌러 AI가 최근 거래를 분석하도록 하세요.</p>
                    </div>
                  ) : (
                    reviews.map((review) => (
                      <div 
                        key={review.id} 
                        className="p-5 rounded-lg bg-gradient-to-br from-violet-500/5 to-primary/5 border border-violet-500/20 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Bot className="w-5 h-5 text-violet-500" />
                            <span className="font-semibold text-violet-500">AI 멘토 총평</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {review.winRateThisPeriod !== null && (
                              <Badge variant="outline" className={cn(
                                review.winRateThisPeriod >= 50 ? "border-long text-long" : "border-short text-short"
                              )}>
                                승률 {review.winRateThisPeriod.toFixed(1)}%
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground">
                              {review.periodStart.toLocaleDateString('ko-KR')} ~ {review.periodEnd.toLocaleDateString('ko-KR')}
                            </span>
                          </div>
                        </div>
                        
                        {/* Review Content in Markdown */}
                        <div className="prose prose-sm prose-invert max-w-none text-sm text-foreground/90 leading-relaxed">
                          <ReactMarkdown>{review.reviewContent}</ReactMarkdown>
                        </div>

                        {/* What went well & what to improve side by side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {review.whatWentWell && (
                            <div className="p-3 rounded-lg bg-long/5 border border-long/20">
                              <p className="text-xs font-semibold text-long mb-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> 잘한 점
                              </p>
                              <p className="text-xs text-foreground/80">{review.whatWentWell}</p>
                            </div>
                          )}
                          {review.whatToImprove && (
                            <div className="p-3 rounded-lg bg-short/5 border border-short/20">
                              <p className="text-xs font-semibold text-short mb-1 flex items-center gap-1">
                                <XCircle className="w-3 h-3" /> 개선할 점
                              </p>
                              <p className="text-xs text-foreground/80">{review.whatToImprove}</p>
                            </div>
                          )}
                        </div>

                        {review.lessonsLearned && (
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs font-semibold text-primary mb-1 flex items-center gap-1">
                              💡 깨달은 점 & 학습 내용
                            </p>
                            <p className="text-xs text-foreground/80">{review.lessonsLearned}</p>
                          </div>
                        )}

                        <p className="text-[10px] text-muted-foreground/60 text-right">
                          분석 대상: {review.signalsReviewed}건의 거래
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Per-Trade Review Section */}
              {completedSignals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="w-5 h-5 text-primary" />
                      포지션별 복기 기록 ({completedSignals.length}건)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 max-h-[600px] overflow-y-auto">
                    {completedSignals.map((signal) => {
                      const pnl = signal.pnlPercent || 0;
                      const isWin = signal.status === 'WIN';
                      const entryDate = signal.createdAt.toLocaleDateString('ko-KR');
                      const closeDate = signal.closedAt?.toLocaleDateString('ko-KR') || '';
                      
                      return (
                        <div
                          key={signal.id}
                          className={cn(
                            "p-4 rounded-lg border-l-4",
                            isWin ? "border-l-long bg-long/5 border border-long/10" : "border-l-short bg-short/5 border border-short/10"
                          )}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {isWin ? <CheckCircle2 className="w-4 h-4 text-long" /> : <XCircle className="w-4 h-4 text-short" />}
                              <span className="font-bold">{signal.symbol}</span>
                              <Badge variant="outline" className={cn(
                                "text-[10px]",
                                signal.position === 'LONG' ? 'text-long border-long' : 'text-short border-short'
                              )}>
                                {signal.position} {signal.leverage}x
                              </Badge>
                            </div>
                            <span className={cn(
                              "font-bold font-mono",
                              pnl >= 0 ? "text-long" : "text-short"
                            )}>
                              {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground mb-2">
                            <div>
                              <span className="text-muted-foreground/60">진입가</span>
                              <p className="font-mono">${signal.entryPrice.toLocaleString()}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground/60">종료가</span>
                              <p className="font-mono">${signal.closePrice?.toLocaleString() || '-'}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground/60">기간</span>
                              <p>{entryDate} ~ {closeDate}</p>
                            </div>
                          </div>

                          {signal.evidenceReasoning && (
                            <div className="p-2 rounded bg-accent/50 text-xs text-muted-foreground">
                              <span className="font-semibold text-foreground">진입 근거: </span>
                              {signal.evidenceReasoning}
                            </div>
                          )}

                          <div className="mt-2 pt-2 border-t border-border">
                            <div className="flex items-center gap-2 text-xs">
                              <Brain className="w-3 h-3 text-violet-500" />
                              <span className="text-violet-500">
                                이 거래로 AI 지능이 +0.5% 향상되었습니다
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}
            </div>
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

      {/* Whitelist Settings Modal */}
      <WhitelistSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
}
