/**
 * ApprovalCard Component
 *
 * Compact card for displaying an approval request in a list.
 */

'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ChevronRight, AlertTriangle } from 'lucide-react';
import { FounderAvatar } from './FounderAvatar';
import { ApprovalTypeIndicator } from './ApprovalTypeIndicator';
import { EvidenceSummary } from './EvidenceSummary';
import type { ApprovalRequest, OwnerRole, ApprovalType } from '@/types/crewai';

interface ApprovalCardProps {
  approval: ApprovalRequest;
  onClick?: () => void;
  showProject?: boolean;
  className?: string;
}

/**
 * Format time remaining until expiration
 */
function formatTimeRemaining(expiresAt: string): { text: string; isUrgent: boolean } {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff < 0) {
    return { text: 'Expired', isUrgent: true };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return {
      text: `${days}d ${remainingHours}h remaining`,
      isUrgent: days < 1,
    };
  }

  if (hours > 0) {
    return {
      text: `${hours}h remaining`,
      isUrgent: hours < 24,
    };
  }

  const minutes = Math.floor(diff / (1000 * 60));
  return {
    text: `${minutes}m remaining`,
    isUrgent: true,
  };
}

export function ApprovalCard({
  approval,
  onClick,
  showProject = true,
  className,
}: ApprovalCardProps) {
  const timeRemaining = useMemo(
    () => formatTimeRemaining(approval.expires_at),
    [approval.expires_at]
  );

  const isExpired = approval.status === 'expired';
  const isPending = approval.status === 'pending';

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md cursor-pointer',
        isExpired && 'opacity-60',
        timeRemaining.isUrgent && isPending && 'border-red-200 bg-red-50/30',
        className
      )}
      onClick={onClick}
      data-testid="approval-card"
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Founder Avatar */}
          <FounderAvatar
            role={approval.owner_role as OwnerRole}
            size="lg"
            showTooltip={false}
          />

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Title Row */}
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-base truncate">{approval.title}</h3>
                {showProject && approval.project && (
                  <p className="text-sm text-muted-foreground truncate">
                    Project: {approval.project.name}
                  </p>
                )}
              </div>
              <ApprovalTypeIndicator
                type={approval.approval_type as ApprovalType}
                size="sm"
                showIcon={false}
              />
            </div>

            {/* Description */}
            <p className="text-sm text-muted-foreground line-clamp-2">
              {approval.description}
            </p>

            {/* Evidence Signals (compact) */}
            {approval.evidence_summary && Object.keys(approval.evidence_summary).length > 0 && (
              <EvidenceSummary
                evidenceSummary={approval.evidence_summary}
                compact
              />
            )}

            {/* Footer Row */}
            <div className="flex items-center justify-between pt-1">
              {/* Time Remaining */}
              <div
                className={cn(
                  'flex items-center gap-1 text-sm',
                  timeRemaining.isUrgent && isPending
                    ? 'text-red-600 font-medium'
                    : 'text-muted-foreground'
                )}
              >
                {timeRemaining.isUrgent && isPending ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                <span>{timeRemaining.text}</span>
              </div>

              {/* Status Badge or View Button */}
              {isPending ? (
                <Button variant="ghost" size="sm" className="gap-1">
                  View Details
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Badge
                  variant={
                    approval.status === 'approved'
                      ? 'default'
                      : approval.status === 'rejected'
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {approval.status.charAt(0).toUpperCase() + approval.status.slice(1)}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ApprovalCard;
