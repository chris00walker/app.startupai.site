/**
 * MarketplaceTab Component
 *
 * Settings tab for marketplace opt-in controls.
 * Shows different options for founders vs consultants.
 *
 * @story US-PH07, US-FM10
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { RELATIONSHIP_TYPES, type RelationshipType } from '@/components/consultant/InviteClientModal';

export interface MarketplaceTabProps {
  role: 'founder' | 'consultant';
  userId: string;
}

interface ConsultantSettings {
  directoryOptIn: boolean;
  defaultRelationshipType: RelationshipType | null;
  verificationStatus: 'unverified' | 'verified' | 'grace' | 'revoked';
  graceStartedAt: string | null;
}

interface FounderSettings {
  founderDirectoryOptIn: boolean;
  problemFit: string;
  qualifiesForDirectory: boolean;
}

const VERIFICATION_BADGES = {
  verified: { label: 'Verified', variant: 'default' as const, icon: CheckCircle, color: 'text-green-500' },
  grace: { label: 'Grace Period', variant: 'secondary' as const, icon: Clock, color: 'text-amber-500' },
  unverified: { label: 'Unverified', variant: 'outline' as const, icon: XCircle, color: 'text-muted-foreground' },
  revoked: { label: 'Revoked', variant: 'destructive' as const, icon: AlertTriangle, color: 'text-red-500' },
};

export function MarketplaceTab({ role, userId }: MarketplaceTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Consultant-specific state
  const [consultantSettings, setConsultantSettings] = useState<ConsultantSettings | null>(null);

  // Founder-specific state
  const [founderSettings, setFounderSettings] = useState<FounderSettings | null>(null);

  // Fetch settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const endpoint = role === 'consultant'
          ? '/api/consultant/profile/marketplace'
          : '/api/founder/profile/marketplace';

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error('Failed to load settings');
        }

        const data = await response.json();

        if (role === 'consultant') {
          setConsultantSettings(data);
        } else {
          setFounderSettings(data);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [role, userId]);

  // Save consultant settings
  const saveConsultantSettings = async (updates: Partial<ConsultantSettings>) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/consultant/profile/marketplace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save settings');
      }

      // Update local state
      setConsultantSettings((prev) => prev ? { ...prev, ...updates } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  // Save founder settings
  const saveFounderSettings = async (founderDirectoryOptIn: boolean) => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/founder/profile/marketplace', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ founderDirectoryOptIn }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save settings');
      }

      // Update local state
      setFounderSettings((prev) => prev ? { ...prev, founderDirectoryOptIn } : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  // Consultant Settings
  if (role === 'consultant' && consultantSettings) {
    const verificationInfo = VERIFICATION_BADGES[consultantSettings.verificationStatus];
    const VerificationIcon = verificationInfo.icon;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Verification Status</CardTitle>
            <CardDescription>
              Your verification status determines your marketplace access level.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <VerificationIcon className={`h-5 w-5 ${verificationInfo.color}`} />
              <div>
                <Badge variant={verificationInfo.variant}>
                  {verificationInfo.label}
                </Badge>
                {consultantSettings.verificationStatus === 'verified' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Full marketplace access
                  </p>
                )}
                {consultantSettings.verificationStatus === 'grace' && (
                  <p className="text-sm text-amber-600 mt-1">
                    Update payment to maintain access
                  </p>
                )}
                {consultantSettings.verificationStatus === 'unverified' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Upgrade to Advisor ($199/mo) or Capital ($499/mo) to access marketplace
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Directory Visibility</CardTitle>
            <CardDescription>
              Control whether founders can discover you in the Consultant Directory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="directory-opt-in">List me in the Consultant Directory</Label>
                <p className="text-sm text-muted-foreground">
                  When enabled, founders can discover you and request connections.
                </p>
              </div>
              <Switch
                id="directory-opt-in"
                checked={consultantSettings.directoryOptIn}
                onCheckedChange={(checked) => saveConsultantSettings({ directoryOptIn: checked })}
                disabled={isSaving || consultantSettings.verificationStatus === 'unverified'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="default-relationship">Default Relationship Type</Label>
              <Select
                value={consultantSettings.defaultRelationshipType || ''}
                onValueChange={(value: RelationshipType) =>
                  saveConsultantSettings({ defaultRelationshipType: value })
                }
                disabled={isSaving}
              >
                <SelectTrigger id="default-relationship">
                  <SelectValue placeholder="Select default type" />
                </SelectTrigger>
                <SelectContent>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Pre-selected when founders request connections with you.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Founder Settings
  if (role === 'founder' && founderSettings) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Directory Visibility</CardTitle>
            <CardDescription>
              Control whether verified consultants can discover you in the Founder Directory.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!founderSettings.qualifiesForDirectory ? (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Complete more validation to qualify for the Founder Directory.
                  You need at least partial problem-solution fit.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="founder-directory-opt-in">
                      List me in the Founder Directory
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      When enabled, verified consultants can discover you based on your validation progress.
                    </p>
                  </div>
                  <Switch
                    id="founder-directory-opt-in"
                    checked={founderSettings.founderDirectoryOptIn}
                    onCheckedChange={saveFounderSettings}
                    disabled={isSaving}
                  />
                </div>

                <div className="p-3 rounded-md bg-muted/50">
                  <p className="text-sm">
                    <span className="font-medium">Your fit status: </span>
                    <Badge variant="secondary" className="ml-1">
                      {founderSettings.problemFit === 'strong_fit'
                        ? 'Strong Fit'
                        : founderSettings.problemFit === 'partial_fit'
                          ? 'Partial Fit'
                          : 'No Fit'}
                    </Badge>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}

export default MarketplaceTab;
