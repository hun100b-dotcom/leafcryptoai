/**
 * useCircuitBreaker - 서킷 브레이커 냉각기 시스템
 * 일일 누적 손실 -5% 도달 시 자동 냉각기 모드 전환
 * Stress Level에 따라 신뢰도 하향 조정
 */
import { useState, useMemo } from 'react';
import { AISignal } from '@/hooks/useAISignals';

export interface CircuitBreakerState {
  /** 냉각기 모드 활성화 여부 */
  isCoolingDown: boolean;
  /** 오늘 누적 손실률 (%) */
  dailyLoss: number;
  /** 스트레스 레벨 0-100 */
  stressLevel: number;
  /** 신뢰도 조정 배수 (1.0 = 기본, 0.x = 보수적) */
  confidenceMultiplier: number;
  /** 오늘 종료된 거래 수 */
  todayTrades: number;
  /** 연속 손실 횟수 */
  consecutiveLosses: number;
}

const DAILY_LOSS_LIMIT = -5; // -5% 일일 한도
const HIGH_STRESS_THRESHOLD = 70;

export function useCircuitBreaker(signals: AISignal[]): CircuitBreakerState {
  return useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 오늘 종료된 시그널
    const todayClosedSignals = signals.filter(s => {
      if (!s.closedAt) return false;
      const closedDate = new Date(s.closedAt);
      closedDate.setHours(0, 0, 0, 0);
      return closedDate.getTime() === today.getTime();
    });

    // 오늘 누적 손익
    const dailyPnl = todayClosedSignals.reduce((acc, s) => acc + (s.pnlPercent || 0), 0);

    // 연속 손실 카운트 (최근부터)
    const sortedSignals = [...signals]
      .filter(s => s.status === 'WIN' || s.status === 'LOSS')
      .sort((a, b) => new Date(b.closedAt || b.createdAt).getTime() - new Date(a.closedAt || a.createdAt).getTime());

    let consecutiveLosses = 0;
    for (const s of sortedSignals) {
      if (s.status === 'LOSS') consecutiveLosses++;
      else break;
    }

    // 스트레스 레벨 계산
    const lossStress = Math.min(Math.abs(dailyPnl) * 10, 50); // 손실 기반 (최대 50)
    const streakStress = consecutiveLosses * 15; // 연패 기반
    const volumeStress = Math.min(todayClosedSignals.length * 5, 20); // 거래 빈도 기반
    const stressLevel = Math.min(Math.round(lossStress + streakStress + volumeStress), 100);

    const isCoolingDown = dailyPnl <= DAILY_LOSS_LIMIT;

    // 신뢰도 조정 배수
    let confidenceMultiplier = 1.0;
    if (stressLevel >= HIGH_STRESS_THRESHOLD) {
      confidenceMultiplier = 0.7; // 고스트레스 시 30% 하향
    } else if (stressLevel >= 50) {
      confidenceMultiplier = 0.85;
    } else if (isCoolingDown) {
      confidenceMultiplier = 0.5; // 냉각기 시 50% 하향
    }

    return {
      isCoolingDown,
      dailyLoss: Math.round(dailyPnl * 100) / 100,
      stressLevel,
      confidenceMultiplier,
      todayTrades: todayClosedSignals.length,
      consecutiveLosses,
    };
  }, [signals]);
}
