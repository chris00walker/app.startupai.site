'use client';

/**
 * Integrations Settings Tab
 *
 * Main component for managing external service integrations.
 * Displays all available integrations organized by category with OAuth connection flow.
 *
 * @story US-I01, US-I02, US-I03, US-I04, US-I05, US-I06
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useIntegrations } from '@/hooks/useIntegrations';
import {
  INTEGRATIONS,
  INTEGRATION_CATEGORIES,
  CATEGORY_ORDER,
  getIntegrationsByCategory,
} from '@/lib/integrations/config';
import { IntegrationCard } from './integrations/IntegrationCard';
import { IntegrationConfigModal } from './integrations/IntegrationConfigModal';
import type { IntegrationConfig, IntegrationType, UserIntegrationWithPreferences } from '@/types/integrations';

export function IntegrationsTab() {
  const {
    integrations,
    isLoading,
    error,
    connect,
    disconnect,
    updatePreferences,
    getIntegration,
  } = useIntegrations();

  const [connectingType, setConnectingType] = useState<IntegrationType | null>(null);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [configModalIntegration, setConfigModalIntegration] = useState<{
    config: IntegrationConfig;
    userIntegration: UserIntegrationWithPreferences;
  } | null>(null);

  // Listen for OAuth callback messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'oauth_callback') {
        setConnectingType(null);

        if (event.data.success) {
          const config = INTEGRATIONS.find((i) => i.type === event.data.integrationType);
          toast.success(`Connected to ${config?.name || event.data.integrationType}`);
        } else {
          toast.error(`Connection failed: ${event.data.error || 'Unknown error'}`);
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Check URL params for connection status (redirect fallback)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const urlError = urlParams.get('error');

    if (connected) {
      const config = INTEGRATIONS.find((i) => i.type === connected);
      toast.success(`Connected to ${config?.name || connected}`);

      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('connected');
      window.history.replaceState({}, '', newUrl.toString());
    }

    if (urlError) {
      toast.error(`Connection failed: ${urlError}`);

      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, []);

  const handleConnect = async (type: IntegrationType) => {
    setConnectingType(type);
    try {
      await connect(type);
      // Connection continues in popup, state cleared in message handler
    } catch (err) {
      setConnectingType(null);
      toast.error(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleDisconnect = async (type: IntegrationType) => {
    try {
      await disconnect(type);
      const config = INTEGRATIONS.find((i) => i.type === type);
      toast.success(`Disconnected from ${config?.name || type}`);
    } catch (err) {
      toast.error(`Failed to disconnect: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err; // Re-throw so card knows operation failed
    }
  };

  const handleOpenConfig = (config: IntegrationConfig) => {
    const userIntegration = getIntegration(config.type);
    if (userIntegration) {
      setConfigModalIntegration({ config, userIntegration });
      setConfigModalOpen(true);
    }
  };

  const handleSavePreferences = async (preferences: Record<string, unknown>) => {
    if (!configModalIntegration) return;

    try {
      await updatePreferences(configModalIntegration.config.type, preferences);
      toast.success('Preferences saved');
    } catch (err) {
      toast.error(`Failed to save: ${err instanceof Error ? err.message : 'Unknown error'}`);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center space-y-3">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading integrations...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <div className="text-center space-y-3">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto" />
            <p className="text-sm text-red-600">{error.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const integrationsByCategory = getIntegrationsByCategory();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Globe className="h-5 w-5" />
            <span>External Integrations</span>
          </CardTitle>
          <CardDescription>
            Connect StartupAI with your favorite tools to automate exports, notifications, and data sync.
            All connections use secure OAuth 2.0.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Integration Categories */}
      {CATEGORY_ORDER.map((category) => {
        const categoryIntegrations = integrationsByCategory.get(category);
        if (!categoryIntegrations || categoryIntegrations.length === 0) return null;

        const categoryInfo = INTEGRATION_CATEGORIES[category];

        return (
          <Card key={category}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{categoryInfo.label}</CardTitle>
              <CardDescription>{categoryInfo.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Responsive grid: 1 col mobile, 2 col tablet */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {categoryIntegrations.map((config) => {
                  const userIntegration = getIntegration(config.type);
                  return (
                    <IntegrationCard
                      key={config.type}
                      config={config}
                      integration={userIntegration}
                      onConnect={() => handleConnect(config.type)}
                      onDisconnect={() => handleDisconnect(config.type)}
                      onConfigure={() => handleOpenConfig(config)}
                      isConnecting={connectingType === config.type}
                    />
                  );
                })}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Configuration Modal */}
      {configModalIntegration && (
        <IntegrationConfigModal
          open={configModalOpen}
          onOpenChange={setConfigModalOpen}
          config={configModalIntegration.config}
          currentPreferences={configModalIntegration.userIntegration.preferences}
          onSave={handleSavePreferences}
        />
      )}
    </div>
  );
}
