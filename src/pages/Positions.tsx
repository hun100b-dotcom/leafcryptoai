import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Footer } from '@/components/Footer';
import { PositionsList } from '@/components/positions/PositionsList';
import { AddPositionModal } from '@/components/positions/AddPositionModal';
import { JoinSignalModal } from '@/components/positions/JoinSignalModal';
import { PositionStats } from '@/components/positions/PositionStats';
import { useUserPositions } from '@/hooks/useUserPositions';
import { useAIManagedPositions } from '@/hooks/useAIManagedPositions';
import { useAISignals } from '@/hooks/useAISignals';
import { useBinancePrices } from '@/hooks/useBinancePrices';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Bot, User, Plus, ArrowLeft, Wallet, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Positions = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');
  const [filter, setFilter] = useState<'all' | 'active' | 'win' | 'loss'>('all');

  const { 
    positions: userPositions, 
    stats: userStats, 
    settings,
    addPosition, 
    closePosition, 
    deletePosition,
    updateInitialAsset,
    depositAsset,
    withdrawAsset,
    calculateRealTimeStats
  } = useUserPositions();

  const { 
    positions: aiPositions, 
    stats: aiStats, 
    leaveSignal,
    refetch: refetchAIPositions
  } = useAIManagedPositions();

  const { signals: aiSignals, stats: signalStats, refetch: refetchSignals } = useAISignals();

  // Get unique symbols for price fetching
  const allSymbols = useMemo(() => [
    ...new Set([
      ...userPositions.map(p => p.symbol),
      ...aiPositions.filter(p => p.signal).map(p => p.signal!.symbol)
    ])
  ], [userPositions, aiPositions]);

  const { getPrice } = useBinancePrices(allSymbols);

  // Calculate real-time stats
  const realTimeStats = useMemo(() => {
    const activeAIPositions = aiPositions
      .filter(p => p.status === 'ACTIVE')
      .map(p => ({
        allocatedAsset: p.allocatedAsset,
        entryPrice: p.entryPrice,
        signal: p.signal
      }));
    
    return calculateRealTimeStats(getPrice, activeAIPositions);
  }, [calculateRealTimeStats, getPrice, aiPositions]);

  // Handle refetch after reset
  const handleRefetchAll = () => {
    refetchAIPositions();
    refetchSignals();
  };

  // Filter positions
  const filteredUserPositions = useMemo(() => {
    return userPositions.filter(p => {
      if (filter === 'all') return true;
      if (filter === 'active') return p.status === 'ACTIVE';
      if (filter === 'win') return p.status === 'WIN';
      if (filter === 'loss') return p.status === 'LOSS';
      return true;
    });
  }, [userPositions, filter]);

  const filteredAIPositions = useMemo(() => {
    return aiPositions.filter(p => {
      if (filter === 'all') return true;
      if (filter === 'active') return p.status === 'ACTIVE';
      if (filter === 'win') return p.status === 'WIN';
      if (filter === 'loss') return p.status === 'LOSS';
      return true;
    });
  }, [aiPositions, filter]);

  // Active signals available to join
  const availableSignals = aiSignals.filter(s => s.status === 'ACTIVE');

  // Count for filters
  const getFilterCounts = (positions: { status: string }[]) => ({
    all: positions.length,
    active: positions.filter(p => p.status === 'ACTIVE').length,
    win: positions.filter(p => p.status === 'WIN').length,
    loss: positions.filter(p => p.status === 'LOSS').length,
  });

  const currentPositions = activeTab === 'ai' ? aiPositions : userPositions;
  const filterCounts = getFilterCounts(currentPositions);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Sticky Header - 모바일 반응형 */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container max-w-6xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* 상단: 뒤로가기 + 제목 */}
          <div className="flex items-center justify-between gap-2 mb-2 sm:mb-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3 flex-shrink-0">
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">대시보드로 돌아가기</span>
                </Button>
              </Link>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                <h1 className="text-sm sm:text-lg font-bold whitespace-nowrap">내 포지션</h1>
              </div>
            </div>
            {/* 액션 버튼: 모바일에서 아이콘만 */}
            <div className="flex gap-1.5 sm:gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsJoinModalOpen(true)}
                disabled={availableSignals.length === 0}
                className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">AI 시그널 참여</span>
                {availableSignals.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
                    {availableSignals.length}
                  </span>
                )}
              </Button>
              <Button size="sm" onClick={() => setIsAddModalOpen(true)} className="gap-1 sm:gap-2 px-2 sm:px-3 text-xs sm:text-sm">
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">직접 진입</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >

          {/* Stats Overview with Real-time Data */}
          <PositionStats
            userStats={realTimeStats}
            aiStats={aiStats}
            settings={settings}
            onUpdateInitialAsset={updateInitialAsset}
            onDeposit={depositAsset}
            onWithdraw={withdrawAsset}
            onRefetch={handleRefetchAll}
          />

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-muted-foreground" />
            {[
              { key: 'all' as const, label: '전체' },
              { key: 'active' as const, label: '진행 중' },
              { key: 'win' as const, label: '수익' },
              { key: 'loss' as const, label: '손절' },
            ].map(item => (
              <Button
                key={item.key}
                variant={filter === item.key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(item.key)}
                className="gap-1"
              >
                {item.label}
                <Badge 
                  variant={filter === item.key ? 'secondary' : 'outline'} 
                  className="ml-1 text-xs"
                >
                  {filterCounts[item.key]}
                </Badge>
              </Button>
            ))}
          </div>

          {/* Position Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as 'ai' | 'manual'); setFilter('all'); }}>
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="ai" className="gap-2">
                <Bot className="w-4 h-4" />
                AI 함께 진입
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {aiPositions.filter(p => p.status === 'ACTIVE').length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-2">
                <User className="w-4 h-4" />
                직접 진입
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                  {userPositions.filter(p => p.status === 'ACTIVE').length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="mt-6">
              <PositionsList
                type="ai"
                positions={filteredAIPositions}
                getPrice={getPrice}
                onLeave={leaveSignal}
              />
            </TabsContent>

            <TabsContent value="manual" className="mt-6">
              <PositionsList
                type="manual"
                positions={filteredUserPositions}
                getPrice={getPrice}
                onClose={closePosition}
                onDelete={deletePosition}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>

      <Footer />

      {/* Modals */}
      <AnimatePresence>
        {isAddModalOpen && (
          <AddPositionModal
            isOpen={isAddModalOpen}
            onClose={() => setIsAddModalOpen(false)}
            onAdd={addPosition}
          />
        )}
        {isJoinModalOpen && (
          <JoinSignalModal
            isOpen={isJoinModalOpen}
            onClose={() => setIsJoinModalOpen(false)}
            signals={availableSignals}
            userAsset={realTimeStats.currentAsset}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Positions;
