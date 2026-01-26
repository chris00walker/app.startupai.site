/**
 * Upgrade Cancel Page
 *
 * Displayed when user cancels Stripe checkout.
 * @story US-FT03
 */

import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function UpgradeCancelPage() {
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get profile to determine where to redirect
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const dashboardUrl = profile?.role === 'consultant' || profile?.role === 'consultant_trial'
    ? '/consultant-dashboard'
    : '/founder-dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <XCircle className="h-10 w-10 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">Upgrade Canceled</CardTitle>
          <CardDescription className="text-base">
            Your payment was not processed. You can try again anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
            <p>
              No worries! Your trial account is still active and your data is safe.
              When you&apos;re ready to unlock all features, you can upgrade from your dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button asChild variant="outline" size="lg">
              <Link href={dashboardUrl}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Link>
            </Button>
            <Button asChild size="lg">
              <Link href="/pricing">
                <RefreshCw className="mr-2 h-4 w-4" />
                View Pricing Plans
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Questions? Contact us at support@startupai.site
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
