/**
 * Plan Badge Component
 *
 * Displays the user's current plan status (Trial, Founder, Consultant).
 * Shows trial days remaining for trial users.
 *
 * @story US-FT02, US-FT04
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock, Crown, Building2 } from 'lucide-react';
import Link from 'next/link';
import { useRoleInfo } from '@/lib/auth/hooks';
import { cn } from '@/lib/utils';

interface PlanBadgeProps {
  className?: string;
  showUpgradeLink?: boolean;
  variant?: 'default' | 'compact';
}

export function PlanBadge({ className, showUpgradeLink = true, variant = 'default' }: PlanBadgeProps) {
  const { role, isTrial, trialReadonly, loading } = useRoleInfo();

  if (loading) {
    return null;
  }

  // Paid Founder
  if (role === 'founder' || (role === 'founder_trial' && !trialReadonly)) {
    return (
      <Badge
        variant="default"
        className={cn(
          'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground',
          className
        )}
      >
        <Crown className="h-3 w-3 mr-1" />
        Founder
      </Badge>
    );
  }

  // Paid Consultant
  if (role === 'consultant' || (role === 'consultant_trial' && !trialReadonly)) {
    return (
      <Badge
        variant="default"
        className={cn(
          'bg-gradient-to-r from-purple-600 to-purple-500 text-white',
          className
        )}
      >
        <Building2 className="h-3 w-3 mr-1" />
        Consultant
      </Badge>
    );
  }

  // Trial user
  if (isTrial && trialReadonly) {
    if (variant === 'compact') {
      return (
        <Badge variant="secondary" className={cn('bg-amber-100 text-amber-800', className)}>
          <Clock className="h-3 w-3 mr-1" />
          Trial
        </Badge>
      );
    }

    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Badge variant="secondary" className="bg-amber-100 text-amber-800">
          <Clock className="h-3 w-3 mr-1" />
          Trial Account
        </Badge>
        {showUpgradeLink && (
          <Button asChild size="sm" variant="outline" className="h-6 text-xs">
            <Link href="/pricing">
              <Sparkles className="h-3 w-3 mr-1" />
              Upgrade
            </Link>
          </Button>
        )}
      </div>
    );
  }

  // Admin or other roles
  if (role === 'admin') {
    return (
      <Badge variant="destructive" className={className}>
        Admin
      </Badge>
    );
  }

  return null;
}
