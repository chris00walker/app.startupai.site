/**
 * ApprovalBadge Component
 *
 * Navigation badge showing pending approval count with urgency indicator.
 * Uses Supabase Realtime for live updates.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Bell, AlertTriangle } from 'lucide-react';
import { useApprovals } from '@/hooks/useApprovals';
import type { ApprovalRequest } from '@/types/crewai';

interface ApprovalBadgeProps {
  className?: string;
  variant?: 'icon' | 'full';
}

/**
 * Check if any approvals are expiring within 24 hours
 */
function hasUrgentApprovals(approvals: ApprovalRequest[]): boolean {
  const now = new Date();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  return approvals.some((approval) => {
    const expiresAt = new Date(approval.expires_at);
    return expiresAt.getTime() - now.getTime() < twentyFourHours;
  });
}

/**
 * Get the most urgent expiration time
 */
function getUrgentCount(approvals: ApprovalRequest[]): number {
  const now = new Date();
  const twentyFourHours = 24 * 60 * 60 * 1000;

  return approvals.filter((approval) => {
    const expiresAt = new Date(approval.expires_at);
    return expiresAt.getTime() - now.getTime() < twentyFourHours;
  }).length;
}

export function ApprovalBadge({ className, variant = 'icon' }: ApprovalBadgeProps) {
  const { approvals, clientApprovals, pendingCount, isLoading, error } = useApprovals('pending');
  const [isUrgent, setIsUrgent] = useState(false);
  const [urgentCount, setUrgentCount] = useState(0);

  // Check for urgent approvals
  useEffect(() => {
    const allApprovals = [...approvals, ...clientApprovals];
    setIsUrgent(hasUrgentApprovals(allApprovals));
    setUrgentCount(getUrgentCount(allApprovals));
  }, [approvals, clientApprovals]);

  // Don't render if loading, error, or no pending approvals
  if (isLoading || error) {
    return null;
  }

  if (pendingCount === 0) {
    return variant === 'full' ? (
      <Link href="/approvals" className={className}>
        <Button variant="ghost" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          <span>Approvals</span>
        </Button>
      </Link>
    ) : null;
  }

  const badge = (
    <Link href="/approvals" className={className}>
      <Button
        variant={isUrgent ? 'destructive' : 'ghost'}
        size={variant === 'icon' ? 'icon' : 'sm'}
        className={cn(
          'relative',
          variant === 'full' && 'gap-2',
          isUrgent && variant === 'icon' && 'bg-red-100 hover:bg-red-200 text-red-600'
        )}
      >
        {isUrgent ? (
          <AlertTriangle className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {variant === 'full' && <span>Approvals</span>}
        <Badge
          variant={isUrgent ? 'destructive' : 'secondary'}
          className={cn(
            variant === 'icon' && 'absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs',
            variant === 'full' && 'ml-1'
          )}
        >
          {pendingCount > 99 ? '99+' : pendingCount}
        </Badge>
      </Button>
    </Link>
  );

  if (variant === 'full') {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-sm">
            <p className="font-medium">
              {pendingCount} pending approval{pendingCount !== 1 ? 's' : ''}
            </p>
            {urgentCount > 0 && (
              <p className="text-red-500 text-xs">
                {urgentCount} expiring soon
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default ApprovalBadge;
