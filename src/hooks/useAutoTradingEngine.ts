import { useEffect, useRef } from 'react';
import { AISignal } from '@/hooks/useAISignals';
import { AIManagedPosition } from '@/hooks/useAIManagedPositions';
import { UserSettings } from '@/hooks/useUserPositions';
import { CircuitBreakerState } from '@/hooks/useCircuitBreaker';
import { useAILiveLog } from '@/contexts/AILiveLogContext';

interface AutoTradingEngineParams {
  aiSignals: AISignal[];
  managedPositions: AIManagedPosition[];
  settings: UserSettings;
  userCurrentAsset: number;
  circuitBreaker: CircuitBreakerState;
  joinSignal: (signalId: string, allocatedAsset: number) => Promise<{ success: boolean; error?: string }>;
}

const DEFAULT_ALLOCATION_PERCENT = 10; // 현재 자산의 10%를 기본 배분
const LOG_THROTTLE_MS = 60_000; // 동일 상태 로그는 60초에 최대 1회

export function useAutoTradingEngine({
  aiSignals,
  managedPositions,
  settings,
  userCurrentAsset,
  circuitBreaker,
  joinSignal,
}: AutoTradingEngineParams) {
  const { addLog } = useAILiveLog();
  const processedSignalIdsRef = useRef<Set<string>>(new Set());
  const lastLogStateRef = useRef<{ state: string; at: number } | null>(null);

  const tryLogOnce = (stateKey: string, fn: () => void) => {
    const now = Date.now();
    const last = lastLogStateRef.current;
    if (last?.state === stateKey && now - last.at < LOG_THROTTLE_MS) return;
    lastLogStateRef.current = { state: stateKey, at: now };
    fn();
  };

  // ON으로 전환될 때만 로그 (무한 반복 방지)
  const prevAutoRef = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    const prev = prevAutoRef.current;
    prevAutoRef.current = settings.autoTradingEnabled;
    if (settings.autoTradingEnabled && prev !== true) {
      addLog({
        level: 'info',
        message: '자동 매매 ON. ACTIVE 시그널 감지 시 자동 진입을 시도합니다.',
      });
    }
  }, [settings.autoTradingEnabled, addLog]);

  useEffect(() => {
    if (!settings.autoTradingEnabled) {
      lastLogStateRef.current = null;
      return;
    }

    if (circuitBreaker.isCoolingDown) {
      tryLogOnce('circuit_breaker', () =>
        addLog({
          level: 'warning',
          message: `서킷 브레이커 냉각기 모드(-${Math.abs(circuitBreaker.dailyLoss).toFixed(2)}%): 자동 매매 일시 중지.`,
        }),
      );
      return;
    }

    const activeSignals = aiSignals.filter(s => s.status === 'ACTIVE');

    if (activeSignals.length === 0) {
      tryLogOnce('no_signals', () =>
        addLog({
          level: 'info',
          message: '자동 매매 대기 중. ACTIVE 시그널이 없습니다.',
        }),
      );
      return;
    }

    const activeManagedSignalIds = new Set(
      managedPositions
        .filter(p => p.status === 'ACTIVE')
        .map(p => p.signalId),
    );

    const candidates = activeSignals
      .filter(s => !activeManagedSignalIds.has(s.id))
      .filter(s => !processedSignalIdsRef.current.has(s.id))
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    if (candidates.length === 0) {
      return;
    }

    let cancelled = false;

    const run = async () => {
      for (const signal of candidates) {
        if (cancelled) break;

        processedSignalIdsRef.current.add(signal.id);

        const allocationPercent = DEFAULT_ALLOCATION_PERCENT;
        const allocation = Math.max(
          0,
          Math.round((userCurrentAsset * allocationPercent) / 100),
        );

        if (allocation <= 0) {
          addLog({
            level: 'warning',
            message: `자동 매매 ON이지만 할당 가능한 자산이 없습니다. (현재 자산: $${userCurrentAsset.toFixed(
              2,
            )})`,
          });
          continue;
        }

        addLog({
          level: 'info',
          message: `RSI 및 모멘텀 지표 기반으로 ${signal.symbol} ${signal.position} 시그널 분석 완료 (신뢰도 ${signal.confidence.toFixed(
            1,
          )}%).`,
        });

        addLog({
          level: 'info',
          message: `자동 매매 ON: ${signal.symbol} ${signal.position} 포지션에 약 $${allocation.toLocaleString()} 배분하여 진입 주문을 전송합니다.`,
        });

        const result = await joinSignal(signal.id, allocation);

        if (result.success) {
          addLog({
            level: 'success',
            message: `${signal.symbol} ${signal.position} 포지션 자동 진입 완료 (레버리지 ${signal.leverage}x, TP $${signal.targetPrice.toLocaleString()}, SL $${signal.stopLoss.toLocaleString()}).`,
          });
        } else {
          addLog({
            level: 'error',
            message: `자동 매매 주문 실패 (${signal.symbol} ${signal.position}): ${result.error ?? '알 수 없는 오류'}`,
          });
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    aiSignals,
    managedPositions,
    settings.autoTradingEnabled,
    userCurrentAsset,
    circuitBreaker,
    joinSignal,
    addLog,
  ]);
}

