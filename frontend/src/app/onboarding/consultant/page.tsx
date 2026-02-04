/**
 * Consultant Onboarding Page (ADR-006 + TASK-030)
 * @story US-C01, US-PH01
 *
 * Per ADR-006, the Maya AI conversation has been removed.
 * TASK-030: Collect marketplace preferences before redirecting to dashboard.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, Shield, ArrowRight } from 'lucide-react';
import { trackMarketplaceEvent } from '@/lib/analytics';

const RELATIONSHIP_TYPES = [
  { value: 'advisory', label: 'Advisory', description: 'Mentorship and strategic guidance' },
  { value: 'capital', label: 'Capital', description: 'Investment and funding connections' },
  { value: 'program', label: 'Program', description: 'Accelerator or incubator programs' },
  { value: 'service', label: 'Service', description: 'Professional services (legal, accounting, etc.)' },
  { value: 'ecosystem', label: 'Ecosystem', description: 'Partner network and introductions' },
];

export default function ConsultantOnboardingPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Marketplace preferences
  const [directoryOptIn, setDirectoryOptIn] = useState(false);
  const [defaultRelationshipType, setDefaultRelationshipType] = useState('advisory');

  // Check authentication and role
  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login?returnUrl=/onboarding/consultant');
        return;
      }

      // Check if user has consultant role
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'founder') {
        router.push('/onboarding/founder');
        return;
      }

      setUserId(user.id);
      setIsLoading(false);
    }

    checkAuth();
  }, [router]);

  const handleSubmit = async () => {
    if (!userId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      // Update consultant_profiles with marketplace preferences
      const { error: updateError } = await supabase
        .from('consultant_profiles')
        .update({
          directory_opt_in: directoryOptIn,
          default_relationship_type: defaultRelationshipType,
        })
        .eq('id', userId);

      if (updateError) {
        // If profile doesn't exist, create it
        if (updateError.code === 'PGRST116') {
          const { error: insertError } = await supabase.from('consultant_profiles').insert({
            id: userId,
            directory_opt_in: directoryOptIn,
            default_relationship_type: defaultRelationshipType,
          });

          if (insertError) {
            throw insertError;
          }
        } else {
          throw updateError;
        }
      }

      // Track analytics (per marketplace-analytics.md spec)
      if (directoryOptIn && userId) {
        trackMarketplaceEvent.consultantOptInEnabled(userId, defaultRelationshipType || undefined);
      }

      // Redirect to dashboard
      router.push('/consultant-dashboard');
    } catch (err) {
      console.error('[consultant/onboarding] Error:', err);
      setError('Failed to save preferences. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    // Skip preferences and go directly to dashboard
    router.push('/consultant-dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to StartupAI</h1>
          <p className="text-muted-foreground">
            Set up your consultant profile to start connecting with founders.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Marketplace Preferences
            </CardTitle>
            <CardDescription>
              Configure how you appear in the consultant directory. You can change these later in Settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Directory Opt-In */}
            <div className="flex items-start justify-between gap-4 p-4 border rounded-lg">
              <div className="space-y-1">
                <Label htmlFor="directory-opt-in" className="text-base font-medium">
                  Appear in Consultant Directory
                </Label>
                <p className="text-sm text-muted-foreground">
                  Let founders discover and connect with you through the marketplace.
                </p>
              </div>
              <Switch
                id="directory-opt-in"
                checked={directoryOptIn}
                onCheckedChange={setDirectoryOptIn}
              />
            </div>

            {/* Default Relationship Type */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Default Relationship Type</Label>
              <p className="text-sm text-muted-foreground">
                The primary type of support you offer to startups.
              </p>
              <Select value={defaultRelationshipType} onValueChange={setDefaultRelationshipType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex flex-col">
                        <span>{type.label}</span>
                        <span className="text-xs text-muted-foreground">{type.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Verification Note */}
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
              <Shield className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium">Verification Required</p>
                <p className="text-sm text-muted-foreground">
                  To appear in the directory and connect with founders, you&apos;ll need to verify your consultant status by upgrading to an Advisor or Capital plan.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button variant="outline" onClick={handleSkip} disabled={isSubmitting}>
                Skip for Now
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} className="flex-1">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
