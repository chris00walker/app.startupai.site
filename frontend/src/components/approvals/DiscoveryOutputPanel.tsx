/**
 * DiscoveryOutputPanel Component
 *
 * Displays VPC Discovery output for the approve_discovery_output checkpoint.
 * Shows fit score gauge, customer profile summary, and value map summary.
 *
 * @story US-AH04, US-F10
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Users, Package, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface CustomerProfileSummary {
  segment?: string;
  jobs_count?: number;
  pains_count?: number;
  gains_count?: number;
}

interface ValueMapSummary {
  products_count?: number;
  pain_relievers_count?: number;
  gain_creators_count?: number;
}

interface DiscoveryOutputPanelProps {
  context: Record<string, unknown>;
}

function getFitScoreColor(score: number): { text: string; bg: string; border: string } {
  if (score >= 70) return { text: 'text-green-700', bg: 'bg-green-100', border: 'border-green-300' };
  if (score >= 40) return { text: 'text-yellow-700', bg: 'bg-yellow-100', border: 'border-yellow-300' };
  return { text: 'text-red-700', bg: 'bg-red-100', border: 'border-red-300' };
}

function getFitScoreLabel(score: number): string {
  if (score >= 70) return 'Strong Fit';
  if (score >= 40) return 'Moderate Fit';
  return 'Weak Fit';
}

export function DiscoveryOutputPanel({ context }: DiscoveryOutputPanelProps) {
  const fitScore = (context.fit_score as number) ?? 0;
  const gateReady = context.gate_ready as boolean;
  const gateBlockers = (context.gate_blockers as string[]) ?? [];
  const wasPivot = context.was_pivot as boolean;
  const pivotDetails = context.pivot_details as Record<string, unknown> | undefined;
  const customerProfile = (context.customer_profile_summary as CustomerProfileSummary) ?? {};
  const valueMap = (context.value_map_summary as ValueMapSummary) ?? {};

  const scoreColor = getFitScoreColor(fitScore);

  return (
    <div className="space-y-4">
      {/* Fit Score */}
      <Card className={cn('border-2', scoreColor.border)}>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">VPC Fit Score</p>
              <div className="flex items-center gap-3 mt-1">
                <span className={cn('text-3xl font-bold', scoreColor.text)}>
                  {fitScore}
                </span>
                <span className="text-lg text-muted-foreground">/100</span>
                <Badge variant="outline" className={cn(scoreColor.bg, scoreColor.text)}>
                  {getFitScoreLabel(fitScore)}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              {gateReady ? (
                <div className="flex items-center gap-1.5 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Ready to proceed</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-amber-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="text-sm font-medium">Below threshold</span>
                </div>
              )}
            </div>
          </div>
          {/* Fit score bar */}
          <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
            <div
              className={cn('h-2 rounded-full transition-all', {
                'bg-green-500': fitScore >= 70,
                'bg-yellow-500': fitScore >= 40 && fitScore < 70,
                'bg-red-500': fitScore < 40,
              })}
              style={{ width: `${Math.min(fitScore, 100)}%` }}
            />
          </div>
          {gateBlockers.length > 0 && (
            <div className="mt-2 text-xs text-amber-700">
              {gateBlockers.map((blocker, i) => (
                <span key={i} className="block">{blocker}</span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Customer Profile Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Customer Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm font-medium mb-2">{customerProfile.segment || 'Unknown Segment'}</p>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-blue-50 p-2 dark:bg-blue-950/30">
                <p className="text-lg font-bold text-blue-700">{customerProfile.jobs_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">Jobs</p>
              </div>
              <div className="rounded-lg bg-red-50 p-2 dark:bg-red-950/30">
                <p className="text-lg font-bold text-red-700">{customerProfile.pains_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">Pains</p>
              </div>
              <div className="rounded-lg bg-green-50 p-2 dark:bg-green-950/30">
                <p className="text-lg font-bold text-green-700">{customerProfile.gains_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">Gains</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Value Map Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-purple-600" />
              Value Map
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-purple-50 p-2 dark:bg-purple-950/30">
                <p className="text-lg font-bold text-purple-700">{valueMap.products_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">Products</p>
              </div>
              <div className="rounded-lg bg-orange-50 p-2 dark:bg-orange-950/30">
                <p className="text-lg font-bold text-orange-700">{valueMap.pain_relievers_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">Pain Relievers</p>
              </div>
              <div className="rounded-lg bg-teal-50 p-2 dark:bg-teal-950/30">
                <p className="text-lg font-bold text-teal-700">{valueMap.gain_creators_count ?? 0}</p>
                <p className="text-xs text-muted-foreground">Gain Creators</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pivot Context */}
      {wasPivot && pivotDetails && (
        <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800">Segment Pivot Applied</p>
                {pivotDetails.target_segment != null && (
                  <p className="text-amber-700 mt-1">
                    {'New segment: '}
                    {typeof pivotDetails.target_segment === 'object'
                      ? String((pivotDetails.target_segment as Record<string, string>)?.segment_name ?? '')
                      : String(pivotDetails.target_segment)}
                  </p>
                )}
                {pivotDetails.failed_segment != null && (
                  <p className="text-amber-600 text-xs mt-0.5">
                    {'Previous: '}
                    {String(pivotDetails.failed_segment)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DiscoveryOutputPanel;
