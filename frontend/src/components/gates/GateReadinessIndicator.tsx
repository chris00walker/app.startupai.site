/**
 * Gate Readiness Indicator Component
 *
 * Shows progress toward passing a gate with visual progress bar and percentage.
 * Accessible with ARIA labels and keyboard navigation.
 *
 * @story US-F15
 */

'use client';

import { cn } from '@/lib/utils';

interface GateReadinessIndicatorProps {
  score: number; // 0.0 to 1.0
  stage: 'DESIRABILITY' | 'FEASIBILITY' | 'VIABILITY' | 'SCALE';
  className?: string;
}

export function GateReadinessIndicator({
  score,
  stage,
  className,
}: GateReadinessIndicatorProps) {
  const percentage = Math.round(score * 100);
  
  // Color based on readiness level
  const getColor = () => {
    if (score >= 1.0) return 'bg-green-500';
    if (score >= 0.75) return 'bg-blue-500';
    if (score >= 0.50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getTextColor = () => {
    if (score >= 1.0) return 'text-green-700 dark:text-green-300';
    if (score >= 0.75) return 'text-blue-700 dark:text-blue-300';
    if (score >= 0.50) return 'text-yellow-700 dark:text-yellow-300';
    return 'text-red-700 dark:text-red-300';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {stage} Gate Readiness
        </span>
        <span className={cn('text-sm font-semibold', getTextColor())}>
          {percentage}%
        </span>
      </div>
      
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Gate readiness: ${percentage} percent`}
      >
        <div
          className={cn(
            'h-full transition-all duration-500 ease-out',
            getColor()
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {score >= 0.9 && score < 1.0 && (
        <p className="text-xs text-blue-600 dark:text-blue-400" role="status">
          Almost ready! Complete remaining criteria to pass.
        </p>
      )}
      
      {score >= 1.0 && (
        <p className="text-xs text-green-600 dark:text-green-400" role="status">
          ✓ All criteria met - ready to pass gate!
        </p>
      )}
    </div>
  );
}
