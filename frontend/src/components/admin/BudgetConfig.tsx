'use client';

/**
 * Budget Configuration Component
 *
 * Admin component for configuring how subscription fees map to ad budgets.
 * Manages allocation rules, per-campaign limits, and rollover policies.
 *
 * @story US-AM05
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save, DollarSign, Percent, Clock, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface BudgetAllocationConfig {
  allocationPercentage: number;
  perCampaignLimit: number;
  dailySpendLimit: number;
  rolloverEnabled: boolean;
  rolloverExpiresDays: number;
  minStatisticalSample: number;
  autoPauseOnBudgetExhaustion: boolean;
}

interface BudgetConfigProps {
  initialConfig?: Partial<BudgetAllocationConfig>;
  onSave?: (config: BudgetAllocationConfig) => void;
}

const DEFAULT_CONFIG: BudgetAllocationConfig = {
  allocationPercentage: 30, // 30% of subscription
  perCampaignLimit: 50, // $50 max per campaign
  dailySpendLimit: 25, // $25 daily max
  rolloverEnabled: true,
  rolloverExpiresDays: 90,
  minStatisticalSample: 100, // 100 impressions minimum
  autoPauseOnBudgetExhaustion: true,
};

export function BudgetConfig({ initialConfig, onSave }: BudgetConfigProps) {
  const [config, setConfig] = useState<BudgetAllocationConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHasChanges(true);
  }, [config]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/ad-platforms/budget-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      toast.success('Budget configuration saved');
      setHasChanges(false);
      onSave?.(config);
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const updateConfig = <K extends keyof BudgetAllocationConfig>(
    key: K,
    value: BudgetAllocationConfig[K]
  ) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  // Calculate example allocation for a $150/month subscription
  const exampleSubscription = 150;
  const exampleAdBudget = (exampleSubscription * config.allocationPercentage) / 100;

  return (
    <div className="space-y-6">
      {/* Allocation Percentage */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Subscription Allocation
          </CardTitle>
          <CardDescription>
            Percentage of subscription fee allocated to ad spend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Allocation Percentage</Label>
              <span className="text-sm font-medium">{config.allocationPercentage}%</span>
            </div>
            <Slider
              value={[config.allocationPercentage]}
              onValueChange={([value]) => updateConfig('allocationPercentage', value)}
              min={10}
              max={50}
              step={5}
            />
            <p className="text-xs text-muted-foreground">
              Example: ${exampleSubscription}/month subscription → ${exampleAdBudget.toFixed(2)} ad
              budget
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Spending Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Spending Limits
          </CardTitle>
          <CardDescription>
            Control maximum spend per campaign and daily limits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="perCampaignLimit">Per-Campaign Limit</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="perCampaignLimit"
                  type="number"
                  value={config.perCampaignLimit}
                  onChange={(e) => updateConfig('perCampaignLimit', Number(e.target.value))}
                  className="pl-9"
                  min={10}
                  max={200}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum budget for a single campaign
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailySpendLimit">Daily Spend Limit</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dailySpendLimit"
                  type="number"
                  value={config.dailySpendLimit}
                  onChange={(e) => updateConfig('dailySpendLimit', Number(e.target.value))}
                  className="pl-9"
                  min={5}
                  max={100}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Maximum spend across all campaigns per day
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="minStatisticalSample">Minimum Statistical Sample</Label>
            <Input
              id="minStatisticalSample"
              type="number"
              value={config.minStatisticalSample}
              onChange={(e) => updateConfig('minStatisticalSample', Number(e.target.value))}
              min={50}
              max={500}
            />
            <p className="text-xs text-muted-foreground">
              Minimum impressions before campaign results are considered statistically valid
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Rollover Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Rollover Policy
          </CardTitle>
          <CardDescription>
            Configure how unused budget carries over between cycles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Budget Rollover</Label>
              <p className="text-xs text-muted-foreground">
                Unused budget carries over to the next billing cycle
              </p>
            </div>
            <Switch
              checked={config.rolloverEnabled}
              onCheckedChange={(checked) => updateConfig('rolloverEnabled', checked)}
            />
          </div>

          {config.rolloverEnabled && (
            <div className="space-y-2">
              <Label htmlFor="rolloverExpiresDays">Rollover Expiration</Label>
              <Select
                value={String(config.rolloverExpiresDays)}
                onValueChange={(value) => updateConfig('rolloverExpiresDays', Number(value))}
              >
                <SelectTrigger id="rolloverExpiresDays">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Rolled-over budget expires after this period
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Safety Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Safety Controls
          </CardTitle>
          <CardDescription>
            Automatic safeguards to prevent overspending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Pause on Budget Exhaustion</Label>
              <p className="text-xs text-muted-foreground">
                Automatically pause campaigns when budget is depleted
              </p>
            </div>
            <Switch
              checked={config.autoPauseOnBudgetExhaustion}
              onCheckedChange={(checked) => updateConfig('autoPauseOnBudgetExhaustion', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      {/* Info Alert */}
      <Alert>
        <AlertDescription>
          Changes to budget configuration apply to new subscriptions and renewals. Existing
          allocations are not affected.
        </AlertDescription>
      </Alert>
    </div>
  );
}
