/**
 * Sync Status Component
 *
 * Displays the sync status and history for an integration.
 * Shows last sync time, status, and allows manual sync trigger.
 *
 * @story US-BI02
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  RefreshCw,
  Check,
  X,
  Clock,
  AlertCircle,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IntegrationType } from '@/types/integrations';

interface SyncHistoryItem {
  id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  target_url?: string;
  error_message?: string;
}

interface SyncStatusProps {
  integrationType: IntegrationType;
  projectId: string;
  autoSyncEnabled?: boolean;
  onAutoSyncChange?: (enabled: boolean) => void;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Pending',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  in_progress: {
    icon: Loader2,
    label: 'Syncing',
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  completed: {
    icon: Check,
    label: 'Synced',
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
  },
  failed: {
    icon: X,
    label: 'Failed',
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
  },
};

export function SyncStatus({
  integrationType,
  projectId,
  autoSyncEnabled = false,
  onAutoSyncChange,
}: SyncStatusProps) {
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/integrations/${integrationType}/sync?projectId=${projectId}&limit=5`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sync history');
      }

      setHistory(data.syncHistory || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [integrationType, projectId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);

    try {
      const response = await fetch(`/api/integrations/${integrationType}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      // Refresh history
      await fetchHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSyncing(false);
    }
  };

  const latestSync = history[0];
  const latestStatus = latestSync?.status || null;
  const config = latestStatus ? statusConfig[latestStatus] : null;

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading sync status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status and Sync Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {config ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="outline"
                    className={cn('gap-1', config.bgColor)}
                  >
                    <config.icon
                      className={cn(
                        'h-3 w-3',
                        config.color,
                        latestStatus === 'in_progress' && 'animate-spin'
                      )}
                    />
                    {config.label}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  {latestSync?.completed_at
                    ? `Last synced: ${formatTime(latestSync.completed_at)}`
                    : `Started: ${formatTime(latestSync?.started_at || '')}`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Never synced
            </Badge>
          )}

          {latestSync?.target_url && (
            <a
              href={latestSync.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              View <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleSync}
          disabled={syncing}
        >
          {syncing ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-1" />
          )}
          Sync Now
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {latestSync?.status === 'failed' && latestSync.error_message && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {latestSync.error_message}
        </div>
      )}

      {/* Auto-sync Toggle */}
      {onAutoSyncChange && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-0.5">
            <Label htmlFor="auto-sync" className="text-sm font-medium">
              Auto-sync
            </Label>
            <p className="text-xs text-muted-foreground">
              Automatically sync changes every hour
            </p>
          </div>
          <Switch
            id="auto-sync"
            checked={autoSyncEnabled}
            onCheckedChange={onAutoSyncChange}
          />
        </div>
      )}

      {/* Recent History */}
      {history.length > 1 && (
        <div className="pt-2 border-t">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Recent syncs
          </p>
          <div className="space-y-1">
            {history.slice(1, 4).map((item) => {
              const itemConfig = statusConfig[item.status];
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between text-xs text-muted-foreground"
                >
                  <div className="flex items-center gap-1">
                    <itemConfig.icon
                      className={cn(
                        'h-3 w-3',
                        itemConfig.color,
                        item.status === 'in_progress' && 'animate-spin'
                      )}
                    />
                    {itemConfig.label}
                  </div>
                  <span>
                    {formatTime(item.completed_at || item.started_at)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
