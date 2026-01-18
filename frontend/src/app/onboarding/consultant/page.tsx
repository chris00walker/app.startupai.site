import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConsultantOnboardingWizard } from '@/components/onboarding/ConsultantOnboardingWizard';

/**
 * Consultant Onboarding Page V2
 *
 * This page handles the conversational onboarding flow for consultants,
 * gathering practice information through AI-guided conversation and
 * configuring their workspace.
 *
 * Related to Phase 3: Consultant Features
 */

export const metadata = {
  title: 'Consultant Onboarding | StartupAI',
  description: 'Set up your consultant workspace and configure your practice',
};

export default async function ConsultantOnboardingPage() {
  const supabase = await createClient();

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login?returnUrl=/onboarding/consultant');
  }

  // Check if user has consultant role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, email')
    .eq('id', user.id)
    .single();

  // If not a consultant, redirect to appropriate onboarding
  if (profile?.role === 'founder') {
    redirect('/onboarding/founder');
  }

  // Note: We intentionally do NOT check onboarding_completed here.
  // This allows consultants to resume their onboarding session by clicking
  // "AI Assistant" from the dashboard, matching the founder experience.
  // The ConsultantOnboardingWizard component handles session resumption.

  return (
    <ConsultantOnboardingWizard
      userId={user.id}
      userEmail={profile?.email || user.email || ''}
    />
  );
}
