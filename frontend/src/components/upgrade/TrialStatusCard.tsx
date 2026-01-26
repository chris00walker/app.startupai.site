/**
 * Trial Status Card Component
 *
 * Displays trial status information including:
 * - Days remaining countdown
 * - Usage limits (mock clients, projects, etc.)
 * - Locked features
 * - Upgrade CTA
 *
 * @story US-CT04, US-FT02
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Crown,
  Lock,
  Users,
  FileText,
  Zap,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

interface TrialLimit {
  used: number;
  max: number;
}

interface TrialStatusData {
  is_trial: boolean;
  role: string;
  days_remaining: number | null;
  expires_at: string | null;
  limits: {
    mock_clients?: TrialLimit;
    projects?: TrialLimit;
    reports_daily?: TrialLimit;
    workflows_monthly?: TrialLimit;
  };
  locked_features: string[];
  upgrade_url: string;
}

interface TrialStatusCardProps {
  className?: string;
}

// ============================================================================
// Feature Labels
// ============================================================================

const FEATURE_LABELS: Record<string, string> = {
  real_invites: 'Invite real clients',
  white_label: 'White-label branding',
  priority_processing: 'Priority AI processing',
  unlimited_clients: 'Unlimited clients',
  unlimited_projects: 'Unlimited projects',
  export_reports: 'Export reports',
  team_members: 'Team collaboration',
};

// ============================================================================
// Component
// ============================================================================

export function TrialStatusCard({ className }: TrialStatusCardProps) {
  const [status, setStatus] = useState<TrialStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTrialStatus() {
      try {
        const response = await fetch('/api/trial/status');
        if (!response.ok) {
          throw new Error('Failed to fetch trial status');
        }
        const data = await response.json();
        setStatus(data);
      } catch (err) {
        console.error('[TrialStatusCard] Error:', err);
        setError('Unable to load trial status');
      } finally {
        setLoading(false);
      }
    }

    fetchTrialStatus();
  }, []);

  // Don't render for non-trial users
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Loading trial status...</span>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (error || !status?.is_trial) {
    // Non-trial users or error - don't show card
    return null;
  }

  const isConsultantTrial = status.role === 'consultant_trial';
  const isExpiringSoon = status.days_remaining !== null && status.days_remaining <= 3;
  const isExpired = status.days_remaining !== null && status.days_remaining === 0;

  return (
    <Card className={cn(
      'relative overflow-hidden',
      isExpiringSoon && !isExpired && 'border-amber-500/50 bg-amber-50/5',
      isExpired && 'border-red-500/50 bg-red-50/5',
      className
    )}>
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Crown className="w-4 h-4 text-amber-500" />
            {isConsultantTrial ? 'Consultant Trial' : 'Founder Trial'}
          </CardTitle>
          <Badge
            variant={isExpired ? 'destructive' : isExpiringSoon ? 'outline' : 'secondary'}
            className={cn(
              isExpiringSoon && !isExpired && 'border-amber-500 text-amber-700 dark:text-amber-400'
            )}
          >
            {isExpired ? 'Expired' : isExpiringSoon ? 'Expiring soon' : 'Active'}
          </Badge>
        </div>
        <CardDescription className="flex items-center gap-1.5 mt-1">
          <Clock className="w-3.5 h-3.5" />
          {status.days_remaining !== null ? (
            status.days_remaining === 0 ? (
              'Trial has expired'
            ) : status.days_remaining === 1 ? (
              '1 day remaining'
            ) : (
              `${status.days_remaining} days remaining`
            )
          ) : (
            'Trial period active'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Usage Limits */}
        <div className="space-y-3">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Usage
          </h4>

          {/* Mock Clients (Consultant) */}
          {status.limits.mock_clients && (
            <UsageItem
              icon={Users}
              label="Mock Clients"
              used={status.limits.mock_clients.used}
              max={status.limits.mock_clients.max}
            />
          )}

          {/* Projects (Founder) */}
          {status.limits.projects && (
            <UsageItem
              icon={FileText}
              label="Projects"
              used={status.limits.projects.used}
              max={status.limits.projects.max}
            />
          )}

          {/* Reports Daily */}
          {status.limits.reports_daily && (
            <UsageItem
              icon={FileText}
              label="Reports today"
              used={status.limits.reports_daily.used}
              max={status.limits.reports_daily.max}
            />
          )}

          {/* Workflows Monthly */}
          {status.limits.workflows_monthly && (
            <UsageItem
              icon={Zap}
              label="AI workflows this month"
              used={status.limits.workflows_monthly.used}
              max={status.limits.workflows_monthly.max}
            />
          )}
        </div>

        {/* Locked Features */}
        {status.locked_features.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
              <Lock className="w-3 h-3" />
              Locked Features
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {status.locked_features.slice(0, 4).map(feature => (
                <Badge
                  key={feature}
                  variant="outline"
                  className="text-xs font-normal text-muted-foreground"
                >
                  {FEATURE_LABELS[feature] || feature}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Warning for expiring soon */}
        {isExpiringSoon && !isExpired && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs">
              Your trial expires soon. Upgrade now to keep access to all features.
            </p>
          </div>
        )}

        {/* Expired warning */}
        {isExpired && (
          <div className="flex items-start gap-2 p-2.5 rounded-md bg-red-500/10 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-xs">
              Your trial has expired. Upgrade to continue using StartupAI.
            </p>
          </div>
        )}

        {/* Upgrade CTA */}
        <Button asChild className="w-full" size="sm">
          <Link href={status.upgrade_url}>
            <Crown className="w-4 h-4 mr-2" />
            {isExpired ? 'Unlock Full Access' : 'Upgrade Now'}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Usage Item Sub-component
// ============================================================================

interface UsageItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  used: number;
  max: number;
}

function UsageItem({ icon: Icon, label, used, max }: UsageItemProps) {
  const percentage = Math.min((used / max) * 100, 100);
  const isAtLimit = used >= max;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className="w-3.5 h-3.5" />
          {label}
        </span>
        <span className={cn(
          'text-xs font-medium',
          isAtLimit && 'text-amber-600 dark:text-amber-400'
        )}>
          {used} / {max}
        </span>
      </div>
      <Progress
        value={percentage}
        className={cn(
          'h-1.5',
          isAtLimit && '[&>div]:bg-amber-500'
        )}
      />
    </div>
  );
}

export default TrialStatusCard;
