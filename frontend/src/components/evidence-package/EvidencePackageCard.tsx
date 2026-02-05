/**
 * Evidence Package Card
 *
 * Dashboard card showing evidence package sharing status and directory opt-in.
 *
 * @story US-NL01
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Eye, Share2, Lock } from 'lucide-react';

interface EvidencePackageCardProps {
  hasPackage: boolean;
  isPublic?: boolean;
  isPrimary?: boolean;
  founderConsent?: boolean;
  sharedCount?: number;
  onView?: () => void;
  onCreate?: () => void;
}

export function EvidencePackageCard({
  hasPackage,
  isPublic,
  isPrimary,
  founderConsent,
  sharedCount = 0,
  onView,
  onCreate,
}: EvidencePackageCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-indigo-600" />
            <CardTitle className="text-lg">Evidence Package</CardTitle>
          </div>
          {hasPackage && (
            <div className="flex gap-1">
              {isPrimary && (
                <Badge variant="secondary" className="text-xs">Primary</Badge>
              )}
              {isPublic ? (
                <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                  <Share2 className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  <Lock className="h-3 w-3 mr-1" />
                  Private
                </Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasPackage ? (
          <>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Shared with</p>
                <p className="font-medium">{sharedCount} portfolio holders</p>
              </div>
              <div>
                <p className="text-muted-foreground">Consent</p>
                <p className="font-medium">
                  {founderConsent ? 'Granted' : 'Not granted'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              View Package
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Create an evidence package to share your validation evidence with portfolio holders.
            </p>
            <Button variant="outline" size="sm" onClick={onCreate}>
              <Package className="h-3.5 w-3.5 mr-1.5" />
              Create Package
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
