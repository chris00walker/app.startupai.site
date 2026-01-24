'use client';

/**
 * Integration Configuration Modal
 *
 * Dialog for editing per-integration preferences.
 *
 * @story US-I04
 */

import React, { useState, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import type { IntegrationConfig, PreferenceFieldConfig } from '@/types/integrations';

interface IntegrationConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: IntegrationConfig;
  currentPreferences: Record<string, unknown>;
  onSave: (preferences: Record<string, unknown>) => Promise<void>;
}

export function IntegrationConfigModal({
  open,
  onOpenChange,
  config,
  currentPreferences,
  onSave,
}: IntegrationConfigModalProps) {
  const [preferences, setPreferences] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize preferences when modal opens
  useEffect(() => {
    if (open) {
      const initial: Record<string, unknown> = {};
      for (const field of config.preferenceFields) {
        initial[field.key] = currentPreferences[field.key] ?? field.defaultValue ?? '';
      }
      setPreferences(initial);
    }
  }, [open, config.preferenceFields, currentPreferences]);

  const handleFieldChange = (key: string, value: unknown) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(preferences);
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (field: PreferenceFieldConfig) => {
    const value = preferences[field.key];

    switch (field.type) {
      case 'boolean':
        return (
          <div key={field.key} className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor={field.key}>{field.label}</Label>
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
            </div>
            <Switch
              id={field.key}
              checked={value === true}
              onCheckedChange={(checked) => handleFieldChange(field.key, checked)}
            />
          </div>
        );

      case 'text':
      default:
        return (
          <div key={field.key} className="space-y-2">
            <Label htmlFor={field.key}>{field.label}</Label>
            <Input
              id={field.key}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleFieldChange(field.key, e.target.value)}
              placeholder={field.placeholder}
            />
            {field.description && (
              <p className="text-sm text-muted-foreground">{field.description}</p>
            )}
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configure {config.name}</DialogTitle>
          <DialogDescription>
            Set your preferences for the {config.name} integration.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {config.preferenceFields.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No configuration options available for this integration.
            </p>
          ) : (
            config.preferenceFields.map(renderField)
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
