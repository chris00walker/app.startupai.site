/**
 * Gate Status Badge Component
 *
 * Displays the current gate status (Passed/Failed/Pending/At Risk) with appropriate styling.
 * WCAG 2.2 AA compliant with accessible colors and labels.
 */

'use client';

import { cn } from '@/lib/utils';
import type { GateStatus } from '@/types/portfolio';

interface GateStatusBadgeProps {
  status: GateStatus;
  className?: string;
}

export function GateStatusBadge({ status, className }: GateStatusBadgeProps) {
  const statusConfig: Record<GateStatus, { bg: string; text: string; border: string; icon: string; label: string }> = {
    Passed: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-800 dark:text-green-300',
      border: 'border-green-300 dark:border-green-700',
      icon: '✓',
      label: 'Gate Passed',
    },
    Failed: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-800 dark:text-red-300',
      border: 'border-red-300 dark:border-red-700',
      icon: '✕',
      label: 'Gate Failed',
    },
    Pending: {
      bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      text: 'text-yellow-800 dark:text-yellow-300',
      border: 'border-yellow-300 dark:border-yellow-700',
      icon: '●',
      label: 'Gate Pending',
    },
    'At Risk': {
      bg: 'bg-orange-100 dark:bg-orange-900/30',
      text: 'text-orange-800 dark:text-orange-300',
      border: 'border-orange-300 dark:border-orange-700',
      icon: '⚠',
      label: 'Gate At Risk',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm font-medium',
        config.bg,
        config.text,
        config.border,
        className
      )}
      role="status"
      aria-label={config.label}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{status}</span>
    </span>
  );
}
