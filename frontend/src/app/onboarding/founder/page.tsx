import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizardV2';
import { Skeleton } from '@/components/ui/skeleton';

// ============================================================================
// Founder Onboarding Page
// ============================================================================

export const metadata = {
  title: 'Founder Onboarding | StartupAI',
  description: 'Get personalized strategic guidance from our AI consultant to validate and develop your business idea.',
};

async function FounderOnboardingPage() {
  // Check authentication
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  // For development/testing: allow access without auth
  const isDevelopment = process.env.NODE_ENV === 'development';
  const allowTestAccess = isDevelopment && !user;

  if ((error || !user) && !allowTestAccess) {
    // Redirect to login with return URL
    redirect('/login?returnUrl=/onboarding/founder');
  }

  // Use mock user for testing if not authenticated
  const effectiveUser = user || {
    id: 'test-user-id',
    email: 'test@example.com',
  };

  // Get user profile to determine plan type (skip in test mode)
  let profile: { subscription_tier: any; role: any; } | null = null;
  if (user) {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('subscription_tier, role')
      .eq('id', user.id)
      .single();
    profile = profileData;
  }

  // Map subscription tier to plan type for onboarding API
  const planTypeMapping = {
    'free': 'trial',
    'trial': 'trial',
    'sprint': 'sprint',
    'founder': 'founder',
    'pro': 'founder',
    'enterprise': 'enterprise',
  };

  const planType = (planTypeMapping[profile?.subscription_tier as keyof typeof planTypeMapping] || 'trial') as 'trial' | 'sprint' | 'founder' | 'enterprise';

  return (
    <main className="min-h-screen bg-background">
      {/* Development notice */}
      {allowTestAccess && (
        <div className="bg-yellow-100 border-b border-yellow-400 px-4 py-2 text-sm text-yellow-900">
          ⚠️ <strong>Test Mode:</strong> Running without authentication for development testing
        </div>
      )}

      {/* Skip navigation for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Main content with proper landmark */}
      <div id="main-content" role="main" aria-label="Founder onboarding conversation">
        <Suspense fallback={<OnboardingLoadingSkeleton />}>
          <OnboardingWizard
            userId={effectiveUser.id as string}
            planType={planType}
            userEmail={effectiveUser.email || 'test@example.com'}
          />
        </Suspense>
      </div>
    </main>
  );
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function OnboardingLoadingSkeleton() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="w-80 border-r bg-muted/10 p-6">
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6, 7].map((stage) => (
              <div key={stage} className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="border-b p-6">
          <Skeleton className="h-6 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Conversation area skeleton */}
        <div className="flex-1 p-6 space-y-4">
          <div className="space-y-3">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-12 w-1/2 ml-auto" />
            <Skeleton className="h-20 w-4/5" />
          </div>
        </div>

        {/* Input area skeleton */}
        <div className="border-t p-6">
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

export default FounderOnboardingPage;
