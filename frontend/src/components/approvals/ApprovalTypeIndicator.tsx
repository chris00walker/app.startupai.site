/**
 * ApprovalTypeIndicator Component
 *
 * Displays a badge for the approval type with icon and color coding.
 *
 * @story US-F03
 */

'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Lightbulb,
  Scissors,
  Compass,
  DollarSign,
  Rocket,
  MessageSquare,
  ArrowRight,
  Share2,
} from 'lucide-react';
import type { ApprovalType } from '@/types/crewai';
import { getApprovalTypeInfo } from '@/types/crewai';

interface ApprovalTypeIndicatorProps {
  type: ApprovalType;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  className?: string;
}

// Map icon names to components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Users,
  Lightbulb,
  Scissors,
  Compass,
  DollarSign,
  Rocket,
  MessageSquare,
  ArrowRight,
  Share2,
};

// Color coding by approval type category
const TYPE_COLORS: Record<ApprovalType, { bg: string; text: string; border: string }> = {
  segment_pivot: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  value_pivot: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  feature_downgrade: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  strategic_pivot: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  spend_increase: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  campaign_launch: { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  customer_contact: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  gate_progression: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  data_sharing: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

export function ApprovalTypeIndicator({
  type,
  size = 'md',
  showIcon = true,
  className,
}: ApprovalTypeIndicatorProps) {
  const typeInfo = getApprovalTypeInfo(type);
  const colors = TYPE_COLORS[type];
  const IconComponent = ICON_MAP[typeInfo.icon];

  return (
    <Badge
      variant="outline"
      className={cn(
        colors.bg,
        colors.text,
        colors.border,
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        'font-medium',
        className
      )}
    >
      {showIcon && IconComponent && (
        <IconComponent className={cn('mr-1', size === 'sm' ? 'h-3 w-3' : 'h-4 w-4')} />
      )}
      {typeInfo.label}
    </Badge>
  );
}

export default ApprovalTypeIndicator;
