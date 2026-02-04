/**
 * 404 Not Found Page (App Router)
 *
 * Centered error page with branded illustration and clear navigation back home.
 * Uses atmospheric design patterns consistent with the onboarding experience.
 *
 * @story US-UX01
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CompassIllustration } from '@/components/illustrations';
import { Home } from 'lucide-react';

export const metadata = {
  title: '404 - Page Not Found | StartupAI',
  description: 'The page you are looking for does not exist or has been moved.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative px-6 py-12">
      {/* Atmospheric background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-background to-accent/[0.02]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg">
        {/* Illustration */}
        <div className="mb-8 reveal-1">
          <CompassIllustration size="lg" />
        </div>

        {/* Heading */}
        <h1 className="text-4xl font-bold text-foreground mb-4 reveal-2 font-display">
          404 - Page Not Found
        </h1>

        {/* Body text */}
        <p className="text-lg text-muted-foreground mb-8 reveal-3 leading-relaxed">
          Looks like you&apos;ve lost your way. The page you&apos;re looking for
          doesn&apos;t exist or has been moved.
        </p>

        {/* Back to Home button */}
        <div className="reveal-4">
          <Button asChild size="lg" className="gap-2">
            <Link href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
