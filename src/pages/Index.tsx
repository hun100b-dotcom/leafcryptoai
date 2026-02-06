import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { CoinList } from '@/components/CoinList';
import { ActionCard } from '@/components/ActionCard';
import { PriceChart } from '@/components/PriceChart';
import { SentimentGauge } from '@/components/SentimentGauge';
import { AITimeline } from '@/components/AITimeline';
import { NewsFeed } from '@/components/NewsFeed';
import { Footer } from '@/components/Footer';
import { mockCoins, mockSignals, mockNews, mockSentiment, mockEvents } from '@/data/mockData';
import { motion } from 'framer-motion';

const Index = () => {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');

  const selectedCoin = useMemo(
    () => mockCoins.find(c => c.symbol === selectedSymbol) || mockCoins[0],
    [selectedSymbol]
  );

  const activeSignal = useMemo(
    () => mockSignals.find(s => s.symbol === selectedSymbol && s.status === 'ACTIVE'),
    [selectedSymbol]
  );

  const filteredSignals = useMemo(
    () => mockSignals.filter(s => s.symbol === selectedSymbol),
    [selectedSymbol]
  );

  // Calculate overall stats
  const totalWinRate = 76;
  const totalPnL = 187;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header totalWinRate={totalWinRate} totalPnL={totalPnL} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Coin List */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 border-r border-border bg-card/30 hidden lg:block"
        >
          <CoinList
            coins={mockCoins}
            selectedSymbol={selectedSymbol}
            onSelectCoin={setSelectedSymbol}
          />
        </motion.aside>

        {/* Center - Chart & Action Card */}
        <main className="flex-1 flex flex-col overflow-y-auto scrollbar-thin p-6 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <ActionCard coin={selectedCoin} signal={activeSignal} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <PriceChart coin={selectedCoin} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <SentimentGauge sentiment={mockSentiment} />
          </motion.div>
        </main>

        {/* Right Sidebar - AI Timeline & News */}
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-80 border-l border-border bg-card/30 hidden xl:flex flex-col"
        >
          <div className="flex-1 overflow-hidden">
            <AITimeline signals={filteredSignals.length > 0 ? filteredSignals : mockSignals} />
          </div>
          <div className="h-[400px] border-t border-border">
            <NewsFeed news={mockNews} events={mockEvents} />
          </div>
        </motion.aside>
      </div>

      <Footer />
    </div>
  );
};

export default Index;
