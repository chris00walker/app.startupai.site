'use client';

/**
 * Integration Selector Component
 *
 * Allows users to optionally connect external services during onboarding.
 * Shows integrations grouped by category with multi-select capability.
 *
 * @story US-BI04, US-BI05, US-I01
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Loader2,
  CheckCircle,
  ArrowRight,
  Globe,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useIntegrations } from '@/hooks/useIntegrations';
import {
  INTEGRATIONS,
  INTEGRATION_CATEGORIES,
  CATEGORY_ORDER,
  getIntegrationsByCategory,
} from '@/lib/integrations/config';
import type { IntegrationConfig, IntegrationType } from '@/types/integrations';

// Map icon names to Lucide components
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

interface IntegrationSelectorProps {
  /** Project ID to associate with integrations */
  projectId?: string;
  /** Callback when user completes or skips integration selection */
  onComplete: (selectedTypes: IntegrationType[]) => void;
  /** Show skip button (default: true) */
  showSkip?: boolean;
  /** Custom skip button text */
  skipText?: string;
  /** Custom continue button text */
  continueText?: string;
}

/**
 * Selectable integration card with checkbox
 */
function SelectableIntegrationCard({
  config,
  isSelected,
  isConnected,
  onToggle,
}: {
  config: IntegrationConfig;
  isSelected: boolean;
  isConnected: boolean;
  onToggle: () => void;
}) {
  const IconComponent = ICON_MAP[config.fallbackIcon] || MessageSquare;

  return (
    <div
      className={`
        relative flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all
        ${isSelected ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-gray-200 hover:border-gray-300'}
        ${isConnected ? 'opacity-60' : ''}
      `}
      onClick={() => !isConnected && onToggle()}
    >
      <Checkbox
        checked={isSelected || isConnected}
        onCheckedChange={() => !isConnected && onToggle()}
        disabled={isConnected}
        className="shrink-0"
      />

      <div
        className="w-8 h-8 shrink-0 rounded-md flex items-center justify-center"
        style={{ backgroundColor: `${config.color}15` }}
      >
        <IconComponent className="h-4 w-4" style={{ color: config.color }} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{config.name}</span>
          {isConnected && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
              <CheckCircle className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{config.description}</p>
      </div>
    </div>
  );
}

/**
 * Integration selector for onboarding flow
 */
export function IntegrationSelector({
  projectId,
  onComplete,
  showSkip = true,
  skipText = 'Skip for now',
  continueText = 'Connect Selected',
}: IntegrationSelectorProps) {
  const router = useRouter();
  const { integrations, isLoading, connect, getIntegration } = useIntegrations();

  const [selectedTypes, setSelectedTypes] = useState<Set<IntegrationType>>(new Set());
  const [connectingQueue, setConnectingQueue] = useState<IntegrationType[]>([]);
  const [currentlyConnecting, setCurrentlyConnecting] = useState<IntegrationType | null>(null);
  const [connectedTypes, setConnectedTypes] = useState<Set<IntegrationType>>(new Set());
  const [connectionProgress, setConnectionProgress] = useState(0);

  const isConnecting = connectingQueue.length > 0 || currentlyConnecting !== null;

  // Initialize connected types from existing integrations
  useEffect(() => {
    if (integrations) {
      const connected = new Set<IntegrationType>();
      for (const integration of integrations) {
        if (integration.status === 'active') {
          connected.add(integration.integrationType as IntegrationType);
        }
      }
      setConnectedTypes(connected);
    }
  }, [integrations]);

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'oauth_callback') {
        const integrationType = event.data.integrationType as IntegrationType;

        if (event.data.success) {
          setConnectedTypes((prev) => new Set([...prev, integrationType]));
          toast.success(`Connected to ${INTEGRATIONS.find((i) => i.type === integrationType)?.name}`);
        } else {
          toast.error(`Failed to connect: ${event.data.error || 'Unknown error'}`);
        }

        // Process next in queue
        setCurrentlyConnecting(null);
        processNextInQueue();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Process connection queue
  const processNextInQueue = useCallback(() => {
    setConnectingQueue((queue) => {
      if (queue.length === 0) {
        setCurrentlyConnecting(null);
        return queue;
      }

      const [next, ...rest] = queue;
      setCurrentlyConnecting(next);

      // Start OAuth flow for next integration
      connect(next).catch((err) => {
        toast.error(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setCurrentlyConnecting(null);
        processNextInQueue();
      });

      return rest;
    });
  }, [connect]);

  // Update progress
  useEffect(() => {
    if (selectedTypes.size === 0) {
      setConnectionProgress(0);
      return;
    }

    const total = selectedTypes.size;
    const completed = [...selectedTypes].filter((t) => connectedTypes.has(t)).length;
    setConnectionProgress(Math.round((completed / total) * 100));
  }, [selectedTypes, connectedTypes]);

  // Toggle integration selection
  const toggleSelection = (type: IntegrationType) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Start connecting selected integrations
  const handleConnect = async () => {
    const toConnect = [...selectedTypes].filter((t) => !connectedTypes.has(t));

    if (toConnect.length === 0) {
      // All selected already connected, proceed
      onComplete([...selectedTypes]);
      return;
    }

    // Queue up connections
    setConnectingQueue(toConnect);
    processNextInQueue();
  };

  // Skip integration selection
  const handleSkip = () => {
    onComplete([]);
  };

  // Check if all selected are now connected
  useEffect(() => {
    if (selectedTypes.size > 0 && !isConnecting) {
      const allConnected = [...selectedTypes].every((t) => connectedTypes.has(t));
      if (allConnected && connectionProgress === 100) {
        // Small delay to show completion
        const timer = setTimeout(() => {
          onComplete([...selectedTypes]);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [selectedTypes, connectedTypes, isConnecting, connectionProgress, onComplete]);

  const integrationsByCategory = getIntegrationsByCategory();
  const selectedCount = selectedTypes.size;
  const notConnectedCount = [...selectedTypes].filter((t) => !connectedTypes.has(t)).length;

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading integrations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <Globe className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold">Connect Your Tools</h2>
        <p className="text-muted-foreground">
          Optionally connect external services to enhance your workflow. You can always add more later in Settings.
        </p>
      </div>

      {/* Connection Progress (when connecting) */}
      {isConnecting && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting {currentlyConnecting && INTEGRATIONS.find((i) => i.type === currentlyConnecting)?.name}...
                </span>
                <span className="text-muted-foreground">{connectionProgress}%</span>
              </div>
              <Progress value={connectionProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Categories */}
      <div className="space-y-4">
        {CATEGORY_ORDER.map((category) => {
          const categoryIntegrations = integrationsByCategory.get(category);
          if (!categoryIntegrations || categoryIntegrations.length === 0) return null;

          const categoryInfo = INTEGRATION_CATEGORIES[category];

          return (
            <Card key={category}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{categoryInfo.label}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoryIntegrations.map((config) => {
                    const isConnected = connectedTypes.has(config.type);
                    const isSelected = selectedTypes.has(config.type);

                    return (
                      <SelectableIntegrationCard
                        key={config.type}
                        config={config}
                        isSelected={isSelected}
                        isConnected={isConnected}
                        onToggle={() => toggleSelection(config.type)}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4">
        {showSkip && (
          <Button variant="ghost" onClick={handleSkip} disabled={isConnecting} className="w-full sm:w-auto">
            {skipText}
          </Button>
        )}

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {selectedCount > 0 && (
            <Badge variant="secondary" className="hidden sm:flex">
              {selectedCount} selected
              {notConnectedCount > 0 && ` (${notConnectedCount} to connect)`}
            </Badge>
          )}

          <Button
            onClick={handleConnect}
            disabled={selectedCount === 0 || isConnecting}
            className="w-full sm:w-auto gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : connectionProgress === 100 && selectedCount > 0 ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Continue
              </>
            ) : (
              <>
                {continueText}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
        <Sparkles className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          <strong>Tip:</strong> Connect Notion or Google Drive now to automatically export your validation reports and
          canvases as you work.
        </p>
      </div>
    </div>
  );
}
