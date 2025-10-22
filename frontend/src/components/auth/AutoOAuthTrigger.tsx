"use client"

/**
 * Auto OAuth Trigger Component
 * 
 * Automatically initiates OAuth flow when component mounts.
 * Used to handle cross-domain OAuth redirects from marketing site.
 * 
 * This solves the PKCE code verifier mismatch issue by ensuring
 * OAuth flow starts and completes on the same domain.
 */

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AutoOAuthTriggerProps {
  provider: 'github' | 'google';
  next?: string;
}

export function AutoOAuthTrigger({ provider, next = '/dashboard' }: AutoOAuthTriggerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isInitiating, setIsInitiating] = useState(true);

  useEffect(() => {
    const initiateOAuth = async () => {
      try {
        const supabase = createClient();
        const redirectUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

        console.log('Auto-initiating OAuth:', { provider, redirectUrl });

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: redirectUrl,
          },
        });

        if (error) {
          console.error('OAuth initiation error:', error);
          setError(error.message);
          setIsInitiating(false);
          return;
        }

        if (data.url) {
          // Redirect to OAuth provider
          console.log('Redirecting to OAuth provider:', data.url);
          window.location.href = data.url;
        } else {
          setError('No OAuth URL received from Supabase');
          setIsInitiating(false);
        }
      } catch (err) {
        console.error('OAuth trigger error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initiate OAuth');
        setIsInitiating(false);
      }
    };

    initiateOAuth();
  }, [provider, next]);

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          <strong>OAuth Error:</strong> {error}
          <br />
          <button 
            onClick={() => window.location.reload()} 
            className="underline mt-2"
          >
            Try again
          </button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="mb-6 p-6 border rounded-lg bg-muted/50">
      <div className="flex items-center justify-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-medium">Connecting to {provider === 'github' ? 'GitHub' : 'Google'}...</p>
          <p className="text-sm text-muted-foreground mt-1">
            You'll be redirected to authorize the application
          </p>
        </div>
      </div>
    </div>
  );
}
