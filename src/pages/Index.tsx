import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { CoinList } from '@/components/CoinList';
import { ActionCard } from '@/components/ActionCard';
import { TradingViewChart } from '@/components/TradingViewChart';
import { SentimentGauge } from '@/components/SentimentGauge';
import { AITimelineEnhanced } from '@/components/AITimelineEnhanced';
import { Footer } from '@/components/Footer';
import { PerformanceModal } from '@/components/PerformanceModal';
import { AIMentorChat } from '@/components/AIMentorChat';
import { AIAdvicePanel } from '@/components/AIAdvicePanel';
import { CircuitBreakerGauge } from '@/components/CircuitBreakerGauge';
import { TradeFootprintsOverlay } from '@/components/TradeFootprintsOverlay';
import { MobileStickyBar } from '@/components/MobileStickyBar';
import { SelfCorrectionReport } from '@/components/SelfCorrectionReport';
import { useBinancePrice } from '@/hooks/useBinancePrice';
import { useSignals } from '@/hooks/useSignals';
import { useAISignals } from '@/hooks/useAISignals';
import { useUserPositions } from '@/hooks/useUserPositions';
import { useBinanceLongShortRatio } from '@/hooks/useBinanceLongShortRatio';
import { useCircuitBreaker } from '@/hooks/useCircuitBreaker';
import { useEvolutionaryEngine } from '@/hooks/useEvolutionaryEngine';
import { mockNews } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Bot, Bell } from 'lucide-react';

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  
  const { coins, isConnected } = useBinancePrice();
  const { signals, stats, isLoading: signalsLoading } = useSignals();
  const { signals: aiSignals, stats: aiStats, advices } = useAISignals();
  const { positions, stats: userStats, settings } = useUserPositions();
  const { data: ratioData } = useBinanceLongShortRatio(selectedSymbol);
  
  // Circuit Breaker 리스크 엔진
  const circuitBreakerState = useCircuitBreaker(aiSignals);
  
  // 자기 진화형 학습 엔진 - 대시보드에 자가 수정 결과 표시
  const { dualMemory, evolutionaryStats } = useEvolutionaryEngine(aiSignals);

  const selectedCoin = useMemo(
    () => coins.find(c => c.symbol === selectedSymbol) || coins[0],
    [selectedSymbol, coins]
  );

  const activeAISignal = useMemo(
    () => aiSignals.find(s => s.symbol === selectedSymbol && s.status === 'ACTIVE'),
    [selectedSymbol, aiSignals]
  );

  const filteredAISignals = useMemo(
    () => aiSignals.filter(s => s.symbol === selectedSymbol),
    [selectedSymbol, aiSignals]
  );

  const activeUserPosition = useMemo(
    () => positions.find(p => p.symbol === selectedSymbol && p.status === 'ACTIVE'),
    [selectedSymbol, positions]
  );

  const aiSignalsForPerformance = useMemo(() => {
    return aiSignals.map((s) => ({
      id: s.id,
      symbol: s.symbol,
      position: s.position,
      entryPrice: s.entryPrice,
      targetPrice: s.targetPrice,
      stopLoss: s.stopLoss,
      leverage: s.leverage,
      timestamp: s.createdAt,
      confidence: s.confidence,
      status: (s.status === 'CANCELLED' ? 'PENDING' : s.status) as any,
      message: s.evidenceReasoning ?? '',
      closedAt: s.closedAt ?? undefined,
      closePrice: s.closePrice ?? undefined,
    }));
  }, [aiSignals]);

  const aiStatsForPerformance = useMemo(() => {
    return {
      totalSignals: aiSignalsForPerformance.length,
      completedSignals: aiStats.totalSignals,
      wins: aiStats.wins,
      losses: aiStats.losses,
      winRate: Math.round(aiStats.winRate),
      totalPnL: Math.round(aiStats.totalPnl * 10) / 10,
    };
  }, [aiSignalsForPerformance, aiStats]);

  const activeSignalsCount = aiSignals.filter(s => s.status === 'ACTIVE').length;

  return (
    <div className="min-h-screen flex flex-col bg-background max-w-[100vw] overflow-x-hidden">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50">
        <Header 
          totalWinRate={aiStatsForPerformance.winRate} 
          totalPnL={aiStatsForPerformance.totalPnL} 
          totalSignals={aiStatsForPerformance.completedSignals}
          isConnected={isConnected}
          onOpenPerformance={() => setIsPerformanceOpen(true)}
        />
      </div>
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Coin List (데스크톱만) */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 border-r border-border bg-card/30 hidden lg:block flex-shrink-0"
        >
          <CoinList
            coins={coins}
            selectedSymbol={selectedSymbol}
            onSelectCoin={setSelectedSymbol}
          />
        </motion.aside>

        {/* Center - Chart & Action Card */}
        <main className="flex-1 flex flex-col overflow-y-auto scrollbar-thin p-3 sm:p-6 gap-4 sm:gap-6 min-w-0">
          {/* 모바일: 코인 선택 횡스크롤 */}
          <div className="flex gap-2 overflow-x-auto scrollbar-thin lg:hidden pb-2">
            {coins.slice(0, 8).map(c => (
              <button
                key={c.symbol}
                onClick={() => setSelectedSymbol(c.symbol)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  selectedSymbol === c.symbol
                    ? 'bg-primary/20 border-primary text-primary'
                    : 'bg-card border-border text-muted-foreground'
                }`}
              >
                {c.symbol}
              </button>
            ))}
          </div>

          {selectedCoin && (
            <>
              <motion.div
                key={selectedSymbol + '-action'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ActionCard
                  coin={selectedCoin}
                  activeAISignal={activeAISignal}
                  longRatio={ratioData?.longRatio}
                  circuitBreaker={circuitBreakerState}
                />
              </motion.div>

              {/* TradingView Chart + Trade Footprints */}
              <motion.div
                key={selectedSymbol + '-chart'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="trading-card p-0 overflow-hidden relative"
                style={{ height: 'clamp(300px, 50vh, 500px)' }}
              >
                <TradingViewChart symbol={selectedSymbol} />
                <TradeFootprintsOverlay
                  signals={filteredAISignals.length > 0 ? filteredAISignals : aiSignals.slice(0, 5)}
                />
              </motion.div>
            </>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SentimentGauge symbol={selectedSymbol} news={mockNews} />
          </motion.div>

          {/* 모바일: AI 리딩 섹션 (xl 이하에서 표시) */}
          <div className="xl:hidden space-y-4">
            {/* 자가 수정 보고 (가중치 변경 있을 때만) */}
            {dualMemory.weightAdjustments.length > 0 && (
              <SelfCorrectionReport
                adjustments={dualMemory.weightAdjustments}
                stats={evolutionaryStats}
                compact
              />
            )}
            <div className="trading-card overflow-hidden" style={{ maxHeight: '60vh' }}>
              <AITimelineEnhanced
                signals={filteredAISignals.length > 0 ? filteredAISignals : aiSignals.slice(0, 5)}
                userAsset={userStats.currentAsset}
              />
            </div>
            <div className="trading-card p-3">
              <div className="flex items-center gap-2 mb-2">
                <Bell className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">AI 조언 및 긴급알림</span>
              </div>
              <AIAdvicePanel />
            </div>
          </div>
        </main>

        {/* Right Sidebar - AI 탭 (데스크톱) */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-96 border-l border-border bg-card/30 hidden xl:flex flex-col justify-start overflow-y-auto scrollbar-thin flex-shrink-0"
        >
          <Tabs defaultValue="ai" className="flex-1 flex flex-col justify-start">
            <TabsList className="w-full grid grid-cols-1 h-auto p-0 rounded-none bg-card border-b border-border">
              <TabsTrigger 
                value="ai" 
                className="flex items-center gap-1 text-xs py-2.5 rounded-none data-[state=active]:bg-primary/10 data-[state=active]:text-primary border-b-2 border-transparent data-[state=active]:border-primary"
              >
                <Bot className="w-3 h-3" />
                AI 리딩
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai" className="flex-1 flex flex-col overflow-hidden m-0 p-0">
              {/* Circuit Breaker 게이지 */}
              <div className="p-2 border-b border-border">
                <CircuitBreakerGauge state={circuitBreakerState} compact />
              </div>

              {/* 자가 수정 보고 (데스크톱 사이드바) */}
              {dualMemory.weightAdjustments.length > 0 && (
                <div className="p-2 border-b border-border">
                  <SelfCorrectionReport
                    adjustments={dualMemory.weightAdjustments}
                    stats={evolutionaryStats}
                    compact
                  />
                </div>
              )}

              <ResizablePanelGroup direction="vertical" className="flex-1">
                <ResizablePanel defaultSize={60} minSize={25}>
                  <div className="h-full overflow-hidden">
                    <AITimelineEnhanced 
                      signals={filteredAISignals.length > 0 ? filteredAISignals : aiSignals.slice(0, 5)} 
                      userAsset={userStats.currentAsset}
                    />
                  </div>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={40} minSize={20}>
                  <div className="h-full overflow-y-auto scrollbar-thin">
                    <div className="p-2 border-b border-border flex items-center gap-2 sticky top-0 bg-card/95 backdrop-blur-sm z-10">
                      <Bell className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-muted-foreground">AI 조언 및 긴급알림</span>
                    </div>
                    <div className="p-2">
                      <AIAdvicePanel />
                    </div>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </TabsContent>
          </Tabs>
        </motion.aside>
      </div>

      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* Mobile Sticky Bar */}
      <MobileStickyBar
        totalPnL={aiStatsForPerformance.totalPnL}
        winRate={aiStatsForPerformance.winRate}
        activeSignals={activeSignalsCount}
      />

      {/* AI Mentor Chat */}
      {selectedCoin && (
        <AIMentorChat
          symbol={selectedSymbol}
          currentPrice={selectedCoin.price}
          userAsset={userStats.currentAsset}
          userPosition={activeUserPosition ? {
            type: activeUserPosition.position,
            entryPrice: activeUserPosition.entryPrice,
            targetPrice: activeUserPosition.targetPrice,
            stopLoss: activeUserPosition.stopLoss,
            leverage: activeUserPosition.leverage,
          } : undefined}
          allPositions={positions.filter(p => p.status === 'ACTIVE').map(p => ({
            symbol: p.symbol,
            type: p.position,
            entryPrice: p.entryPrice,
            leverage: p.leverage,
          }))}
        />
      )}

      {/* Performance Modal */}
      <AnimatePresence>
        {isPerformanceOpen && (
          <PerformanceModal
            isOpen={isPerformanceOpen}
            onClose={() => setIsPerformanceOpen(false)}
            signals={aiSignalsForPerformance}
            stats={aiStatsForPerformance}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
