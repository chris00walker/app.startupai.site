/**
 * Login Page (App Router)
 *
 * Minimal, distraction-free authentication page following competitor best practices
 * (Linear, Notion, Vercel, Figma). Single-column centered layout with GitHub OAuth
 * and email/password options.
 *
 * Supports auto-triggering OAuth via ?provider=github query parameter.
 */

import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { AutoOAuthTrigger } from '@/components/auth/AutoOAuthTrigger';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const metadata = {
  title: 'Login | StartupAI',
  description: 'Sign in to your StartupAI account',
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string; next?: string }>;
}) {
  // Await searchParams for Next.js 15 compatibility
  const params = await searchParams;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Subtle branded background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-background to-accent/[0.02]" />
      <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />

      {/* Back to home link */}
      <div className="relative z-10 p-6 lg:p-8">
        <Button variant="ghost" size="sm" asChild>
          <Link href={process.env.NEXT_PUBLIC_MARKETING_URL || "/"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to home
          </Link>
        </Button>
      </div>

      {/* Centered form */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-6 pb-16">
        <div className="w-full max-w-md">
          {params.provider === 'github' && (
            <AutoOAuthTrigger provider="github" next={params.next} />
          )}
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
