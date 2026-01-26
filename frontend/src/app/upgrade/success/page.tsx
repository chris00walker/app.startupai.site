/**
 * Upgrade Success Page
 *
 * Displayed after successful Stripe checkout completion.
 * @story US-FT03
 */

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Rocket } from 'lucide-react';
import Link from 'next/link';

interface UpgradeSuccessPageProps {
  searchParams: Promise<{
    session_id?: string;
  }>;
}

export default async function UpgradeSuccessPage({ searchParams }: UpgradeSuccessPageProps) {
  const params = await searchParams;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get updated profile to show the correct plan
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, subscription_tier, full_name')
    .eq('id', user.id)
    .single();

  const planName = profile?.subscription_tier === 'consultant' ? 'Consultant' : 'Founder';
  const dashboardUrl = profile?.role === 'consultant' ? '/consultant-dashboard' : '/founder-dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Welcome to {planName}!</CardTitle>
          <CardDescription className="text-base">
            Your upgrade was successful. All premium features are now unlocked.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4 text-left">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              What&apos;s Unlocked
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Full 5-phase D-F-V validation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                AI-powered market testing
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Unlimited HITL approvals
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Export &amp; sharing capabilities
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                {planName === 'Consultant' ? 'Unlimited client projects' : '5 concurrent projects'}
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild size="lg">
              <Link href={`${dashboardUrl}?upgraded=true`}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/settings/billing">
                View Billing Details
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            A confirmation email has been sent to {user.email}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
