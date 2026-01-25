'use client';

/**
 * Impersonation Banner
 *
 * Displays a fixed banner when admin is impersonating a user.
 * Shows target user info, remaining time, and exit button.
 *
 * @story US-A03
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, X, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImpersonation } from '@/hooks/useImpersonation';
import { formatDistanceToNow } from 'date-fns';

export function ImpersonationBanner() {
  const router = useRouter();
  const { isImpersonating, impersonatedUser, session, endImpersonation, isLoading } = useImpersonation();
  const [ending, setEnding] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update time remaining
  useEffect(() => {
    if (!session?.expiresAt) return;

    const updateTime = () => {
      const expiresAt = new Date(session.expiresAt);
      const now = new Date();
      if (expiresAt > now) {
        setTimeRemaining(formatDistanceToNow(expiresAt, { addSuffix: false }));
      } else {
        setTimeRemaining('Expired');
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [session?.expiresAt]);

  const handleEndImpersonation = async () => {
    setEnding(true);
    try {
      const success = await endImpersonation();
      if (success) {
        router.push('/admin/users');
      }
    } finally {
      setEnding(false);
    }
  };

  // Don't render if not impersonating or still loading
  if (isLoading || !isImpersonating || !impersonatedUser) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-950 px-4 py-2 shadow-md">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-medium">
            <Eye className="h-4 w-4" />
            <span>Viewing as:</span>
            <span className="font-bold">{impersonatedUser.email}</span>
          </div>

          <div className="hidden md:flex items-center gap-1 text-yellow-800 text-sm">
            <AlertTriangle className="h-3 w-3" />
            <span>Read-only mode</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {timeRemaining && (
            <div className="hidden sm:flex items-center gap-1 text-sm text-yellow-800">
              <Clock className="h-3 w-3" />
              <span>{timeRemaining} remaining</span>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleEndImpersonation}
            disabled={ending}
            className="bg-yellow-600 border-yellow-700 text-white hover:bg-yellow-700 hover:text-white"
          >
            <X className="h-4 w-4 mr-1" />
            {ending ? 'Ending...' : 'Exit'}
          </Button>
        </div>
      </div>
    </div>
  );
}
