/**
 * VPCFitBadge Component
 *
 * Displays a fit score badge for desirability, feasibility, or viability.
 * Color-coded based on score band (High/Medium/Low).
 */

'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Heart, Wrench, DollarSign, HelpCircle } from 'lucide-react';

export interface VPCFitBadgeProps {
  type: 'desirability' | 'feasibility' | 'viability';
  score: number;
  band: string; // "High Fit" | "Medium Fit" | "Low Fit"
  size?: 'sm' | 'md';
  showLabel?: boolean;
  showScore?: boolean;
  className?: string;
}

const typeConfig = {
  desirability: {
    label: 'Desirability',
    Icon: Heart,
    shortLabel: 'D',
  },
  feasibility: {
    label: 'Feasibility',
    Icon: Wrench,
    shortLabel: 'F',
  },
  viability: {
    label: 'Viability',
    Icon: DollarSign,
    shortLabel: 'V',
  },
} as const;

function getBandColor(band: string): string {
  const normalizedBand = band.toLowerCase();
  if (normalizedBand.includes('high')) {
    return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800';
  }
  if (normalizedBand.includes('medium')) {
    return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800';
  }
  return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800';
}

function getBandDotColor(band: string): string {
  const normalizedBand = band.toLowerCase();
  if (normalizedBand.includes('high')) {
    return 'bg-emerald-500';
  }
  if (normalizedBand.includes('medium')) {
    return 'bg-amber-500';
  }
  return 'bg-red-500';
}

export function VPCFitBadge({
  type,
  score,
  band,
  size = 'md',
  showLabel = true,
  showScore = true,
  className,
}: VPCFitBadgeProps) {
  const config = typeConfig[type];
  const Icon = config?.Icon || HelpCircle;
  const bandColor = getBandColor(band);

  const sizeClasses = size === 'sm'
    ? 'px-1.5 py-0.5 text-[10px] gap-1'
    : 'px-2.5 py-0.5 text-xs gap-1.5';

  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center font-medium',
        bandColor,
        sizeClasses,
        className
      )}
    >
      <Icon className="shrink-0" size={iconSize} />
      {showLabel && (
        <span>{size === 'sm' ? config?.shortLabel : config?.label}</span>
      )}
      {showScore && (
        <span className="font-bold">{score}%</span>
      )}
    </Badge>
  );
}

/**
 * Mini fit badge - just shows a colored dot with tooltip potential
 */
export interface VPCFitDotProps {
  type: 'desirability' | 'feasibility' | 'viability';
  band: string;
  className?: string;
}

export function VPCFitDot({ type, band, className }: VPCFitDotProps) {
  const config = typeConfig[type];
  const dotColor = getBandDotColor(band);

  return (
    <div
      className={cn('flex items-center gap-1', className)}
      title={`${config?.label}: ${band}`}
    >
      <div className={cn('w-2 h-2 rounded-full', dotColor)} />
    </div>
  );
}

/**
 * Group of three fit dots for compact display
 */
export interface VPCFitDotsGroupProps {
  desirabilityBand?: string;
  feasibilityBand?: string;
  viabilityBand?: string;
  className?: string;
}

export function VPCFitDotsGroup({
  desirabilityBand = 'Low Fit',
  feasibilityBand = 'Low Fit',
  viabilityBand = 'Low Fit',
  className,
}: VPCFitDotsGroupProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <VPCFitDot type="desirability" band={desirabilityBand} />
      <VPCFitDot type="feasibility" band={feasibilityBand} />
      <VPCFitDot type="viability" band={viabilityBand} />
    </div>
  );
}

export default VPCFitBadge;
