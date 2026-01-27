/**
 * Founder Onboarding Page (Quick Start - ADR-006)
 *
 * Landing page for founder onboarding with Quick Start form.
 *
 * @story US-F01, US-FT01, US-E02
 */

import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { QuickStartForm } from '@/components/onboarding/QuickStartForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Start Validating | StartupAI',
  description: 'Describe your business idea and let our AI research the market, analyze competitors, and generate a structured brief.',
};

async function FounderOnboardingPage() {
  // Check authentication
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login?returnUrl=/onboarding/founder');
  }
  const marketingUrl =
    process.env.NEXT_PUBLIC_MARKETING_URL ??
    (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '/');

  // Check if user already has active projects
  const { data: existingProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1);

  // If user has projects, they might want the dashboard instead
  // But we still allow them to start a new project
  const hasExistingProjects = existingProjects && existingProjects.length > 0;

  return (
    <main className="min-h-screen flex flex-col relative bg-background">
      {/* Subtle branded background (consistent with login) */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-background to-accent/[0.02]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      {/* Skip navigation for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
      >
        Skip to main content
      </a>

      {/* Back link - goes to dashboard if user has projects, otherwise marketing site */}
      <div className="relative z-10 p-6 lg:p-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={hasExistingProjects ? '/dashboard' : marketingUrl}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {hasExistingProjects ? 'Back to Dashboard' : 'Back to home'}
          </Link>
        </Button>
      </div>

      <div
        id="main-content"
        role="main"
        aria-label="Start validation"
        className="relative z-10 container max-w-4xl mx-auto pb-12 px-4"
      >
        {/* Optional: Show link to dashboard if user has projects */}
        {hasExistingProjects && (
          <div className="text-center mb-8">
            <p className="text-muted-foreground">
              Already have projects?{' '}
              <a href="/dashboard" className="text-primary hover:underline">
                Go to Dashboard
              </a>
            </p>
          </div>
        )}

        <Suspense fallback={<QuickStartLoadingSkeleton />}>
          <QuickStartForm />
        </Suspense>
      </div>
    </main>
  );
}

// ============================================================================
// Loading Skeleton Component
// ============================================================================

function QuickStartLoadingSkeleton() {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="rounded-xl border bg-card p-6 space-y-6">
        {/* Header skeleton */}
        <div className="text-center space-y-4">
          <Skeleton className="h-12 w-12 rounded-full mx-auto" />
          <Skeleton className="h-8 w-64 mx-auto" />
          <Skeleton className="h-4 w-full max-w-md mx-auto" />
        </div>

        {/* Textarea skeleton */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-32 w-full" />
        </div>

        {/* Hints toggle skeleton */}
        <Skeleton className="h-10 w-full" />

        {/* Button skeleton */}
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

export default FounderOnboardingPage;
