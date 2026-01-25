'use client';

/**
 * Integration Banner Component
 *
 * Displays a dismissible banner prompting users to connect integrations
 * if they skipped the integration selection during onboarding.
 *
 * @story US-BI04, US-BI05
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, Plug, ArrowRight } from 'lucide-react';
import { useIntegrations } from '@/hooks/useIntegrations';

interface IntegrationBannerProps {
  /** Storage key for dismissal persistence */
  storageKey?: string;
}

export function IntegrationBanner({
  storageKey = 'integration-banner-dismissed',
}: IntegrationBannerProps) {
  const router = useRouter();
  const { integrations, isLoading } = useIntegrations();
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to avoid flash

  useEffect(() => {
    // Check localStorage for dismissal state
    const dismissed = localStorage.getItem(storageKey);
    if (dismissed === 'true') {
      setIsDismissed(true);
    } else {
      setIsDismissed(false);
    }
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, 'true');
    setIsDismissed(true);
  };

  const handleConnect = () => {
    router.push('/settings?tab=integrations');
  };

  // Don't show if loading, dismissed, or user has active integrations
  if (isLoading || isDismissed) {
    return null;
  }

  // Check if user has any active integrations
  const hasActiveIntegrations = integrations?.some(
    (integration) => integration.status === 'active'
  );

  if (hasActiveIntegrations) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Plug className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium">Connect Your Tools</h4>
              <p className="text-sm text-muted-foreground">
                Sync with Notion, Google Drive, Slack, and more to enhance your workflow.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleConnect}
              className="hidden sm:flex gap-1"
            >
              Connect Integrations
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleConnect}
              className="sm:hidden"
            >
              Connect
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
