import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Onboarding Page - Redirects to Role-Specific Path
// ============================================================================

export const metadata = {
  title: 'Start Validating | StartupAI',
  description: 'Start validating your business idea with AI-powered analysis.',
};

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?returnUrl=/onboarding');
  }

  // Get user role to determine redirect
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  // Redirect based on role
  if (profile?.role === 'consultant') {
    redirect('/consultant/client/new');
  }

  // Default to founder onboarding (Quick Start)
  redirect('/onboarding/founder');
}
