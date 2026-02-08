import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/Header';
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
import { Bot, User, Plus } from 'lucide-react';

const Positions = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'manual'>('ai');

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
    leaveSignal 
  } = useAIManagedPositions();

  const { signals: aiSignals, stats: signalStats } = useAISignals();

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

  // Active signals available to join
  const availableSignals = aiSignals.filter(s => s.status === 'ACTIVE');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        totalWinRate={Math.round(signalStats.winRate)} 
        totalPnL={Math.round(signalStats.totalPnl * 10) / 10} 
        totalSignals={signalStats.totalSignals}
        isConnected={true}
        onOpenPerformance={() => {}}
      />

      <main className="flex-1 container max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">내 포지션</h1>
              <p className="text-muted-foreground mt-1">
                AI와 함께 진입하거나 직접 포지션을 관리하세요
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsJoinModalOpen(true)}
                disabled={availableSignals.length === 0}
                className="gap-2"
              >
                <Bot className="w-4 h-4" />
                AI 시그널 참여
                {availableSignals.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
                    {availableSignals.length}
                  </span>
                )}
              </Button>
              <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                직접 진입
              </Button>
            </div>
          </div>

          {/* Stats Overview with Real-time Data */}
          <PositionStats
            userStats={realTimeStats}
            aiStats={aiStats}
            settings={settings}
            onUpdateInitialAsset={updateInitialAsset}
            onDeposit={depositAsset}
            onWithdraw={withdrawAsset}
          />

          {/* Position Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'ai' | 'manual')}>
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
                positions={aiPositions}
                getPrice={getPrice}
                onLeave={leaveSignal}
              />
            </TabsContent>

            <TabsContent value="manual" className="mt-6">
              <PositionsList
                type="manual"
                positions={userPositions}
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
