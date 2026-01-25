'use client';

/**
 * Ad Analytics Dashboard Component
 *
 * Admin component for viewing aggregate ad analytics across all founders.
 * Shows spend trends, platform performance, and campaign metrics.
 *
 * @story US-AM04
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  MousePointer,
  Users,
  Target,
  BarChart3,
  Loader2,
} from 'lucide-react';
import type { AdPlatform } from '@/db/schema';

interface PlatformMetrics {
  platform: AdPlatform;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  cpa: number;
  campaigns: number;
}

interface FounderMetrics {
  userId: string;
  userName: string;
  allocated: number;
  spent: number;
  remaining: number;
  campaigns: number;
  conversions: number;
}

interface AdAnalyticsProps {
  totalSpend: number;
  totalAllocated: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  activeFounders: number;
  activeCampaigns: number;
  platformMetrics: PlatformMetrics[];
  topFounders?: FounderMetrics[];
  isLoading?: boolean;
  spendTrend?: number; // percentage change from last period
}

const PLATFORM_NAMES: Record<AdPlatform, string> = {
  meta: 'Meta',
  google: 'Google',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  x: 'X',
  pinterest: 'Pinterest',
};

const PLATFORM_COLORS: Record<AdPlatform, string> = {
  meta: '#1877F2',
  google: '#4285F4',
  tiktok: '#000000',
  linkedin: '#0A66C2',
  x: '#000000',
  pinterest: '#E60023',
};

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        {trend !== undefined && (
          <div className="flex items-center pt-1">
            {trend >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span
              className={`text-xs ml-1 ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}
            >
              {trend >= 0 ? '+' : ''}
              {trend.toFixed(1)}% from last period
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function AdAnalytics({
  totalSpend,
  totalAllocated,
  totalImpressions,
  totalClicks,
  totalConversions,
  activeFounders,
  activeCampaigns,
  platformMetrics,
  topFounders,
  isLoading,
  spendTrend,
}: AdAnalyticsProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const overallCpc = totalClicks > 0 ? totalSpend / totalClicks : 0;
  const budgetUtilization = totalAllocated > 0 ? (totalSpend / totalAllocated) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Ad Spend"
          value={`$${totalSpend.toLocaleString()}`}
          subtitle={`of $${totalAllocated.toLocaleString()} allocated`}
          icon={DollarSign}
          trend={spendTrend}
        />
        <MetricCard
          title="Impressions"
          value={totalImpressions.toLocaleString()}
          subtitle={`${overallCtr.toFixed(2)}% CTR`}
          icon={Eye}
        />
        <MetricCard
          title="Clicks"
          value={totalClicks.toLocaleString()}
          subtitle={`$${overallCpc.toFixed(2)} CPC`}
          icon={MousePointer}
        />
        <MetricCard
          title="Conversions"
          value={totalConversions.toLocaleString()}
          subtitle={`${activeCampaigns} active campaigns`}
          icon={Target}
        />
      </div>

      {/* Budget Utilization */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Utilization</CardTitle>
          <CardDescription>
            {activeFounders} active founders, {activeCampaigns} campaigns running
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                ${totalSpend.toLocaleString()} / ${totalAllocated.toLocaleString()}
              </span>
              <span className="font-medium">{budgetUtilization.toFixed(1)}%</span>
            </div>
            <Progress value={budgetUtilization} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Platform Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance by Platform
          </CardTitle>
          <CardDescription>Metrics breakdown across ad platforms</CardDescription>
        </CardHeader>
        <CardContent>
          {platformMetrics.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No platform data available
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Impressions</TableHead>
                  <TableHead className="text-right">Clicks</TableHead>
                  <TableHead className="text-right">CTR</TableHead>
                  <TableHead className="text-right">CPC</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                  <TableHead className="text-right">Campaigns</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {platformMetrics.map((metrics) => (
                  <TableRow key={metrics.platform}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PLATFORM_COLORS[metrics.platform] }}
                        />
                        {PLATFORM_NAMES[metrics.platform]}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      ${metrics.spend.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {metrics.impressions.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      {metrics.clicks.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">{metrics.ctr.toFixed(2)}%</TableCell>
                    <TableCell className="text-right">${metrics.cpc.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{metrics.conversions}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{metrics.campaigns}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Top Founders by Spend */}
      {topFounders && topFounders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Top Founders by Spend
            </CardTitle>
            <CardDescription>Founders with highest ad budget utilization</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Founder</TableHead>
                  <TableHead className="text-right">Allocated</TableHead>
                  <TableHead className="text-right">Spent</TableHead>
                  <TableHead className="text-right">Remaining</TableHead>
                  <TableHead className="text-right">Utilization</TableHead>
                  <TableHead className="text-right">Campaigns</TableHead>
                  <TableHead className="text-right">Conversions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topFounders.map((founder) => {
                  const utilization =
                    founder.allocated > 0 ? (founder.spent / founder.allocated) * 100 : 0;
                  return (
                    <TableRow key={founder.userId}>
                      <TableCell className="font-medium">{founder.userName}</TableCell>
                      <TableCell className="text-right">
                        ${founder.allocated.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${founder.spent.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        ${founder.remaining.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={utilization > 80 ? 'destructive' : utilization > 50 ? 'default' : 'secondary'}
                        >
                          {utilization.toFixed(0)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{founder.campaigns}</TableCell>
                      <TableCell className="text-right">{founder.conversions}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
