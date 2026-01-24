'use client';

/**
 * Integration Card Component
 *
 * Displays a single integration with connection status, actions, and config.
 *
 * @story US-I01, US-I02, US-I03, US-I05, US-I06
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  MessageSquare,
  Bird,
  FileText,
  HardDrive,
  Box,
  CheckSquare,
  Table,
  Target,
  Palette,
  Github,
  Settings,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import type { IntegrationConfig, UserIntegrationWithPreferences, IntegrationStatus } from '@/types/integrations';

interface IntegrationCardProps {
  config: IntegrationConfig;
  integration?: UserIntegrationWithPreferences;
  onConnect: () => void;
  onDisconnect: () => Promise<void>;
  onConfigure: () => void;
  isConnecting?: boolean;
}

// Map fallback icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  MessageSquare,
  Bird,
  FileText,
  HardDrive,
  Box,
  CheckSquare,
  Table,
  Target,
  Palette,
  Github,
};

/**
 * Check if a token is expired based on expires_at timestamp
 */
function isTokenExpired(expiresAt?: string): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

/**
 * Get the effective status considering token expiry
 */
function getEffectiveStatus(
  integration?: UserIntegrationWithPreferences
): IntegrationStatus | 'not_connected' {
  if (!integration) return 'not_connected';

  // Check client-side if token is expired
  if (integration.status === 'active' && isTokenExpired(integration.tokenExpiresAt)) {
    return 'expired';
  }

  return integration.status;
}

/**
 * Status badge component
 */
function StatusBadge({ status }: { status: IntegrationStatus | 'not_connected' }) {
  switch (status) {
    case 'active':
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="mr-1 h-3 w-3" />
          Connected
        </Badge>
      );
    case 'expired':
      return (
        <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
          <AlertTriangle className="mr-1 h-3 w-3" />
          Expired
        </Badge>
      );
    case 'revoked':
    case 'error':
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
          <XCircle className="mr-1 h-3 w-3" />
          {status === 'revoked' ? 'Revoked' : 'Error'}
        </Badge>
      );
    default:
      return null;
  }
}

export function IntegrationCard({
  config,
  integration,
  onConnect,
  onDisconnect,
  onConfigure,
  isConnecting = false,
}: IntegrationCardProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const status = getEffectiveStatus(integration);
  const isConnected = status === 'active';
  const needsReconnect = status === 'expired' || status === 'revoked' || status === 'error';

  // Get icon component
  const IconComponent = ICON_MAP[config.fallbackIcon] || MessageSquare;

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-center space-x-3">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${config.color}15` }}
        >
          <IconComponent className="h-5 w-5" style={{ color: config.color }} />
        </div>

        {/* Info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium">{config.name}</h4>
            <StatusBadge status={status} />
          </div>
          <p className="text-sm text-muted-foreground truncate max-w-[200px]">
            {integration?.providerAccountName || integration?.providerAccountEmail || config.description}
          </p>
          {integration?.connectedAt && (
            <p className="text-xs text-muted-foreground">
              Connected {new Date(integration.connectedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {isConnected && (
          <>
            <Button variant="ghost" size="icon" onClick={onConfigure} title="Configure">
              <Settings className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  Disconnect
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Disconnect {config.name}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the connection to {config.name}. Any preferences will be deleted.
                    You can reconnect at any time.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {isDisconnecting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Disconnecting...
                      </>
                    ) : (
                      'Disconnect'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}

        {needsReconnect && (
          <Button
            variant="outline"
            size="sm"
            onClick={onConnect}
            disabled={isConnecting}
            className="text-amber-600 border-amber-300 hover:bg-amber-50"
          >
            {isConnecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Reconnect
          </Button>
        )}

        {status === 'not_connected' && (
          <Button variant="outline" size="sm" onClick={onConnect} disabled={isConnecting}>
            {isConnecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
