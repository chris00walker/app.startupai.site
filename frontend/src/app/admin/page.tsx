'use client';

/**
 * Admin Dashboard Hub Page
 *
 * Main entry point for the admin panel showing key metrics and quick actions.
 *
 * @story US-A11
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Activity,
  AlertTriangle,
  Flag,
  Megaphone,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalUsers: number;
  activeTrials: number;
  paidSubscriptions: number;
  failedWorkflows: number;
  systemHealth: 'healthy' | 'degraded' | 'down';
  adPlatformsConnected: number;
  pendingApprovals: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const supabase = createClient();

        // Fetch all stats in parallel for better performance
        const [
          usersResult,
          trialsResult,
          paidResult,
          adPlatformsResult,
          failedWorkflowsResult,
          pendingApprovalsResult,
          healthResult,
        ] = await Promise.all([
          // Total users
          supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true }),

          // Active trials
          supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'trial'),

          // Paid subscriptions
          supabase
            .from('user_profiles')
            .select('*', { count: 'exact', head: true })
            .in('subscription_status', ['active', 'trialing'])
            .neq('role', 'trial'),

          // Ad platform connections
          supabase
            .from('ad_platform_connections')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active'),

          // Failed workflows (last 24 hours)
          supabase
            .from('crewai_validation_states')
            .select('*', { count: 'exact', head: true })
            .in('run_status', ['failed', 'error', 'timeout'])
            .gte('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),

          // Pending approvals
          supabase
            .from('approval_requests')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending'),

          // System health from API
          fetch('/api/admin/health')
            .then((res) => (res.ok ? res.json() : null))
            .catch(() => null),
        ]);

        // Extract health status
        let systemHealth: 'healthy' | 'degraded' | 'down' = 'healthy';
        if (healthResult?.data?.overall) {
          systemHealth = healthResult.data.overall;
        }

        setStats({
          totalUsers: usersResult.count || 0,
          activeTrials: trialsResult.count || 0,
          paidSubscriptions: paidResult.count || 0,
          failedWorkflows: failedWorkflowsResult.count || 0,
          systemHealth,
          adPlatformsConnected: adPlatformsResult.count || 0,
          pendingApprovals: pendingApprovalsResult.count || 0,
        });
      } catch (error) {
        console.error('[admin/dashboard] Error fetching stats:', error);
        setStats({
          totalUsers: 0,
          activeTrials: 0,
          paidSubscriptions: 0,
          failedWorkflows: 0,
          systemHealth: 'down',
          adPlatformsConnected: 0,
          pendingApprovals: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const healthIcon =
    stats?.systemHealth === 'healthy' ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : stats?.systemHealth === 'degraded' ? (
      <Clock className="h-5 w-5 text-yellow-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );

  const healthBadge =
    stats?.systemHealth === 'healthy' ? (
      <Badge variant="default" className="bg-green-500/10 text-green-500 border-green-500/20">
        Healthy
      </Badge>
    ) : stats?.systemHealth === 'degraded' ? (
      <Badge variant="default" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
        Degraded
      </Badge>
    ) : (
      <Badge variant="destructive">Down</Badge>
    );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Overview of the StartupAI platform status and key metrics.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Total Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {loading ? (
                  <Skeleton className="h-3 w-32 mt-1" />
                ) : (
                  `${stats?.activeTrials || 0} active trials`
                )}
              </p>
            </CardContent>
          </Card>

          {/* Paid Subscriptions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid Subscriptions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.paidSubscriptions || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">Active paying customers</p>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              {loading ? <Skeleton className="h-4 w-4" /> : healthIcon}
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="flex items-center gap-2">{healthBadge}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                <Link href="/admin/health" className="hover:underline">
                  View details
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Failed Workflows */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed Workflows</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stats?.failedWorkflows || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                <Link href="/admin/workflows" className="hover:underline">
                  View and retry
                </Link>
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Search, view, and manage user accounts</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/users" className="flex items-center justify-between">
                  Search Users
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Feature Flags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="h-5 w-5" />
                Feature Flags
              </CardTitle>
              <CardDescription>Control feature rollouts and A/B tests</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/features" className="flex items-center justify-between">
                  Manage Flags
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Ad Platforms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Ad Platforms
              </CardTitle>
              <CardDescription>
                {loading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  `${stats?.adPlatformsConnected || 0} platforms connected`
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/ad-platforms" className="flex items-center justify-between">
                  Manage Platforms
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals Alert */}
        {!loading && stats && stats.pendingApprovals > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <Clock className="h-5 w-5" />
                Pending Approvals
              </CardTitle>
              <CardDescription>
                {stats.pendingApprovals} approval{stats.pendingApprovals !== 1 ? 's' : ''} waiting for review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="outline" size="sm">
                <Link href="/approvals" className="flex items-center gap-2">
                  Review Approvals
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity (Placeholder) */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Admin Activity</CardTitle>
            <CardDescription>Latest actions performed by admin users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>View recent admin actions in the audit log</p>
              <Button asChild variant="link" className="mt-2">
                <Link href="/admin/audit">View Audit Logs</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
