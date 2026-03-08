import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, CheckCircle2, Info, Cpu } from 'lucide-react';
import { useAILiveLog } from '@/contexts/AILiveLogContext';
import { cn } from '@/lib/utils';

/**
 * AILiveThinkingLog
 * 부모 aside의 overflow-y-auto를 사용하므로 자체 overflow 없음.
 * 자연 높이로 렌더링 → 페이지 단일 스크롤에 통합.
 */
export function AILiveThinkingLog() {
  const { logs } = useAILiveLog();
  const containerRef = useRef<HTMLDivElement>(null);

  /* 새 로그가 올 때 맨 아래로 스크롤 */
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [logs]);

  return (
    <div className="flex flex-col">
      {/* ── Header ── */}
      <div className="panel-section-header">
        <Cpu className="w-3 h-3 text-primary" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          AI Real-time Thinking Log
        </span>
        <div className="ml-2 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-long animate-pulse" />
          <span className="text-[9px] text-long font-mono">LIVE</span>
        </div>
        <span className="ml-auto text-[9px] text-muted-foreground/40 font-mono">
          {logs.length}건
        </span>
      </div>

      {/* ── Log Stream — 가로 스크롤 (페이지 세로 스크롤과 독립) ── */}
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-hidden scrollbar-thin px-3 py-2"
        style={{ minHeight: '52px' }}
      >
        {logs.length === 0 ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground/50 py-1">
            <Activity className="w-3.5 h-3.5 animate-pulse flex-shrink-0" />
            <span className="whitespace-nowrap">
              AI 엔진 대기 중... 시그널 생성 시 실시간 판단 근거가 흐릅니다.
            </span>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <AnimatePresence initial={false}>
              {logs.slice(-80).map((log) => {
                const time = log.timestamp.toLocaleTimeString(undefined, {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });

                const Icon =
                  log.level === 'success'
                    ? CheckCircle2
                    : log.level === 'warning' || log.level === 'error'
                      ? AlertTriangle
                      : Info;

                const colorClass =
                  log.level === 'success'
                    ? 'text-long'
                    : log.level === 'error'
                      ? 'text-short'
                      : log.level === 'warning'
                        ? 'text-amber-400'
                        : 'text-muted-foreground/65';

                const bgClass =
                  log.level === 'success'
                    ? 'bg-long/5 border-long/15'
                    : log.level === 'error'
                      ? 'bg-short/5 border-short/15'
                      : log.level === 'warning'
                        ? 'bg-amber-400/5 border-amber-400/15'
                        : 'bg-accent/20 border-border/30';

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: 12, scale: 0.97 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    transition={{ duration: 0.18 }}
                    className={cn(
                      'flex-shrink-0 flex items-start gap-1.5 px-2 py-1.5 rounded border text-[10px] max-w-[260px]',
                      bgClass,
                    )}
                  >
                    <span className="font-mono text-muted-foreground/35 flex-shrink-0 mt-0.5 text-[9px] whitespace-nowrap">
                      {time}
                    </span>
                    <Icon className={cn('w-3 h-3 flex-shrink-0 mt-0.5', colorClass)} />
                    <span className={cn('leading-tight', colorClass)}>{log.message}</span>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
