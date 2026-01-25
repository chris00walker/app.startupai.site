'use client';

/**
 * System Health Card Component
 *
 * Displays health status for a single service with status icon and details.
 *
 * @story US-A05
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { ServiceHealth } from '@/lib/types/admin';

interface SystemHealthCardProps {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  health?: ServiceHealth;
}

function StatusIcon({ status }: { status: ServiceHealth['status'] }) {
  switch (status) {
    case 'healthy':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'degraded':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'down':
      return <XCircle className="h-5 w-5 text-red-500" />;
  }
}

function StatusBadge({ status }: { status: ServiceHealth['status'] }) {
  switch (status) {
    case 'healthy':
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          Healthy
        </Badge>
      );
    case 'degraded':
      return (
        <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
          Degraded
        </Badge>
      );
    case 'down':
      return <Badge variant="destructive">Down</Badge>;
  }
}

export function SystemHealthCard({ name, icon: Icon, health }: SystemHealthCardProps) {
  if (!health) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {name}
          </CardTitle>
          <StatusIcon status={health.status} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <StatusBadge status={health.status} />
          {health.latencyMs !== undefined && (
            <p className="text-xs text-muted-foreground">
              Latency: {health.latencyMs}ms
            </p>
          )}
          {health.error && (
            <p className="text-xs text-red-500">{health.error}</p>
          )}
          <p className="text-xs text-muted-foreground">
            Last check:{' '}
            {formatDistanceToNow(new Date(health.lastCheck), { addSuffix: true })}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// Also export the helper components for flexibility
export { StatusIcon, StatusBadge };
