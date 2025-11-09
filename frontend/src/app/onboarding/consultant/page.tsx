import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConsultantOnboardingWizard } from '@/components/onboarding/ConsultantOnboardingWizard';

/**
 * Consultant Onboarding Page
 *
 * This page handles the onboarding flow for consultants, gathering
 * practice information and configuring their workspace.
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

  // Check if consultant onboarding already completed
  const { data: consultantProfile } = await supabase
    .from('consultant_profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .single();

  if (consultantProfile?.onboarding_completed) {
    // Already completed onboarding, redirect to dashboard
    redirect('/dashboard');
  }

  return (
    <ConsultantOnboardingWizard
      userId={user.id}
      userEmail={profile?.email || user.email || ''}
    />
  );
}
