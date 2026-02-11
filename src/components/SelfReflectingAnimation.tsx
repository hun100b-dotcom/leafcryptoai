import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Search, Shield, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelfReflectingAnimationProps {
  isActive: boolean;
  className?: string;
}

const THINKING_STEPS = [
  { icon: Search, text: '시장 데이터 수집 중...', color: 'text-info' },
  { icon: Brain, text: '기술적 지표 분석 중...', color: 'text-primary' },
  { icon: AlertTriangle, text: '판단 편향 자기 검증 중...', color: 'text-primary' },
  { icon: Shield, text: '리스크/리워드 비율 검증 중...', color: 'text-long' },
  { icon: Zap, text: '최종 판단 도출 중...', color: 'text-primary' },
  { icon: CheckCircle2, text: '시그널 생성 완료', color: 'text-long' },
];

/**
 * Meta-Cognition Self-Reflecting 애니메이션
 * 시그널 생성 시 AI의 사고 과정을 단계별로 시각화
 */
export function SelfReflectingAnimation({ isActive, className }: SelfReflectingAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= THINKING_STEPS.length - 1) {
          clearInterval(interval);
          return prev;
        }
        return prev + 1;
      });
    }, 800);

    return () => clearInterval(interval);
  }, [isActive]);

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        'rounded-lg border border-primary/30 bg-primary/5 p-4 overflow-hidden',
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Brain className="w-4 h-4 text-primary" />
        </motion.div>
        <span className="text-xs font-bold text-primary uppercase tracking-wider">
          Leaf-Master Self-Reflecting
        </span>
      </div>

      <div className="space-y-1.5">
        {THINKING_STEPS.map((step, i) => {
          const Icon = step.icon;
          const isCompleted = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <AnimatePresence key={i}>
              {i <= currentStep && (
                <motion.div
                  initial={{ opacity: 0, x: -10, height: 0 }}
                  animate={{ opacity: 1, x: 0, height: 'auto' }}
                  className="flex items-center gap-2"
                >
                  <motion.div
                    animate={isCurrent ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.6, repeat: isCurrent ? Infinity : 0 }}
                  >
                    <Icon className={cn('w-3 h-3', isCompleted ? 'text-long' : step.color)} />
                  </motion.div>
                  <span className={cn(
                    'text-[11px]',
                    isCompleted ? 'text-muted-foreground line-through' : step.color,
                    isCurrent && 'font-semibold',
                  )}>
                    {step.text}
                  </span>
                  {isCurrent && (
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-primary text-[10px]"
                    >
                      ●
                    </motion.span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>
    </motion.div>
  );
}
