import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface TierInfo {
  name: string;
  level: number;
  color: string;
  bg: string;
  icon: LucideIcon;
}

interface AITierBadgeProps {
  tier: TierInfo;
  size?: 'sm' | 'md' | 'lg';
}

export function AITierBadge({ tier, size = 'md' }: AITierBadgeProps) {
  const IconComponent = tier.icon;
  
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <motion.div
      className={cn(
        "relative flex items-center justify-center rounded-full",
        tier.bg,
        sizeClasses[size]
      )}
      animate={{
        boxShadow: [
          `0 0 0 0 ${tier.color.replace('text-', 'rgba(')}0.4)`,
          `0 0 0 6px ${tier.color.replace('text-', 'rgba(')}0)`,
        ],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeOut',
      }}
    >
      <IconComponent className={cn(iconSizes[size], tier.color)} />
      
      {/* Sparkle effect for higher tiers */}
      {tier.level >= 3 && (
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        >
          {[...Array(tier.level)].map((_, i) => (
            <motion.span
              key={i}
              className={cn("absolute w-1 h-1 rounded-full", tier.bg)}
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${(360 / tier.level) * i}deg) translateY(-${size === 'lg' ? 20 : size === 'md' ? 14 : 10}px)`,
              }}
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
