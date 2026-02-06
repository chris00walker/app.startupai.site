'use client';

/**
 * Feature Flag Editor Component
 *
 * Dialog for editing feature flag settings with global toggle and percentage rollout.
 *
 * @story US-A06
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import type { FeatureFlag } from '@/lib/types/admin';
import { invalidateFeatureFlagCache } from '@/hooks/useFeatureFlag';

interface FeatureFlagEditorProps {
  flag: FeatureFlag | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function FeatureFlagEditor({
  flag,
  open,
  onOpenChange,
  onSave,
}: FeatureFlagEditorProps) {
  const isCreateMode = !flag;
  const [key, setKey] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  // Reset state when flag changes
  useEffect(() => {
    if (flag) {
      setEnabled(flag.enabledGlobally);
      setPercentage(flag.percentageRollout);
      setReason('');
      setKey('');
      setName('');
      setDescription('');
    } else {
      setEnabled(false);
      setPercentage(0);
      setReason('');
      setKey('');
      setName('');
      setDescription('');
    }
  }, [flag]);

  const handleSave = async () => {
    if (isCreateMode) {
      if (!key.trim() || !name.trim()) {
        toast.error('Key and name are required');
        return;
      }
    } else {
      if (!reason.trim()) {
        toast.error('Please provide a reason for this change');
        return;
      }
    }

    setSaving(true);

    try {
      const method = isCreateMode ? 'POST' : 'PATCH';
      const body = isCreateMode
        ? { key, name, description, enabledGlobally: enabled, percentageRollout: percentage }
        : { id: flag!.id, enabledGlobally: enabled, percentageRollout: percentage, reason };

      const response = await fetch('/api/admin/features', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(isCreateMode ? 'Feature flag created' : 'Feature flag updated');
        invalidateFeatureFlagCache();
        onOpenChange(false);
        onSave();
      } else {
        toast.error(data.error?.message || `Failed to ${isCreateMode ? 'create' : 'update'} flag`);
      }
    } catch (error) {
      console.error('Save error:', error);
      toast.error(`Failed to ${isCreateMode ? 'create' : 'update'} feature flag`);
    } finally {
      setSaving(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setReason('');
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isCreateMode ? 'Create Feature Flag' : 'Edit Feature Flag'}</DialogTitle>
          <DialogDescription>
            {flag ? (
              <span className="font-mono text-xs">{flag.key}</span>
            ) : (
              'Add a new feature flag for rollout control'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Create-mode fields */}
          {isCreateMode && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Flag Key <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. narrative_export_pdf"
                  value={key}
                  onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase with underscores only
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Display Name <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Narrative PDF Export"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="What does this flag control?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </>
          )}

          {/* Global Enable */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Enable Globally</label>
              <p className="text-xs text-muted-foreground">
                Enable for all users immediately
              </p>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {/* Percentage Rollout */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Percentage Rollout</label>
              <span className="text-sm font-mono">{percentage}%</span>
            </div>
            <Slider
              value={[percentage]}
              onValueChange={([value]) => setPercentage(value)}
              max={100}
              step={5}
              disabled={enabled}
            />
            <p className="text-xs text-muted-foreground">
              {enabled
                ? 'Disabled when globally enabled'
                : 'Gradually roll out to a percentage of users'}
            </p>
          </div>

          {/* Reason (edit mode only) */}
          {!isCreateMode && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Reason for change <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Explain why you're making this change..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || (isCreateMode ? !key.trim() || !name.trim() : !reason.trim())}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-2" />
            )}
            {isCreateMode ? 'Create Flag' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
