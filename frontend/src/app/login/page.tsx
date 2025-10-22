/**
 * Login Page (App Router)
 * 
 * Accessible authentication page with GitHub OAuth and email/password.
 * Uses Server Actions for authentication.
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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Login Form */}
      <div className="flex flex-col p-8 lg:p-12">
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild>
            <Link href="https://startupai-site.netlify.app">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to home
            </Link>
          </Button>
        </div>
        
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-md">
            {params.provider === 'github' && (
              <AutoOAuthTrigger provider="github" next={params.next} />
            )}
            <LoginForm />
          </div>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex bg-gradient-to-br from-primary/10 via-primary/5 to-background">
        <div className="flex flex-col justify-center p-12">
          <div className="space-y-8 max-w-lg">
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                Evidence-Led Strategy
              </h1>
              <p className="text-xl text-muted-foreground">
                Transform your startup validation with AI-powered evidence collection and analysis.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Collect Evidence</h3>
                  <p className="text-sm text-muted-foreground">
                    Gather and organize market research, customer interviews, and competitive analysis
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">AI Analysis</h3>
                  <p className="text-sm text-muted-foreground">
                    Semantic search and AI-powered insights from your evidence base
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold">Generate Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    AI-generated strategy documents backed by your evidence
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
