/**
 * Upgrade Welcome Modal
 *
 * Shows a congratulations modal to users who just upgraded from trial.
 * Uses localStorage to track if the modal has been shown.
 *
 * @story US-FT04
 */

'use client';

import { useEffect, useState } from 'react';
import { useRoleInfo } from '@/lib/auth/hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, Rocket, Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'startupai_upgrade_welcomed';

interface UpgradeWelcomeModalProps {
  /** Force show the modal (for testing) */
  forceShow?: boolean;
}

export function UpgradeWelcomeModal({ forceShow = false }: UpgradeWelcomeModalProps) {
  const [open, setOpen] = useState(false);
  const { role, loading, isTrial, trialReadonly, userId } = useRoleInfo();

  useEffect(() => {
    if (loading || !userId) return;

    // Check if user just upgraded (is not trial anymore)
    const isPaidUser = (role === 'founder' || role === 'consultant') && !isTrial;

    if (!isPaidUser && !forceShow) return;

    // Check if we've already shown the welcome modal for this user
    const welcomedUsers = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');

    if (welcomedUsers[userId] && !forceShow) return;

    // Check if the user came from the upgrade success page (recently upgraded)
    const urlParams = new URLSearchParams(window.location.search);
    const isFromUpgrade = urlParams.get('upgraded') === 'true' || forceShow;

    // Also check referrer for upgrade success page
    const referrer = document.referrer;
    const isFromSuccessPage = referrer.includes('/upgrade/success');

    if (isFromUpgrade || isFromSuccessPage || forceShow) {
      setOpen(true);

      // Mark as welcomed
      welcomedUsers[userId] = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(welcomedUsers));

      // Fire confetti!
      setTimeout(() => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 300);
    }
  }, [loading, userId, role, isTrial, forceShow]);

  const planName = role === 'consultant' ? 'Consultant' : 'Founder';
  const dashboardUrl = role === 'consultant' ? '/consultant-dashboard' : '/founder-dashboard';

  const features = role === 'consultant' ? [
    'Unlimited client projects',
    'White-label AI workflows',
    'Full D-F-V validation for clients',
    'Team collaboration tools',
    'Priority support',
  ] : [
    'Full 5-phase D-F-V validation',
    'AI-powered market testing',
    'Unlimited HITL approvals',
    'Export & sharing capabilities',
    '5 concurrent projects',
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-primary/10">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Welcome to {planName}!
            <Sparkles className="h-5 w-5 text-amber-500" />
          </DialogTitle>
          <DialogDescription className="text-base">
            Your upgrade is complete. All premium features are now unlocked.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Rocket className="h-4 w-4" />
              What&apos;s Unlocked
            </h4>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild size="lg" className="w-full">
              <Link href={dashboardUrl} onClick={() => setOpen(false)}>
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-muted-foreground"
            >
              Continue where I left off
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
