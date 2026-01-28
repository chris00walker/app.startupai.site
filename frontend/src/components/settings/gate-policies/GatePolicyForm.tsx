'use client';

/**
 * Gate Policy Form Component
 *
 * Form for editing gate policy configuration.
 * Displayed in a dialog/sheet for inline editing.
 *
 * @story US-AD10, US-ADB05, US-AFB03, US-AVB03
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import type { GateType, GateThresholds } from '@/db/schema/gate-policies';

export interface GatePolicyFormData {
  minExperiments: number;
  minWeakEvidence: number;
  minMediumEvidence: number;
  minStrongEvidence: number;
  thresholds: GateThresholds;
  requiresApproval: boolean;
}

export interface GatePolicyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gate: GateType;
  initialData: GatePolicyFormData;
  defaults: GatePolicyFormData;
  onSave: (data: GatePolicyFormData) => Promise<void>;
}

const GATE_THRESHOLD_CONFIG: Record<GateType, { key: string; label: string; hint: string; format: 'percent' | 'ratio' | 'currency' }[]> = {
  DESIRABILITY: [
    { key: 'fit_score', label: 'Fit Score', hint: 'Minimum VPC fit score (0-100)', format: 'percent' },
    { key: 'ctr', label: 'Click-through Rate', hint: 'Minimum CTR (e.g., 0.02 = 2%)', format: 'percent' },
  ],
  FEASIBILITY: [
    { key: 'monthly_cost_max', label: 'Max Monthly Cost', hint: 'Maximum allowed monthly cost', format: 'currency' },
  ],
  VIABILITY: [
    { key: 'ltv_cac_ratio', label: 'LTV:CAC Ratio', hint: 'Minimum lifetime value to acquisition cost ratio', format: 'ratio' },
  ],
};

export function GatePolicyForm({
  open,
  onOpenChange,
  gate,
  initialData,
  defaults,
  onSave,
}: GatePolicyFormProps) {
  const [formData, setFormData] = useState<GatePolicyFormData>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  const thresholdConfig = GATE_THRESHOLD_CONFIG[gate];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(defaults);
  };

  const updateThreshold = (key: string, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setFormData((prev) => ({
        ...prev,
        thresholds: {
          ...prev.thresholds,
          [key]: numValue,
        },
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Configure {gate} Gate</DialogTitle>
          <DialogDescription>
            Customize the criteria required to pass this validation gate.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Experiment Requirements */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Experiment Requirements</h4>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minExperiments" className="text-right text-sm">
                  Min Experiments
                </Label>
                <Input
                  id="minExperiments"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.minExperiments}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minExperiments: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Evidence Requirements */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Evidence Requirements</h4>
            <div className="grid gap-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minWeakEvidence" className="text-right text-sm">
                  Weak Evidence
                </Label>
                <Input
                  id="minWeakEvidence"
                  type="number"
                  min={0}
                  max={10}
                  value={formData.minWeakEvidence}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minWeakEvidence: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minMediumEvidence" className="text-right text-sm">
                  Medium Evidence
                </Label>
                <Input
                  id="minMediumEvidence"
                  type="number"
                  min={0}
                  max={10}
                  value={formData.minMediumEvidence}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minMediumEvidence: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="minStrongEvidence" className="text-right text-sm">
                  Strong Evidence
                </Label>
                <Input
                  id="minStrongEvidence"
                  type="number"
                  min={0}
                  max={10}
                  value={formData.minStrongEvidence}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minStrongEvidence: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="col-span-3"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Thresholds */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Thresholds</h4>
            <div className="grid gap-4">
              {thresholdConfig.map(({ key, label, hint, format }) => (
                <div key={key} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={key} className="text-right text-sm">
                    {label}
                  </Label>
                  <div className="col-span-3 space-y-1">
                    <Input
                      id={key}
                      type="number"
                      step={format === 'percent' ? '0.01' : format === 'ratio' ? '0.1' : '100'}
                      value={formData.thresholds[key] ?? ''}
                      onChange={(e) => updateThreshold(key, e.target.value)}
                      placeholder={`Default: ${defaults.thresholds[key]}`}
                    />
                    <p className="text-xs text-muted-foreground">{hint}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Approval Settings */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Approval Settings</h4>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Require Human Approval</Label>
                <p className="text-xs text-muted-foreground">
                  When enabled, gate passage requires explicit approval
                </p>
              </div>
              <Switch
                checked={formData.requiresApproval}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({
                    ...prev,
                    requiresApproval: checked,
                  }))
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-between">
          <Button variant="ghost" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
