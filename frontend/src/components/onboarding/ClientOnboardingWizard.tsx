/**
 * Client Onboarding Wizard
 *
 * Alex guides consultants through client intake using client-specific prompts.
 * This is a thin wrapper that makes the mode explicit rather than hidden.
 *
 * When a Consultant onboards a Client:
 * - Alex references "your client" instead of "you"
 * - Uses same 7 stages as Founder journey
 * - Stores data to client project, not consultant
 *
 * @see Plan: /home/chris/.claude/plans/prancy-tickling-quokka.md
 */
'use client';

import { FounderOnboardingWizard } from './FounderOnboardingWizard';

interface ClientOnboardingWizardProps {
  userId: string;
  userEmail: string;
  clientProjectId?: string;
}

export function ClientOnboardingWizard({
  userId,
  userEmail,
  clientProjectId,
}: ClientOnboardingWizardProps) {
  return (
    <FounderOnboardingWizard
      userId={userId}
      planType="founder"
      userEmail={userEmail}
      mode="client"
      clientProjectId={clientProjectId}
    />
  );
}

export default ClientOnboardingWizard;
