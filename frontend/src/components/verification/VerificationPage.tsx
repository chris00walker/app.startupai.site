/**
 * Verification Page Component
 *
 * Public page showing verification status of an exported narrative.
 * Displays integrity hash match, export date, and access request link.
 *
 * @story US-NL01
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle, Shield, ExternalLink } from 'lucide-react';
import { VERIFICATION_COPY } from '@/lib/constants/narrative';
import type { VerificationResponse } from '@/lib/narrative/types';

interface VerificationPageProps {
  data: VerificationResponse;
  isLoading?: boolean;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'verified':
      return <CheckCircle className="h-12 w-12 text-green-500" />;
    case 'outdated':
      return <AlertTriangle className="h-12 w-12 text-amber-500" />;
    case 'not_found':
      return <XCircle className="h-12 w-12 text-red-500" />;
    default:
      return <Shield className="h-12 w-12 text-muted-foreground" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'verified':
      return <Badge className="bg-green-100 text-green-800 text-sm px-3 py-1">Verified</Badge>;
    case 'outdated':
      return <Badge className="bg-amber-100 text-amber-800 text-sm px-3 py-1">Outdated</Badge>;
    case 'not_found':
      return <Badge variant="destructive" className="text-sm px-3 py-1">Not Found</Badge>;
    default:
      return <Badge variant="secondary" className="text-sm px-3 py-1">{status}</Badge>;
  }
}

export function VerificationPageContent({ data, isLoading }: VerificationPageProps) {
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <div className="h-12 w-12 rounded-full border-4 border-muted border-t-blue-600 animate-spin" />
            <p className="text-sm text-muted-foreground">Verifying evidence integrity...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusKey = data.status as keyof typeof VERIFICATION_COPY;
  const copy = VERIFICATION_COPY[statusKey];

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <StatusIcon status={data.status} />
          </div>
          <div className="space-y-2">
            <StatusBadge status={data.status} />
            <CardTitle className="text-xl">
              {copy?.title || data.status}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {copy?.description || 'Unable to verify this document.'}
            </p>
          </div>
        </CardHeader>

        {data.status !== 'not_found' && (
          <CardContent className="space-y-4">
            {/* Venture name */}
            {data.venture_name && (
              <div className="text-center">
                <p className="text-lg font-semibold">{data.venture_name}</p>
                {data.validation_stage_at_export && (
                  <Badge variant="outline" className="mt-1 text-xs">
                    {data.validation_stage_at_export} stage
                  </Badge>
                )}
              </div>
            )}

            {/* Details */}
            <div className="space-y-3 p-4 rounded-lg bg-muted">
              {data.exported_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Exported</span>
                  <span>{new Date(data.exported_at).toLocaleDateString()}</span>
                </div>
              )}
              {data.evidence_generated_at && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Evidence generated</span>
                  <span>{new Date(data.evidence_generated_at).toLocaleDateString()}</span>
                </div>
              )}
              {data.evidence_id && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Evidence ID</span>
                  <code className="font-mono text-xs">{data.evidence_id}</code>
                </div>
              )}
              {data.is_edited !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Founder edited</span>
                  <span>{data.is_edited ? 'Yes' : 'No'}</span>
                </div>
              )}
              {data.alignment_status && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Guardian alignment</span>
                  <Badge variant="outline" className="text-xs">
                    {data.alignment_status}
                  </Badge>
                </div>
              )}
            </div>

            {/* Hash comparison */}
            {data.current_hash_matches !== undefined && !data.current_hash_matches && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 text-sm text-amber-800 dark:text-amber-300">
                The narrative has been updated since this export. The current version may differ from this PDF.
              </div>
            )}

            {/* Request access CTA */}
            {data.request_access_url && (
              <div className="pt-2 text-center">
                <Button asChild>
                  <a
                    href={data.request_access_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Request Full Access
                  </a>
                </Button>
              </div>
            )}

            {/* Branding */}
            <div className="text-center pt-4 border-t">
              <p className="text-xs text-muted-foreground">
                Verified by StartupAI &middot; Evidence-backed pitch narratives
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
