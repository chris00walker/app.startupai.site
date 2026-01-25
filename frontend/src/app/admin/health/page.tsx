'use client';

/**
 * Admin System Health Dashboard
 *
 * Real-time system health monitoring for Modal, Supabase, and other services.
 *
 * @story US-A05
 */

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SystemHealthCard, StatusIcon } from '@/components/admin/SystemHealthCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Clock,
  Server,
  Database,
  Zap,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { SystemHealth } from '@/lib/types/admin';

export default function AdminHealthPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    try {
      const response = await fetch('/api/admin/health');
      const data = await response.json();

      if (data.success) {
        setHealth(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchHealth(), 30000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">System Health</h2>
            <p className="text-muted-foreground">
              Monitor the health of all platform services
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchHealth(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overall Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Overall System Status
              </CardTitle>
              {health && (
                <div className="flex items-center gap-2">
                  <StatusIcon status={health.overall} />
                  <span className="font-semibold capitalize">{health.overall}</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-4">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-48" />
              </div>
            ) : health ? (
              <p className="text-muted-foreground">
                Last checked:{' '}
                {formatDistanceToNow(new Date(health.lastCheck), { addSuffix: true })}
              </p>
            ) : (
              <p className="text-muted-foreground">Unable to fetch health status</p>
            )}
          </CardContent>
        </Card>

        {/* Services Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <SystemHealthCard
            name="Modal (AI Engine)"
            icon={Zap}
            health={health?.services.modal}
          />
          <SystemHealthCard
            name="Supabase (Database)"
            icon={Database}
            health={health?.services.supabase}
          />
          <SystemHealthCard
            name="Stripe (Payments)"
            icon={Server}
            health={health?.services.stripe}
          />
        </div>

        {/* Workflow Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Workflows</CardDescription>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <CardTitle className="text-3xl">{health?.workflows.active || 0}</CardTitle>
              )}
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Failed (24h)</CardDescription>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <CardTitle className="text-3xl text-red-500">
                  {health?.workflows.failed24h || 0}
                </CardTitle>
              )}
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending HITL Approvals</CardDescription>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <CardTitle className="text-3xl">{health?.workflows.pendingHitl || 0}</CardTitle>
              )}
            </CardHeader>
          </Card>
        </div>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Critical Errors (1h)
            </CardTitle>
            <CardDescription>
              {health ? `${health.errors.rate1h} errors in the last hour` : 'Loading...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : health?.errors.recent.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                <p>No critical errors in the last hour</p>
              </div>
            ) : (
              <div className="space-y-3">
                {health?.errors.recent.map((error) => (
                  <div
                    key={error.id}
                    className="flex items-start gap-3 p-3 border rounded-lg bg-red-500/5 border-red-500/20"
                  >
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {error.errorType}
                        </Badge>
                        {error.userId && (
                          <span className="text-xs text-muted-foreground">
                            User: {error.userId.slice(0, 8)}...
                          </span>
                        )}
                      </div>
                      <p className="text-sm mt-1">{error.message}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(error.timestamp), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
