/**
 * Validation Settings Page
 *
 * Allows users to configure gate policies for phase transitions.
 * Each gate can have customized evidence requirements and thresholds.
 *
 * @story US-AD10, US-ADB05, US-AFB03, US-AVB03
 */

'use client';

import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, AlertCircle, Info, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useGatePolicies } from '@/hooks/useGatePolicies';
import { GatePolicyCard, GatePolicyForm } from '@/components/settings/gate-policies';
import type { GatePolicyFormData } from '@/components/settings/gate-policies';
import type { GateType } from '@/db/schema/gate-policies';

const GATE_ORDER: GateType[] = ['DESIRABILITY', 'FEASIBILITY', 'VIABILITY'];

export default function ValidationSettingsPage() {
  const {
    policies,
    defaults,
    isLoading,
    error,
    updatePolicy,
    resetPolicy,
  } = useGatePolicies();

  const [editingGate, setEditingGate] = useState<GateType | null>(null);
  const [resettingGate, setResettingGate] = useState<GateType | null>(null);

  const handleEdit = (gate: GateType) => {
    setEditingGate(gate);
  };

  const handleReset = async (gate: GateType) => {
    setResettingGate(gate);
    try {
      const success = await resetPolicy(gate);
      if (success) {
        toast.success(`${gate} gate policy reset to defaults`);
      } else {
        toast.error('Failed to reset policy');
      }
    } finally {
      setResettingGate(null);
    }
  };

  const handleSave = async (data: GatePolicyFormData) => {
    if (!editingGate) return;

    const success = await updatePolicy(editingGate, data);
    if (success) {
      toast.success(`${editingGate} gate policy updated`);
      setEditingGate(null);
    } else {
      toast.error('Failed to update policy');
    }
  };

  // Get current policy and defaults for the editing gate
  const currentPolicy = editingGate && policies ? policies[editingGate] : null;
  const currentDefaults = editingGate && defaults ? defaults[editingGate] : null;

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Settings', href: '/settings' },
        { title: 'Validation Gates' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Validation Gates</h1>
            <p className="text-muted-foreground">
              Configure the criteria required to pass each validation phase
            </p>
          </div>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>About Gate Policies</AlertTitle>
          <AlertDescription>
            Gate policies determine when a project can progress from one validation phase to the next.
            Customize these thresholds based on your risk tolerance and industry requirements.
            Default values follow startup best practices.
          </AlertDescription>
        </Alert>

        {/* Loading State */}
        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load gate policies: {error.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Gate Policy Cards */}
        {policies && defaults && (
          <div className="space-y-4">
            {GATE_ORDER.map((gate) => {
              const policy = policies[gate];
              if (!policy) return null;

              return (
                <GatePolicyCard
                  key={gate}
                  gate={gate}
                  isCustom={policy.isCustom}
                  minExperiments={policy.minExperiments}
                  minWeakEvidence={policy.minWeakEvidence}
                  minMediumEvidence={policy.minMediumEvidence}
                  minStrongEvidence={policy.minStrongEvidence}
                  thresholds={policy.thresholds}
                  requiresApproval={policy.requiresApproval}
                  onEdit={() => handleEdit(gate)}
                  onReset={() => handleReset(gate)}
                  isResetting={resettingGate === gate}
                />
              );
            })}
          </div>
        )}

        {/* Help Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Understanding Gate Criteria
            </CardTitle>
            <CardDescription>
              Learn how each criterion affects your validation workflow
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium">Experiments</h4>
              <p className="text-muted-foreground">
                The minimum number of validation experiments (tests, surveys, campaigns) required
                before the gate can be considered for passage.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Evidence Mix</h4>
              <p className="text-muted-foreground">
                The required distribution of evidence strength: Weak (anecdotal), Medium (survey/interview),
                and Strong (behavioral/transactional).
              </p>
            </div>
            <div>
              <h4 className="font-medium">Thresholds</h4>
              <p className="text-muted-foreground">
                Quantitative metrics that must be met, such as fit scores, conversion rates, or
                financial ratios.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Human Approval</h4>
              <p className="text-muted-foreground">
                When enabled, even if all criteria are met, a human must explicitly approve
                gate passage. Recommended for high-stakes decisions.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Form Dialog */}
      {editingGate && currentPolicy && currentDefaults && (
        <GatePolicyForm
          open={editingGate !== null}
          onOpenChange={(open) => !open && setEditingGate(null)}
          gate={editingGate}
          initialData={{
            minExperiments: currentPolicy.minExperiments,
            minWeakEvidence: currentPolicy.minWeakEvidence,
            minMediumEvidence: currentPolicy.minMediumEvidence,
            minStrongEvidence: currentPolicy.minStrongEvidence,
            thresholds: currentPolicy.thresholds,
            requiresApproval: currentPolicy.requiresApproval,
          }}
          defaults={{
            minExperiments: currentDefaults.minExperiments,
            minWeakEvidence: currentDefaults.minWeakEvidence,
            minMediumEvidence: currentDefaults.minMediumEvidence,
            minStrongEvidence: currentDefaults.minStrongEvidence,
            thresholds: currentDefaults.thresholds,
            requiresApproval: currentDefaults.requiresApproval,
          }}
          onSave={handleSave}
        />
      )}
    </DashboardLayout>
  );
}
