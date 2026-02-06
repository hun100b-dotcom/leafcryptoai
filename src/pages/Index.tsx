import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { CoinList } from '@/components/CoinList';
import { ActionCard } from '@/components/ActionCard';
import { TradingViewChart } from '@/components/TradingViewChart';
import { SentimentGauge } from '@/components/SentimentGauge';
import { AITimeline } from '@/components/AITimeline';
import { NewsFeed } from '@/components/NewsFeed';
import { Footer } from '@/components/Footer';
import { PerformanceModal } from '@/components/PerformanceModal';
import { useBinancePrice } from '@/hooks/useBinancePrice';
import { useSignals } from '@/hooks/useSignals';
import { mockNews, mockEvents } from '@/data/mockData';
import { motion, AnimatePresence } from 'framer-motion';

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [isPerformanceOpen, setIsPerformanceOpen] = useState(false);
  
  // Use real Binance prices
  const { coins, isConnected } = useBinancePrice();
  
  // Use signals from database
  const { signals, stats, isLoading: signalsLoading } = useSignals();

  const selectedCoin = useMemo(
    () => coins.find(c => c.symbol === selectedSymbol) || coins[0],
    [selectedSymbol, coins]
  );

  const activeSignal = useMemo(
    () => signals.find(s => s.symbol === selectedSymbol && s.status === 'ACTIVE'),
    [selectedSymbol, signals]
  );

  const filteredSignals = useMemo(
    () => signals.filter(s => s.symbol === selectedSymbol),
    [selectedSymbol, signals]
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

        {/* Right Sidebar - AI Timeline & News */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 border-l border-border bg-card/30 hidden xl:flex flex-col"
        >
          <div className="flex-1 overflow-hidden">
            <AITimeline signals={filteredSignals.length > 0 ? filteredSignals : signals.slice(0, 5)} />
          </div>
          <div className="h-[400px] border-t border-border">
            <NewsFeed news={mockNews} events={mockEvents} />
          </div>
        </motion.aside>
      </div>

      <Footer />

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
