import { NewsItem, EventItem } from '@/types/trading';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Newspaper, TrendingUp, TrendingDown, Minus, Calendar, Clock, AlertTriangle, ExternalLink } from 'lucide-react';
import { formatDistanceToNow, differenceInHours } from 'date-fns';
import { ko } from 'date-fns/locale';

interface NewsFeedProps {
  news: NewsItem[];
  events: EventItem[];
}

export function NewsFeed({ news, events }: NewsFeedProps) {
  const getSentimentIcon = (sentiment: NewsItem['sentiment']) => {
    switch (sentiment) {
      case 'bullish':
        return <TrendingUp className="w-3 h-3 text-long" />;
      case 'bearish':
        return <TrendingDown className="w-3 h-3 text-short" />;
      default:
        return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getEventTypeColor = (type: EventItem['type']) => {
    switch (type) {
      case 'AMA':
        return 'bg-info/20 text-info';
      case 'CONFERENCE':
        return 'bg-primary/20 text-primary';
      case 'LISTING':
        return 'bg-long/20 text-long';
      case 'UNLOCK':
        return 'bg-short/20 text-short';
    }
  };

  const formatCountdown = (date: Date) => {
    const hours = differenceInHours(date, new Date());
    if (hours < 24) {
      return `${hours}시간 후`;
    }
    return formatDistanceToNow(date, { addSuffix: true, locale: ko });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Events Section */}
      <div className="p-4 border-b border-border">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          이벤트 알림
        </h3>
        <div className="space-y-2">
          {events.map((event, index) => {
            const hours = differenceInHours(event.timestamp, new Date());
            const isUrgent = hours < 12;
            
            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "p-3 rounded-lg border transition-all",
                  isUrgent 
                    ? "border-primary bg-primary/5 animate-pulse-glow" 
                    : "border-border bg-accent/30"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-xs font-bold px-2 py-0.5 rounded",
                    getEventTypeColor(event.type)
                  )}>
                    {event.type}
                  </span>
                  <span className="text-xs font-mono text-primary">{event.coin}</span>
                </div>
                <p className="text-sm font-medium mb-1">{event.title}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {isUrgent && <AlertTriangle className="w-3 h-3 text-primary" />}
                    <Clock className="w-3 h-3" />
                    <span className={isUrgent ? "text-primary font-semibold" : ""}>
                      {formatCountdown(event.timestamp)}
                    </span>
                  </div>
                  {event.url && (
                    <a
                      href={event.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      공식 링크
                    </a>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* News Section */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
            <Newspaper className="w-4 h-4" />
            실시간 뉴스
          </h3>
          <div className="space-y-3">
            {news.map((item, index) => (
              <motion.a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="block p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-2">
                  <div className={cn(
                    "p-1 rounded mt-0.5",
                    item.sentiment === 'bullish' && "bg-long/20",
                    item.sentiment === 'bearish' && "bg-short/20",
                    item.sentiment === 'neutral' && "bg-muted"
                  )}>
                    {getSentimentIcon(item.sentiment)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{item.source}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(item.timestamp, { addSuffix: true, locale: ko })}</span>
                      <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
