/**
 * Client Onboarding Wizard (Quick Start - ADR-006)
 * @story US-C07
 *
 * Consultants use this to start a validation project on behalf of a client.
 * Uses the same Quick Start form but with client_id populated.
 *
 * The data collected here will be associated with the client's project,
 * not the consultant's profile.
 */
'use client';

import { useRouter } from 'next/navigation';
import { QuickStartForm } from './QuickStartForm';

interface ClientOnboardingWizardProps {
  consultantId: string;
  clientId: string;
  clientName?: string;
}

export function ClientOnboardingWizard({
  clientId,
  clientName,
}: ClientOnboardingWizardProps) {
  const router = useRouter();

  const handleSuccess = (projectId: string) => {
    // Redirect to consultant's client view
    router.push(`/consultant/clients/${clientId}/projects/${projectId}`);
  };

  return (
    <div className="space-y-6">
      {clientName && (
        <div className="text-center">
          <p className="text-muted-foreground">
            Starting validation for <span className="font-semibold text-foreground">{clientName}</span>
          </p>
        </div>
      )}
      <QuickStartForm
        clientId={clientId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}

export default ClientOnboardingWizard;
