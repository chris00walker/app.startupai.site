import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ClientOnboardingWizard } from '@/components/onboarding/ClientOnboardingWizard';

/**
 * Client Onboarding Page - Alex in Client Mode
 *
 * Allows consultants to onboard their clients using Alex with
 * client-specific prompts ("your client's business" framing).
 *
 * The data collected here will be associated with the client's project,
 * not the consultant's profile.
 *
 * @see Plan: /home/chris/.claude/plans/precious-kindling-balloon.md
 */

export const metadata = {
  title: 'Add Client | StartupAI',
  description: 'Onboard a new client for strategic business validation',
};

export default async function ClientOnboardingPage() {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?returnUrl=/consultant/client/new');
  }

  // Check if user has consultant role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  // Only consultants can add clients
  if (profile?.role !== 'consultant') {
    redirect('/founder-dashboard');
  }

  // Note: clientProjectId will be created after onboarding completes
  // For now, we pass undefined and the system will create the project
  // when the consultant approves the summary

  return (
    <ClientOnboardingWizard
      userId={user.id}
      userEmail={profile?.email || user.email || ''}
      // clientProjectId will be assigned after SummaryModal approval
    />
  );
}
