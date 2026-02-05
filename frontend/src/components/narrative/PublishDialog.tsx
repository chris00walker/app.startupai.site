/**
 * Publish Dialog
 *
 * HITL review confirmation modal for publishing narratives.
 * Requires all 4 confirmations before allowing publish.
 *
 * @story US-NL01
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Loader2, Globe } from 'lucide-react';
import { PUBLICATION_COPY } from '@/lib/constants/narrative';

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPublish: (confirmation: {
    reviewed_slides: boolean;
    verified_traction: boolean;
    added_context: boolean;
    confirmed_ask: boolean;
  }) => Promise<void>;
  isPublishing?: boolean;
}

const HITL_ITEMS = [
  { key: 'reviewed_slides' as const, label: PUBLICATION_COPY.hitl_checklist.reviewed_slides },
  { key: 'verified_traction' as const, label: PUBLICATION_COPY.hitl_checklist.verified_traction },
  { key: 'added_context' as const, label: PUBLICATION_COPY.hitl_checklist.added_context },
  { key: 'confirmed_ask' as const, label: PUBLICATION_COPY.hitl_checklist.confirmed_ask },
];

export function PublishDialog({
  open,
  onOpenChange,
  onPublish,
  isPublishing,
}: PublishDialogProps) {
  const [confirmations, setConfirmations] = useState({
    reviewed_slides: false,
    verified_traction: false,
    added_context: false,
    confirmed_ask: false,
  });

  const allConfirmed = Object.values(confirmations).every(Boolean);

  const handleToggle = (key: keyof typeof confirmations) => {
    setConfirmations(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handlePublish = async () => {
    await onPublish(confirmations);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{PUBLICATION_COPY.publish_title}</DialogTitle>
          <DialogDescription>
            {PUBLICATION_COPY.publish_description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm font-medium">Please confirm:</p>
          {HITL_ITEMS.map(({ key, label }) => (
            <div key={key} className="flex items-start gap-3">
              <Checkbox
                id={key}
                checked={confirmations[key]}
                onCheckedChange={() => handleToggle(key)}
              />
              <Label htmlFor={key} className="text-sm cursor-pointer leading-relaxed">
                {label}
              </Label>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!allConfirmed || isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Globe className="h-4 w-4 mr-2" />
                Publish Narrative
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
