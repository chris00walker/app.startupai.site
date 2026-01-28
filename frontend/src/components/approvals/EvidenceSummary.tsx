/**
 * EvidenceSummary Component
 *
 * Displays the evidence summary and D-F-V signals for an approval request.
 *
 * @story US-F03
 */

'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Heart,
  Wrench,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import type {
  DesirabilitySignal,
  FeasibilitySignal,
  ViabilitySignal,
} from '@/types/crewai';
import { getSignalColor } from '@/types/crewai';

interface EvidenceSummaryProps {
  evidenceSummary: Record<string, unknown>;
  className?: string;
  compact?: boolean;
}

// Signal display configuration
const SIGNAL_CONFIG = {
  desirability: {
    icon: Heart,
    label: 'Desirability',
    signals: {
      no_signal: { label: 'Not tested', color: 'gray' },
      no_interest: { label: 'No interest', color: 'red' },
      weak_interest: { label: 'Weak interest', color: 'yellow' },
      strong_commitment: { label: 'Strong commitment', color: 'green' },
    },
  },
  feasibility: {
    icon: Wrench,
    label: 'Feasibility',
    signals: {
      unknown: { label: 'Unknown', color: 'gray' },
      green: { label: 'Feasible', color: 'green' },
      orange_constrained: { label: 'Constrained', color: 'orange' },
      red_impossible: { label: 'Not feasible', color: 'red' },
    },
  },
  viability: {
    icon: DollarSign,
    label: 'Viability',
    signals: {
      unknown: { label: 'Unknown', color: 'gray' },
      profitable: { label: 'Profitable', color: 'green' },
      marginal: { label: 'Marginal', color: 'yellow' },
      underwater: { label: 'Underwater', color: 'red' },
      zombie_market: { label: 'Zombie market', color: 'purple' },
    },
  },
};

function SignalBadge({
  signal,
  type,
}: {
  signal: string;
  type: 'desirability' | 'feasibility' | 'viability';
}) {
  const config = SIGNAL_CONFIG[type];
  const signals = config.signals as Record<string, { label: string; color: string }>;
  const signalConfig = signals[signal];
  const color = signalConfig?.color || 'gray';
  const label = signalConfig?.label || signal;
  const Icon = config.icon;

  const colorClasses: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
  };

  return (
    <Badge variant="outline" className={cn('gap-1', colorClasses[color])}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function MetricCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400';

  return (
    <div className="text-center p-2 bg-muted/50 rounded-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold">{value}</p>
      {trend && <TrendIcon className={cn('h-3 w-3 mx-auto mt-1', trendColor)} />}
    </div>
  );
}

export function EvidenceSummary({
  evidenceSummary,
  className,
  compact = false,
}: EvidenceSummaryProps) {
  // Extract signals from evidence summary
  const desirabilitySignal = evidenceSummary.desirability_signal as DesirabilitySignal | undefined;
  const feasibilitySignal = evidenceSummary.feasibility_signal as FeasibilitySignal | undefined;
  const viabilitySignal = evidenceSummary.viability_signal as ViabilitySignal | undefined;

  // Extract metrics
  const ltv = evidenceSummary.ltv as number | undefined;
  const cac = evidenceSummary.cac as number | undefined;
  const ltvCacRatio = evidenceSummary.ltv_cac_ratio as number | undefined;
  const conversionRate = evidenceSummary.conversion_rate as number | undefined;
  const impressions = evidenceSummary.impressions as number | undefined;
  const signups = evidenceSummary.signups as number | undefined;

  // Extract key learnings
  const keyLearnings = evidenceSummary.key_learnings as string[] | undefined;
  const summary = evidenceSummary.summary as string | undefined;

  if (compact) {
    return (
      <div className={cn('flex flex-wrap gap-2', className)}>
        {desirabilitySignal && (
          <SignalBadge signal={desirabilitySignal} type="desirability" />
        )}
        {feasibilitySignal && (
          <SignalBadge signal={feasibilitySignal} type="feasibility" />
        )}
        {viabilitySignal && (
          <SignalBadge signal={viabilitySignal} type="viability" />
        )}
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Evidence Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* D-F-V Signals */}
        <div className="flex flex-wrap gap-2">
          {desirabilitySignal && (
            <SignalBadge signal={desirabilitySignal} type="desirability" />
          )}
          {feasibilitySignal && (
            <SignalBadge signal={feasibilitySignal} type="feasibility" />
          )}
          {viabilitySignal && (
            <SignalBadge signal={viabilitySignal} type="viability" />
          )}
        </div>

        {/* Key Metrics */}
        {(ltv || cac || ltvCacRatio || conversionRate) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ltvCacRatio !== undefined && (
              <MetricCard
                label="LTV/CAC"
                value={ltvCacRatio.toFixed(2)}
                trend={ltvCacRatio >= 3 ? 'up' : ltvCacRatio < 1 ? 'down' : 'neutral'}
              />
            )}
            {ltv !== undefined && (
              <MetricCard
                label="LTV"
                value={`$${ltv.toLocaleString()}`}
              />
            )}
            {cac !== undefined && (
              <MetricCard
                label="CAC"
                value={`$${cac.toLocaleString()}`}
              />
            )}
            {conversionRate !== undefined && (
              <MetricCard
                label="Conv. Rate"
                value={`${(conversionRate * 100).toFixed(1)}%`}
              />
            )}
          </div>
        )}

        {/* Experiment Metrics */}
        {(impressions || signups) && (
          <div className="grid grid-cols-2 gap-2">
            {impressions !== undefined && (
              <MetricCard
                label="Impressions"
                value={impressions.toLocaleString()}
              />
            )}
            {signups !== undefined && (
              <MetricCard
                label="Signups"
                value={signups.toLocaleString()}
              />
            )}
          </div>
        )}

        {/* Summary Text */}
        {summary && (
          <p className="text-sm text-muted-foreground">{summary}</p>
        )}

        {/* Key Learnings */}
        {keyLearnings && keyLearnings.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Key Learnings</p>
            <ul className="text-sm space-y-1">
              {keyLearnings.slice(0, 3).map((learning, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{learning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default EvidenceSummary;
