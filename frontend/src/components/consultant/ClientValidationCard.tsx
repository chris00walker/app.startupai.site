/**
 * ClientValidationCard Component
 *
 * Displays validation progress for a consultant's client.
 * Shows current phase, gate status, evidence metrics, and AI recommendations.
 */

'use client';

import * as React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Target,
  CheckCircle,
  AlertTriangle,
  Clock,
  FileText,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import type { ClientValidationProgress } from '@/hooks/useClientValidationProgress';

interface ClientValidationCardProps {
  client: ClientValidationProgress;
  onViewDetails?: (clientId: string) => void;
}

// Phase progress percentage
const PHASE_PROGRESS: Record<string, number> = {
  IDEATION: 10,
  DESIRABILITY: 35,
  FEASIBILITY: 60,
  VIABILITY: 85,
  VALIDATED: 100,
};

// Phase colors
const PHASE_COLORS: Record<string, string> = {
  IDEATION: 'bg-gray-500',
  DESIRABILITY: 'bg-blue-500',
  FEASIBILITY: 'bg-purple-500',
  VIABILITY: 'bg-orange-500',
  VALIDATED: 'bg-green-500',
};

// Gate status badges
const GATE_STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Passed: 'default',
  Pending: 'secondary',
  Failed: 'destructive',
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export function ClientValidationCard({ client, onViewDetails }: ClientValidationCardProps) {
  const phase = client.currentPhase || 'IDEATION';
  const progress = PHASE_PROGRESS[phase] || 0;
  const phaseColor = PHASE_COLORS[phase] || 'bg-gray-500';

  // Determine recommendation icon
  const RecommendationIcon = React.useMemo(() => {
    if (!client.pivotRecommendation) return Minus;
    if (client.pivotRecommendation.toLowerCase().includes('proceed')) return TrendingUp;
    if (client.pivotRecommendation.toLowerCase().includes('pivot')) return TrendingDown;
    if (client.pivotRecommendation.toLowerCase().includes('kill')) return AlertTriangle;
    return Minus;
  }, [client.pivotRecommendation]);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-muted rounded-lg">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-lg">{client.clientName}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {client.company && <span>{client.company}</span>}
                <span className="text-xs">({client.clientEmail})</span>
              </CardDescription>
            </div>
          </div>
          <Badge variant={GATE_STATUS_VARIANT[client.gateStatus || 'Pending'] || 'secondary'}>
            {client.gateStatus || 'No Project'}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Validation Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Validation Progress</span>
            <span className="font-medium">{phase}</span>
          </div>
          <div className="relative">
            <Progress value={progress} className="h-2" />
            <div
              className={`absolute top-0 left-0 h-2 rounded-full ${phaseColor}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-3 gap-4 py-2">
          <div className="text-center">
            <div className="text-2xl font-bold">{client.evidenceCount}</div>
            <div className="text-xs text-muted-foreground">Evidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(client.evidenceQuality * 100)}%</div>
            <div className="text-xs text-muted-foreground">Quality</div>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              {client.hasReport ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <Clock className="h-6 w-6 text-yellow-500" />
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              {client.hasReport ? 'Report Ready' : 'In Progress'}
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        {client.hasReport && client.reportOutcome && (
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Target className="h-4 w-4" />
              AI Recommendation
            </div>
            <div className="flex items-center gap-2">
              <RecommendationIcon className="h-4 w-4" />
              <span className="text-sm">{client.reportOutcome}</span>
            </div>
            {client.pivotRecommendation && (
              <Badge variant="outline" className="text-xs">
                {client.pivotRecommendation}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            Last activity: {formatRelativeTime(client.lastActivity)}
          </span>
          <div className="flex gap-2">
            {client.hasReport && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/client/${client.clientId}/report`}>
                  <FileText className="h-4 w-4 mr-1" />
                  Report
                </Link>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails?.(client.clientId)}
            >
              Details
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Grid of client validation cards for consultant dashboard.
 */
interface ClientValidationGridProps {
  clients: ClientValidationProgress[];
  onViewDetails?: (clientId: string) => void;
}

export function ClientValidationGrid({ clients, onViewDetails }: ClientValidationGridProps) {
  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No clients yet</p>
        <p className="text-sm">Add your first client to start tracking their validation progress.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <ClientValidationCard
          key={client.clientId}
          client={client}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
}
