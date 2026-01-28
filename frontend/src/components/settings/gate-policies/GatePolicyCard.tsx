'use client';

/**
 * Gate Policy Card Component
 *
 * Displays a single gate policy with its current configuration.
 * Allows users to view and edit policy settings.
 *
 * @story US-AD10, US-ADB05, US-AFB03, US-AVB03
 */

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw, CheckCircle, Target, FlaskConical } from 'lucide-react';
import type { GateType, GateThresholds } from '@/db/schema/gate-policies';

export interface GatePolicyCardProps {
  gate: GateType;
  isCustom: boolean;
  minExperiments: number;
  minWeakEvidence: number;
  minMediumEvidence: number;
  minStrongEvidence: number;
  thresholds: GateThresholds;
  requiresApproval: boolean;
  onEdit: () => void;
  onReset: () => void;
  isResetting?: boolean;
}

const GATE_INFO: Record<GateType, { title: string; description: string; icon: typeof CheckCircle }> = {
  DESIRABILITY: {
    title: 'Desirability Gate',
    description: 'Validates customer demand and problem-solution fit',
    icon: Target,
  },
  FEASIBILITY: {
    title: 'Feasibility Gate',
    description: 'Validates technical feasibility and cost constraints',
    icon: Settings,
  },
  VIABILITY: {
    title: 'Viability Gate',
    description: 'Validates unit economics and business model profitability',
    icon: FlaskConical,
  },
};

export function GatePolicyCard({
  gate,
  isCustom,
  minExperiments,
  minWeakEvidence,
  minMediumEvidence,
  minStrongEvidence,
  thresholds,
  requiresApproval,
  onEdit,
  onReset,
  isResetting = false,
}: GatePolicyCardProps) {
  const gateInfo = GATE_INFO[gate];
  const Icon = gateInfo.icon;

  // Format threshold values for display
  const formatThreshold = (key: string, value: number | undefined): string => {
    if (value === undefined) return '-';

    // Format based on threshold type
    if (key === 'fit_score') return `${value}%`;
    if (key === 'ctr' || key === 'signup_rate') return `${(value * 100).toFixed(1)}%`;
    if (key === 'ltv_cac_ratio') return `${value}x`;
    if (key.includes('cost')) return `$${value.toLocaleString()}`;
    return value.toString();
  };

  return (
    <Card className={isCustom ? 'border-primary/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{gateInfo.title}</CardTitle>
                {isCustom && (
                  <Badge variant="secondary" className="text-xs">
                    Custom
                  </Badge>
                )}
              </div>
              <CardDescription>{gateInfo.description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Settings className="h-4 w-4 mr-1" />
              Configure
            </Button>
            {isCustom && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                disabled={isResetting}
              >
                <RotateCcw className={`h-4 w-4 mr-1 ${isResetting ? 'animate-spin' : ''}`} />
                Reset
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {/* Experiments Required */}
          <div className="space-y-1">
            <p className="text-muted-foreground">Experiments</p>
            <p className="font-medium">{minExperiments} minimum</p>
          </div>

          {/* Evidence Requirements */}
          <div className="space-y-1">
            <p className="text-muted-foreground">Evidence Mix</p>
            <div className="flex items-center gap-1">
              <Badge variant="outline" className="text-xs">
                W:{minWeakEvidence}
              </Badge>
              <Badge variant="outline" className="text-xs">
                M:{minMediumEvidence}
              </Badge>
              <Badge variant="outline" className="text-xs">
                S:{minStrongEvidence}
              </Badge>
            </div>
          </div>

          {/* Key Thresholds */}
          <div className="space-y-1">
            <p className="text-muted-foreground">Thresholds</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(thresholds).map(([key, value]) => (
                <Badge key={key} variant="secondary" className="text-xs">
                  {key.replace(/_/g, ' ')}: {formatThreshold(key, value)}
                </Badge>
              ))}
            </div>
          </div>

          {/* Approval Required */}
          <div className="space-y-1">
            <p className="text-muted-foreground">Approval</p>
            <div className="flex items-center gap-1">
              <CheckCircle className={`h-4 w-4 ${requiresApproval ? 'text-green-500' : 'text-muted-foreground'}`} />
              <span className="font-medium">
                {requiresApproval ? 'Required' : 'Auto-approve'}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
