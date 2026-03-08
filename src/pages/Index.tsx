import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { CoinList } from '@/components/CoinList';
import { TradingViewChart } from '@/components/TradingViewChart';
import { SentimentGauge } from '@/components/SentimentGauge';
import { AITimelineEnhanced } from '@/components/AITimelineEnhanced';
import { Footer } from '@/components/Footer';
import { PerformanceModal } from '@/components/PerformanceModal';
import { AIMentorChat } from '@/components/AIMentorChat';
import { CircuitBreakerGauge } from '@/components/CircuitBreakerGauge';
import { TradeFootprintsOverlay } from '@/components/TradeFootprintsOverlay';
import { MobileStickyBar } from '@/components/MobileStickyBar';
import { SelfCorrectionReport } from '@/components/SelfCorrectionReport';
import { QuantMetricsBar } from '@/components/QuantMetricsBar';
import { EquityCurveMini } from '@/components/EquityCurveMini';
import { RightAnalysisPanel } from '@/components/RightAnalysisPanel';
import { AILiveThinkingLog } from '@/components/ai-mentor/AILiveThinkingLog';
import { useBinancePrice } from '@/hooks/useBinancePrice';
import { useSignals } from '@/hooks/useSignals';
import { useAISignals } from '@/hooks/useAISignals';
import { useUserPositions } from '@/hooks/useUserPositions';
import { useBinanceLongShortRatio } from '@/hooks/useBinanceLongShortRatio';
import { useCircuitBreaker } from '@/hooks/useCircuitBreaker';
import { useEvolutionaryEngine } from '@/hooks/useEvolutionaryEngine';
import { useQuantMetrics } from '@/hooks/useQuantMetrics';
import { useViewMode } from '@/contexts/ViewModeContext';
import { useAIManagedPositions } from '@/hooks/useAIManagedPositions';
import { useAutoTradingEngine } from '@/hooks/useAutoTradingEngine';
import { mockNews } from '@/data/mockData';
import { AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Zap, BarChart2, Layers } from 'lucide-react';

/* ─── Strategy Selector ─── */
type Strategy = 'conservative' | 'balanced' | 'aggressive';

const STRATEGIES: { id: Strategy; label: string; leverage: string }[] = [
  { id: 'conservative', label: '보수형', leverage: '≤5x' },
  { id: 'balanced',     label: '균형형', leverage: '≤10x' },
  { id: 'aggressive',   label: '공격형', leverage: '≤20x' },
];

/**
 * STICKY_TOP — 헤더(~52px) + 퀀트 메트릭 바(~36px) 합산 높이
 * 사이드바의 sticky top 기준점이 됩니다.
 */
const STICKY_TOP = 88; // px

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  const [strategy, setStrategy] = useState<Strategy>('balanced');
  const { isForcedMobile } = useViewMode();

  /* ── Data Hooks ── */
  const { coins, isConnected } = useBinancePrice();
  const { stats: _signalStats } = useSignals();
  const { signals: aiSignals, stats: aiStats } = useAISignals();
  const { positions, stats: userStats, settings, updateAutoTradingEnabled } = useUserPositions();
  const { data: ratioData } = useBinanceLongShortRatio(selectedSymbol);
  const circuitBreakerState = useCircuitBreaker(aiSignals);
  const { dualMemory, evolutionaryStats } = useEvolutionaryEngine(aiSignals);
  const quantMetrics = useQuantMetrics(aiSignals);
  const { positions: aiManagedPositions, joinSignal } = useAIManagedPositions();

  /* ── Derived State ── */
  const selectedCoin = useMemo(
    () => coins.find((c) => c.symbol === selectedSymbol) ?? coins[0],
    [selectedSymbol, coins],
  );

  const activeAISignal = useMemo(
    () => aiSignals.find((s) => s.symbol === selectedSymbol && s.status === 'ACTIVE'),
    [selectedSymbol, aiSignals],
  );

  const filteredAISignals = useMemo(
    () => aiSignals.filter((s) => s.symbol === selectedSymbol),
    [selectedSymbol, aiSignals],
  );

  const activeUserPosition = useMemo(
    () => positions.find((p) => p.symbol === selectedSymbol && p.status === 'ACTIVE'),
    [selectedSymbol, positions],
  );

  const aiSignalsForPerformance = useMemo(
    () =>
      aiSignals.map((s) => ({
        id: s.id,
        symbol: s.symbol,
        position: s.position,
        entryPrice: s.entryPrice,
        targetPrice: s.targetPrice,
        stopLoss: s.stopLoss,
        leverage: s.leverage,
        timestamp: s.createdAt,
        confidence: s.confidence,
        status: (s.status === 'CANCELLED' ? 'PENDING' : s.status) as 'ACTIVE' | 'WIN' | 'LOSS' | 'PENDING',
        message: s.evidenceReasoning ?? '',
        closedAt: s.closedAt ?? undefined,
        closePrice: s.closePrice ?? undefined,
      })),
    [aiSignals],
  );

  const aiStatsForPerformance = useMemo(
    () => ({
      totalSignals: aiSignalsForPerformance.length,
      completedSignals: aiStats.totalSignals,
      wins: aiStats.wins,
      losses: aiStats.losses,
      winRate: Math.round(aiStats.winRate),
      totalPnL: Math.round(aiStats.totalPnl * 10) / 10,
    }),
    [aiSignalsForPerformance, aiStats],
  );

  const activeSignalsCount = aiSignals.filter((s) => s.status === 'ACTIVE').length;

  /* ── Auto-Trading Engine ── */
  useAutoTradingEngine({
    aiSignals,
    managedPositions: aiManagedPositions,
    settings,
    userCurrentAsset: userStats.currentAsset,
    circuitBreaker: circuitBreakerState,
    joinSignal,
  });

  /* ── Shared mentor chat props ── */
  const mentorChatProps = selectedCoin
    ? {
        symbol: selectedSymbol,
        currentPrice: selectedCoin.price,
        userAsset: userStats.currentAsset,
        userPosition: activeUserPosition
          ? {
              type: activeUserPosition.position,
              entryPrice: activeUserPosition.entryPrice,
              targetPrice: activeUserPosition.targetPrice,
              stopLoss: activeUserPosition.stopLoss,
              leverage: activeUserPosition.leverage,
            }
          : undefined,
        allPositions: positions
          .filter((p) => p.status === 'ACTIVE')
          .map((p) => ({
            symbol: p.symbol,
            type: p.position,
            entryPrice: p.entryPrice,
            leverage: p.leverage,
          })),
      }
    : null;

  /* ════════════════════════════════════════════
     MOBILE LAYOUT — 단순 수직 스크롤
  ════════════════════════════════════════════ */
  if (isForcedMobile) {
    return (
      <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
        <div className="sticky top-0 z-50">
          <Header
            totalWinRate={aiStatsForPerformance.winRate}
            totalPnL={aiStatsForPerformance.totalPnL}
            totalSignals={aiStatsForPerformance.completedSignals}
            isConnected={isConnected}
            onOpenPerformance={() => setIsPerformanceOpen(true)}
            autoTradingEnabled={settings.autoTradingEnabled}
            onToggleAutoTrading={updateAutoTradingEnabled}
          />
        </div>
        <div className="px-3 py-2 border-b border-border/60">
          <QuantMetricsBar metrics={quantMetrics} compact />
        </div>
        <div className="flex gap-1.5 overflow-x-auto scrollbar-thin px-3 py-2 border-b border-border/50">
          {coins.slice(0, 8).map((c) => (
            <button
              key={c.symbol}
              onClick={() => setSelectedSymbol(c.symbol)}
              className={cn(
                'flex-shrink-0 px-3 py-1 rounded-md text-[11px] font-semibold transition-all',
                selectedSymbol === c.symbol
                  ? 'bg-primary/20 text-primary'
                  : 'bg-accent/50 text-muted-foreground hover:text-foreground',
              )}
            >
              {c.symbol}
            </button>
          ))}
        </div>
        <main className="flex-1 flex flex-col p-3 gap-3">
          {selectedCoin && (
            <div className="trading-card p-0 overflow-hidden relative" style={{ height: 'clamp(240px, 42vh, 380px)' }}>
              <TradingViewChart symbol={selectedSymbol} />
              <TradeFootprintsOverlay
                signals={filteredAISignals.length > 0 ? filteredAISignals : aiSignals.slice(0, 5)}
              />
            </div>
          )}
          <div className="trading-card overflow-hidden" style={{ maxHeight: '55vh' }}>
            <AITimelineEnhanced
              signals={filteredAISignals.length > 0 ? filteredAISignals : aiSignals.slice(0, 5)}
              userAsset={userStats.currentAsset}
            />
          </div>
          <div className="trading-card overflow-hidden">
            <AILiveThinkingLog />
          </div>
        </main>
        <MobileStickyBar
          totalPnL={aiStatsForPerformance.totalPnL}
          winRate={aiStatsForPerformance.winRate}
          activeSignals={activeSignalsCount}
        />
        {mentorChatProps && <AIMentorChat {...mentorChatProps} />}
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
  }

  /* ════════════════════════════════════════════
     DESKTOP — Sticky Sidebar Architecture
     ────────────────────────────────────────────
     구조:
       [sticky header zone]   ← 88px 고정
       [3-col grid]           ← 자연 높이로 흐름
         left  : sticky sidebar, h-[calc(100vh-88px)], overflow-y-auto (스크롤 1개)
         center: 자연 흐름 (단일 페이지 스크롤)
         right : sticky sidebar, h-[calc(100vh-88px)], overflow-y-auto (스크롤 1개)
       [AI log full-width]    ← 자연 높이
       [footer]
  ════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">

      {/* ══ STICKY HEADER ZONE ══════════════════════════════════════════════ */}
      {/* BEFORE: Header와 QuantMetrics가 각각 별도 렌더 → 위치 계산 어려움   */}
      {/* AFTER : 하나의 sticky 컨테이너로 묶어 정확한 88px 기준점 확보       */}
      <div className="sticky top-0 z-50 flex flex-col flex-shrink-0">
        <Header
          totalWinRate={aiStatsForPerformance.winRate}
          totalPnL={aiStatsForPerformance.totalPnL}
          totalSignals={aiStatsForPerformance.completedSignals}
          isConnected={isConnected}
          onOpenPerformance={() => setIsPerformanceOpen(true)}
          autoTradingEnabled={settings.autoTradingEnabled}
          onToggleAutoTrading={updateAutoTradingEnabled}
        />
        <div className="px-4 py-2 border-b border-border/50 bg-card/30 backdrop-blur-sm">
          <QuantMetricsBar metrics={quantMetrics} compact />
        </div>
      </div>

      {/* ══ 3-COLUMN GRID ══════════════════════════════════════════════════ */}
      {/* BEFORE: flex-1 overflow-hidden min-h-0 → 각 컬럼 강제 고정 높이    */}
      {/* AFTER : items-start → 컬럼들이 자연 높이로 흐름, 페이지 스크롤 가능 */}
      <div className="grid grid-cols-[220px_1fr_290px] xl:grid-cols-[240px_1fr_300px] items-start flex-1">

        {/* ── LEFT SIDEBAR — Sticky ──────────────────────────────────────── */}
        {/* BEFORE: overflow-hidden → CoinList 내부에 별도 스크롤 생성          */}
        {/* AFTER : sticky + h-[calc(100vh-88px)] + overflow-y-auto 단 1개    */}
        <aside
          className="terminal-panel-left flex flex-col overflow-y-auto scrollbar-thin"
          style={{ position: 'sticky', top: STICKY_TOP, height: `calc(100vh - ${STICKY_TOP}px)` }}
        >
          {/* Watchlist */}
          <CoinList
            coins={coins}
            selectedSymbol={selectedSymbol}
            onSelectCoin={setSelectedSymbol}
          />

          {/* Strategy Selector */}
          <div className="flex-shrink-0 border-t border-border/50 p-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <Layers className="w-3 h-3 text-muted-foreground" />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                AI 전략
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {STRATEGIES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStrategy(s.id)}
                  className={cn(
                    'p-1.5 rounded-md text-center transition-all border text-[9px]',
                    strategy === s.id
                      ? 'bg-primary/15 border-primary/35 text-primary'
                      : 'bg-accent/20 border-border/40 text-muted-foreground hover:text-foreground hover:bg-accent/40',
                  )}
                >
                  <p className="font-semibold leading-none">{s.label}</p>
                  <p className="text-muted-foreground/60 mt-0.5">{s.leverage}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Mini P&L Equity Curve */}
          <div className="flex-shrink-0 border-t border-border/50 p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <BarChart2 className="w-3 h-3 text-muted-foreground" />
                <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Equity P&amp;L
                </span>
              </div>
              <span className={cn(
                'font-mono text-[11px] font-bold',
                quantMetrics.totalReturn >= 0 ? 'text-long' : 'text-short',
              )}>
                {quantMetrics.totalReturn >= 0 ? '+' : ''}
                {quantMetrics.totalReturn.toFixed(1)}%
              </span>
            </div>
            <EquityCurveMini data={quantMetrics.equityCurve} height={64} />
          </div>
        </aside>

        {/* ── CENTER COLUMN — Natural Flow ──────────────────────────────── */}
        {/* BEFORE: flex flex-col overflow-hidden → 차트가 flex-1로 수축       */}
        {/* AFTER : 자연 흐름 → 차트는 고정 높이, 하위 콘텐츠는 그 아래로 흐름  */}
        <main className="terminal-panel-center flex flex-col min-w-0">

          {/* Coin Header Bar */}
          {selectedCoin && (
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-card/30">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm">
                  {selectedCoin.symbol}
                  <span className="text-muted-foreground font-normal">/USDT</span>
                </span>
                <span className="font-mono text-base font-bold">
                  ${selectedCoin.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
                <span className={cn(
                  'flex items-center gap-0.5 text-xs font-semibold font-mono px-1.5 py-0.5 rounded',
                  selectedCoin.change24h >= 0 ? 'text-long bg-long/10' : 'text-short bg-short/10',
                )}>
                  {selectedCoin.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {selectedCoin.change24h >= 0 ? '+' : ''}{selectedCoin.change24h.toFixed(2)}%
                </span>
              </div>

              {activeAISignal && (
                <div className={cn(
                  'ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold border',
                  activeAISignal.position === 'LONG'
                    ? 'bg-long/10 border-long/30 text-long'
                    : 'bg-short/10 border-short/30 text-short',
                )}>
                  {activeAISignal.position === 'LONG'
                    ? <TrendingUp className="w-3 h-3" />
                    : <TrendingDown className="w-3 h-3" />}
                  AI {activeAISignal.position} {activeAISignal.confidence.toFixed(0)}%
                  <Zap className="w-2.5 h-2.5 animate-pulse" />
                </div>
              )}

              {!activeAISignal && circuitBreakerState.isCoolingDown && (
                <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-short/10 border border-short/30 text-short">
                  ⚡ 서킷 브레이커
                </div>
              )}
            </div>
          )}

          {/* TradingView Chart — 고정 높이로 충분한 공간 확보 */}
          {/* BEFORE: flex-1 overflow-hidden min-h-0 → 다른 요소에 의해 수축   */}
          {/* AFTER : 고정 clamp 높이 → 항상 충분한 차트 영역 보장            */}
          {selectedCoin && (
            <div
              className="relative w-full border-b border-border/40"
              style={{ height: 'clamp(400px, 52vh, 680px)' }}
            >
              <TradingViewChart symbol={selectedSymbol} />
              <TradeFootprintsOverlay
                signals={filteredAISignals.length > 0 ? filteredAISignals : aiSignals.slice(0, 5)}
              />
            </div>
          )}

          {/* Sentiment Gauge — 자연 높이로 표시 */}
          {/* BEFORE: max-h-[200px] overflow-y-auto → 개별 스크롤 발생        */}
          {/* AFTER : 제한 없이 자연 흐름 → 페이지 스크롤에 통합              */}
          <div className="border-b border-border/40">
            <SentimentGauge symbol={selectedSymbol} news={mockNews} />
          </div>

          {/* AI Live Thinking Log — Center 하단 통합 */}
          {/* BEFORE: 별도 fixed-height 하단 패널 → 차트 공간 잠식             */}
          {/* AFTER : 중앙 컬럼 하단에 자연스럽게 배치 → 페이지 스크롤로 도달  */}
          <div className="border-b border-border/40 bg-card/15">
            <AILiveThinkingLog />
          </div>
        </main>

        {/* ── RIGHT SIDEBAR — Sticky ─────────────────────────────────────── */}
        {/* BEFORE: overflow-hidden + 내부 max-h-[45%] overflow-y-auto 중첩    */}
        {/* AFTER : sticky + 단일 overflow-y-auto → 스크롤 1개만 허용         */}
        <aside
          className="terminal-panel-right flex flex-col overflow-y-auto scrollbar-thin"
          style={{ position: 'sticky', top: STICKY_TOP, height: `calc(100vh - ${STICKY_TOP}px)` }}
        >
          {/* Self Correction Report */}
          {dualMemory.weightAdjustments.length > 0 && (
            <div className="p-2.5 border-b border-border/40 flex-shrink-0">
              <SelfCorrectionReport
                adjustments={dualMemory.weightAdjustments}
                stats={evolutionaryStats}
                compact
              />
            </div>
          )}

          {/* Circuit Breaker */}
          <div className="p-2.5 border-b border-border/40 flex-shrink-0">
            <CircuitBreakerGauge state={circuitBreakerState} compact />
          </div>

          {/* AI Signal Timeline */}
          <div className="flex-shrink-0 border-b border-border/40">
            <AITimelineEnhanced
              signals={filteredAISignals.length > 0 ? filteredAISignals : aiSignals.slice(0, 5)}
              userAsset={userStats.currentAsset}
            />
          </div>

          {/* AI Analysis Panel + Order Buttons */}
          <div className="flex-shrink-0">
            <RightAnalysisPanel
              coin={selectedCoin}
              activeAISignal={activeAISignal}
              longRatio={ratioData?.longRatio}
              circuitBreaker={circuitBreakerState}
              autoTradingEnabled={settings.autoTradingEnabled}
              onJoinSignal={joinSignal}
              userAsset={userStats.currentAsset}
            />
          </div>
        </aside>
      </div>

      {/* ── Footer ── */}
      <div className="hidden lg:block">
        <Footer />
      </div>

      {/* ── Floating: AI Mentor Chat ── */}
      {mentorChatProps && <AIMentorChat {...mentorChatProps} />}

      {/* ── Performance Modal ── */}
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
