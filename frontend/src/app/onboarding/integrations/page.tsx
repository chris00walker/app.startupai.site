'use client';

/**
 * Integration Selection Page
 *
 * Optional step after Quick Start where users can connect external services.
 * Appears between Quick Start submission and project dashboard.
 *
 * @story US-BI04, US-BI05
 */

import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { IntegrationSelector } from '@/components/onboarding/IntegrationSelector';
import { Loader2 } from 'lucide-react';
import type { IntegrationType } from '@/types/integrations';

function IntegrationPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const projectId = searchParams?.get('project_id') ?? null;
  const returnTo = searchParams?.get('return_to') ?? '/founder-dashboard';

  const handleComplete = (selectedTypes: IntegrationType[]) => {
    // If user selected integrations, they've already been connected via OAuth
    // Navigate to the appropriate destination
    if (projectId) {
      router.push(`/project/${projectId}/analysis`);
    } else {
      router.push(returnTo);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <IntegrationSelector
          projectId={projectId || undefined}
          onComplete={handleComplete}
          showSkip={true}
          skipText="Skip for now"
          continueText="Connect Selected"
        />
      </div>
    </div>
  );
}

export default function IntegrationSelectionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <IntegrationPageContent />
    </Suspense>
  );
}
