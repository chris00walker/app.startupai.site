/**
 * useIntegrations Hook
 *
 * Hook for fetching and managing external service integrations.
 * Handles OAuth popup flow, preferences updates, and disconnection.
 *
 * @story US-I01, US-I02, US-I03, US-I04, US-I05, US-I06
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/lib/auth/hooks';
import type {
  IntegrationType,
  UserIntegration,
  UserIntegrationWithPreferences,
} from '@/types/integrations';

interface UseIntegrationsReturn {
  integrations: UserIntegrationWithPreferences[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  connect: (type: IntegrationType) => Promise<void>;
  disconnect: (type: IntegrationType) => Promise<void>;
  updatePreferences: (type: IntegrationType, preferences: Record<string, unknown>) => Promise<void>;
  getIntegration: (type: IntegrationType) => UserIntegrationWithPreferences | undefined;
  isConnected: (type: IntegrationType) => boolean;
}

interface OAuthMessage {
  type: 'oauth_callback';
  integrationType: string;
  success: boolean;
  error?: string;
}

export function useIntegrations(): UseIntegrationsReturn {
  const { user, loading: authLoading } = useAuth();
  const [integrations, setIntegrations] = useState<UserIntegrationWithPreferences[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Fetch all integrations for the current user
   */
  const fetchIntegrations = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setIntegrations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch('/api/integrations');

      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }

      const data = await response.json();
      setIntegrations(data.integrations || []);
      setError(null);
    } catch (err) {
      console.error('[useIntegrations] Error fetching:', err);
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  // Fetch on mount and when auth changes
  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  // Listen for OAuth callback messages from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate message structure
      if (
        typeof event.data !== 'object' ||
        event.data.type !== 'oauth_callback'
      ) {
        return;
      }

      const message = event.data as OAuthMessage;

      if (message.success) {
        // Refetch integrations after successful connection
        fetchIntegrations();
      } else {
        // Show error (handled by component)
        console.error('[useIntegrations] OAuth error:', message.error);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [fetchIntegrations]);

  // Check for URL params from redirect fallback
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const urlError = urlParams.get('error');

    if (connected) {
      // Refetch after redirect-based connection
      fetchIntegrations();

      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('connected');
      window.history.replaceState({}, '', newUrl.toString());
    }

    if (urlError) {
      setError(new Error(urlError));

      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [fetchIntegrations]);

  /**
   * Initiate OAuth connection via popup
   */
  const connect = useCallback(async (type: IntegrationType) => {
    const connectUrl = `/api/integrations/${type}/connect`;
    const popupName = `oauth_${type}`;
    const popupFeatures = 'width=600,height=700,left=100,top=100';

    // Try to open popup
    const popup = window.open(connectUrl, popupName, popupFeatures);

    // Check if popup was blocked
    if (!popup || popup.closed || typeof popup.closed === 'undefined') {
      // Fallback to redirect
      window.location.href = connectUrl;
    }
  }, []);

  /**
   * Disconnect an integration
   */
  const disconnect = useCallback(
    async (type: IntegrationType) => {
      const response = await fetch(`/api/integrations/${type}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to disconnect integration');
      }

      // Refetch to update state
      await fetchIntegrations();
    },
    [fetchIntegrations]
  );

  /**
   * Update integration preferences
   */
  const updatePreferences = useCallback(
    async (type: IntegrationType, preferences: Record<string, unknown>) => {
      const response = await fetch(`/api/integrations/${type}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update preferences');
      }

      // Refetch to update state
      await fetchIntegrations();
    },
    [fetchIntegrations]
  );

  /**
   * Get a specific integration by type
   */
  const getIntegration = useCallback(
    (type: IntegrationType) => {
      return integrations.find((i) => i.integrationType === type);
    },
    [integrations]
  );

  /**
   * Check if an integration is connected
   */
  const isConnected = useCallback(
    (type: IntegrationType) => {
      const integration = getIntegration(type);
      return integration?.status === 'active';
    },
    [getIntegration]
  );

  return {
    integrations,
    isLoading: isLoading || authLoading,
    error,
    refetch: fetchIntegrations,
    connect,
    disconnect,
    updatePreferences,
    getIntegration,
    isConnected,
  };
}
