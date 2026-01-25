'use client';

/**
 * Ad Platform Health Dashboard
 *
 * Displays health status, API status, rate limits, and credential expiry
 * for all connected ad platform accounts.
 *
 * @story US-AM06, US-AM07
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Loader2,
  Activity,
  Shield,
  Gauge,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AdPlatform, AdPlatformStatus } from '@/db/schema';

interface PlatformConnection {
  id: string;
  platform: AdPlatform;
  accountId: string;
  accountName: string | null;
  status: AdPlatformStatus;
  lastHealthCheck: string | null;
  lastSuccessfulCall: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  rateLimitRemaining: string | null;
  rateLimitResetAt: string | null;
  tokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
}

interface AdPlatformHealthProps {
  connections: PlatformConnection[];
  isLoading?: boolean;
  onRefresh?: () => void;
  onHealthCheck?: (connectionId: string) => void;
}

const PLATFORM_NAMES: Record<AdPlatform, string> = {
  meta: 'Meta',
  google: 'Google Ads',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  x: 'X (Twitter)',
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

const STATUS_CONFIG: Record<AdPlatformStatus, { icon: React.ReactNode; color: string; label: string }> = {
  active: {
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'text-green-500',
    label: 'Active',
  },
  paused: {
    icon: <Clock className="h-4 w-4" />,
    color: 'text-yellow-500',
    label: 'Paused',
  },
  error: {
    icon: <XCircle className="h-4 w-4" />,
    color: 'text-red-500',
    label: 'Error',
  },
  expired: {
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'text-orange-500',
    label: 'Expired',
  },
};

function PlatformHealthCard({
  connection,
  onHealthCheck,
}: {
  connection: PlatformConnection;
  onHealthCheck?: (connectionId: string) => void;
}) {
  const statusConfig = STATUS_CONFIG[connection.status];
  const platformColor = PLATFORM_COLORS[connection.platform];

  // Calculate token expiry status
  const tokenExpiry = connection.tokenExpiresAt ? new Date(connection.tokenExpiresAt) : null;
  const refreshTokenExpiry = connection.refreshTokenExpiresAt
    ? new Date(connection.refreshTokenExpiresAt)
    : null;

  const now = new Date();
  const tokenExpiresInDays = tokenExpiry
    ? Math.floor((tokenExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const isTokenExpiringSoon = tokenExpiresInDays !== null && tokenExpiresInDays <= 7;
  const isTokenExpired = tokenExpiresInDays !== null && tokenExpiresInDays < 0;

  // Parse rate limit
  const rateLimitRemaining = connection.rateLimitRemaining
    ? parseInt(connection.rateLimitRemaining, 10)
    : null;

  return (
    <Card className={connection.status === 'error' ? 'border-red-200' : ''}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: platformColor }}
            />
            <CardTitle className="text-base">
              {PLATFORM_NAMES[connection.platform]}
            </CardTitle>
          </div>
          <div className={`flex items-center gap-1 ${statusConfig.color}`}>
            {statusConfig.icon}
            <span className="text-sm font-medium">{statusConfig.label}</span>
          </div>
        </div>
        <CardDescription className="text-xs">
          {connection.accountName || connection.accountId}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error Message */}
        {connection.errorMessage && (
          <div className="bg-red-50 text-red-700 text-xs p-2 rounded-md">
            <div className="font-medium">
              {connection.errorCode ? `[${connection.errorCode}] ` : ''}
              Error
            </div>
            <div className="mt-1">{connection.errorMessage}</div>
          </div>
        )}

        {/* Health Metrics */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Last Health Check */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Activity className="h-3 w-3" />
              Last Check
            </div>
            <div className="font-medium text-xs">
              {connection.lastHealthCheck
                ? formatDistanceToNow(new Date(connection.lastHealthCheck), { addSuffix: true })
                : 'Never'}
            </div>
          </div>

          {/* Last Successful Call */}
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <CheckCircle className="h-3 w-3" />
              Last Success
            </div>
            <div className="font-medium text-xs">
              {connection.lastSuccessfulCall
                ? formatDistanceToNow(new Date(connection.lastSuccessfulCall), { addSuffix: true })
                : 'Never'}
            </div>
          </div>
        </div>

        {/* Token Expiry */}
        {tokenExpiry && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Shield className="h-3 w-3" />
                Token Expires
              </span>
              <span
                className={
                  isTokenExpired
                    ? 'text-red-500 font-medium'
                    : isTokenExpiringSoon
                      ? 'text-orange-500 font-medium'
                      : 'text-muted-foreground'
                }
              >
                {isTokenExpired
                  ? 'Expired'
                  : tokenExpiresInDays !== null
                    ? `${tokenExpiresInDays} days`
                    : 'Unknown'}
              </span>
            </div>
            {!isTokenExpired && tokenExpiresInDays !== null && (
              <Progress
                value={Math.max(0, Math.min(100, (tokenExpiresInDays / 30) * 100))}
                className={`h-1 ${isTokenExpiringSoon ? '[&>div]:bg-orange-500' : ''}`}
              />
            )}
          </div>
        )}

        {/* Rate Limit */}
        {rateLimitRemaining !== null && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1 text-muted-foreground">
                <Gauge className="h-3 w-3" />
                Rate Limit
              </span>
              <span
                className={
                  rateLimitRemaining < 100
                    ? 'text-orange-500 font-medium'
                    : 'text-muted-foreground'
                }
              >
                {rateLimitRemaining.toLocaleString()} remaining
              </span>
            </div>
            {connection.rateLimitResetAt && (
              <div className="text-xs text-muted-foreground">
                Resets {formatDistanceToNow(new Date(connection.rateLimitResetAt), { addSuffix: true })}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end pt-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onHealthCheck?.(connection.id)}
                  className="h-7 px-2"
                >
                  <RefreshCw className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Run health check</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdPlatformHealth({
  connections,
  isLoading,
  onRefresh,
  onHealthCheck,
}: AdPlatformHealthProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center space-y-3">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading platform health...</p>
        </div>
      </div>
    );
  }

  if (connections.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-48 text-center">
          <Activity className="h-8 w-8 text-muted-foreground mb-3" />
          <h3 className="font-medium">No Platforms Connected</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Connect an ad platform to start monitoring health status.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Summary stats
  const totalConnections = connections.length;
  const activeConnections = connections.filter((c) => c.status === 'active').length;
  const errorConnections = connections.filter((c) => c.status === 'error').length;
  const expiredConnections = connections.filter((c) => c.status === 'expired').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            {activeConnections} Active
          </Badge>
          {errorConnections > 0 && (
            <Badge variant="secondary" className="bg-red-100 text-red-700">
              {errorConnections} Error
            </Badge>
          )}
          {expiredConnections > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {expiredConnections} Expired
            </Badge>
          )}
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh All
          </Button>
        )}
      </div>

      {/* Platform Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((connection) => (
          <PlatformHealthCard
            key={connection.id}
            connection={connection}
            onHealthCheck={onHealthCheck}
          />
        ))}
      </div>
    </div>
  );
}
