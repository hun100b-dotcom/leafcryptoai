import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { CoinList } from '@/components/CoinList';
import { ActionCard } from '@/components/ActionCard';
import { TradingViewChart } from '@/components/TradingViewChart';
import { SentimentGauge } from '@/components/SentimentGauge';
import { AITimelineEnhanced } from '@/components/AITimelineEnhanced';
import { NewsFeed } from '@/components/NewsFeed';
import { Footer } from '@/components/Footer';
import { PerformanceModal } from '@/components/PerformanceModal';
import { AIMentorChat } from '@/components/AIMentorChat';
import { MyPositionsPanel } from '@/components/MyPositionsPanel';
import { AIPerformanceAnalysis } from '@/components/AIPerformanceAnalysis';
import { AIAdvicePanel } from '@/components/AIAdvicePanel';
import { useBinancePrice } from '@/hooks/useBinancePrice';
import { useSignals } from '@/hooks/useSignals';
import { useAISignals } from '@/hooks/useAISignals';
import { useUserPositions } from '@/hooks/useUserPositions';
import { mockNews, mockEvents } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, User, BarChart3, Bell } from 'lucide-react';

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  
  // Use real Binance prices
  const { coins, isConnected } = useBinancePrice();
  
  // Use signals from database (legacy)
  const { signals, stats, isLoading: signalsLoading } = useSignals();
  
  // Use new AI signals system
  const { signals: aiSignals, stats: aiStats, advices } = useAISignals();
  
  // User positions
  const { positions, stats: userStats, settings } = useUserPositions();

  const selectedCoin = useMemo(
    () => coins.find(c => c.symbol === selectedSymbol) || coins[0],
    [selectedSymbol, coins]
  );

  const activeSignal = useMemo(
    () => {
      // Check new AI signals first, then legacy
      const newSignal = aiSignals.find(s => s.symbol === selectedSymbol && s.status === 'ACTIVE');
      if (newSignal) return {
        id: newSignal.id,
        symbol: newSignal.symbol,
        position: newSignal.position,
        entryPrice: newSignal.entryPrice,
        targetPrice: newSignal.targetPrice,
        stopLoss: newSignal.stopLoss,
        leverage: newSignal.leverage,
        timestamp: newSignal.createdAt,
        confidence: newSignal.confidence,
        status: newSignal.status,
        message: newSignal.evidenceReasoning || '',
      };
      return signals.find(s => s.symbol === selectedSymbol && s.status === 'ACTIVE');
    },
    [selectedSymbol, signals, aiSignals]
  );

  const filteredAISignals = useMemo(
    () => aiSignals.filter(s => s.symbol === selectedSymbol),
    [selectedSymbol, aiSignals]
  );

  const activeUserPosition = useMemo(
    () => positions.find(p => p.symbol === selectedSymbol && p.status === 'ACTIVE'),
    [selectedSymbol, positions]
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header 
        totalWinRate={stats.winRate} 
        totalPnL={stats.totalPnL} 
        totalSignals={stats.completedSignals}
        isConnected={isConnected}
        onOpenPerformance={() => setIsPerformanceOpen(true)}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Coin List */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 border-r border-border bg-card/30 hidden lg:block"
        >
          <CoinList
            coins={coins}
            selectedSymbol={selectedSymbol}
            onSelectCoin={setSelectedSymbol}
          />
        </motion.aside>

        {/* Center - Chart & Action Card */}
        <main className="flex-1 flex flex-col overflow-y-auto scrollbar-thin p-6 gap-6">
          {selectedCoin && (
            <>
              <motion.div
                key={selectedSymbol + '-action'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <ActionCard coin={selectedCoin} signal={activeSignal} />
              </motion.div>

              {/* TradingView Real Chart */}
              <motion.div
                key={selectedSymbol + '-chart'}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="trading-card p-0 overflow-hidden"
                style={{ height: '500px' }}
              >
                <TradingViewChart symbol={selectedSymbol} />
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
        </main>

        {/* Right Sidebar - AI vs User Tabs */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-96 border-l border-border bg-card/30 hidden xl:flex flex-col"
        >
          <Tabs defaultValue="ai" className="flex-1 flex flex-col">
            <TabsList className="w-full grid grid-cols-3 p-1 m-2">
              <TabsTrigger value="ai" className="flex items-center gap-1 text-xs">
                <Bot className="w-3 h-3" />
                AI 리딩
              </TabsTrigger>
              <TabsTrigger value="analysis" className="flex items-center gap-1 text-xs">
                <BarChart3 className="w-3 h-3" />
                승률 분석
              </TabsTrigger>
              <TabsTrigger value="user" className="flex items-center gap-1 text-xs">
                <User className="w-3 h-3" />
                내 포지션
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="ai" className="flex-1 flex flex-col overflow-hidden m-0">
              <div className="flex-1 overflow-hidden">
                <AITimelineEnhanced 
                  signals={filteredAISignals.length > 0 ? filteredAISignals : aiSignals.slice(0, 5)} 
                  userAsset={settings.initialAsset}
                />
              </div>
              <div className="h-[250px] border-t border-border overflow-y-auto">
                <div className="p-2 border-b border-border flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground">AI 조언</span>
                </div>
                <div className="p-2">
                  <AIAdvicePanel />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="analysis" className="flex-1 overflow-y-auto m-0 p-4">
              <AIPerformanceAnalysis />
            </TabsContent>
            
            <TabsContent value="user" className="flex-1 overflow-hidden m-0 relative">
              <MyPositionsPanel 
                symbol={selectedSymbol} 
                currentPrice={selectedCoin?.price || 0} 
              />
            </TabsContent>
          </Tabs>
        </motion.aside>
      </div>

      <Footer />

      {/* AI Mentor Chat */}
      {selectedCoin && (
        <AIMentorChat
          symbol={selectedSymbol}
          currentPrice={selectedCoin.price}
          userPosition={activeUserPosition ? {
            type: activeUserPosition.position,
            entryPrice: activeUserPosition.entryPrice,
            targetPrice: activeUserPosition.targetPrice,
            stopLoss: activeUserPosition.stopLoss,
            leverage: activeUserPosition.leverage,
          } : undefined}
        />
      )}

      {/* Performance Modal */}
      <AnimatePresence>
        {isPerformanceOpen && (
          <PerformanceModal
            isOpen={isPerformanceOpen}
            onClose={() => setIsPerformanceOpen(false)}
            signals={signals}
            stats={stats}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
