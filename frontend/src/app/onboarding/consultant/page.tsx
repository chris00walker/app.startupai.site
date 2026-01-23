import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Consultant Onboarding Page (ADR-006)
 * @story US-C01
 *
 * Per ADR-006, the Maya AI conversation has been removed.
 * Consultants are now redirected to their dashboard immediately.
 * Practice profile configuration is available via Settings.
 *
 * Future: Add simple profile form for practice setup.
 */

export const metadata = {
  title: 'Consultant Setup | StartupAI',
  description: 'Set up your consultant workspace',
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
    .select('role')
    .eq('id', user.id)
    .single();

  // If not a consultant, redirect to appropriate onboarding
  if (profile?.role === 'founder') {
    redirect('/onboarding/founder');
  }

  // Per ADR-006: Skip conversational onboarding, go directly to dashboard
  // Consultants can start adding clients immediately
  redirect('/consultant-dashboard');
}
