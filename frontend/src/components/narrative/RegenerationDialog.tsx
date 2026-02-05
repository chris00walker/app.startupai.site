/**
 * Regeneration Dialog
 *
 * Confirmation dialog with edit preservation options for regenerating narratives.
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
import { Label } from '@/components/ui/label';
import { Loader2, RefreshCw } from 'lucide-react';

interface RegenerationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegenerate: (preserveEdits: boolean) => Promise<void>;
  isRegenerating?: boolean;
  hasEdits?: boolean;
}

export function RegenerationDialog({
  open,
  onOpenChange,
  onRegenerate,
  isRegenerating,
  hasEdits,
}: RegenerationDialogProps) {
  const [preserveEdits, setPreserveEdits] = useState(true);

  const handleRegenerate = async () => {
    await onRegenerate(preserveEdits);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Regenerate Narrative</DialogTitle>
          <DialogDescription>
            This will regenerate your pitch narrative using the latest validation evidence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {hasEdits ? (
            <div className="space-y-3">
              <p className="text-sm">Your narrative has manual edits. How should they be handled?</p>

              <div className="space-y-2">
                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="radio"
                    checked={preserveEdits}
                    onChange={() => setPreserveEdits(true)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">Preserve my edits</p>
                    <p className="text-xs text-muted-foreground">
                      Your edits will be merged onto the new AI-generated content. Edited slides keep your changes.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="radio"
                    checked={!preserveEdits}
                    onChange={() => setPreserveEdits(false)}
                    className="mt-1"
                  />
                  <div>
                    <p className="text-sm font-medium">Start fresh</p>
                    <p className="text-xs text-muted-foreground">
                      All manual edits will be discarded. The narrative will be fully regenerated from evidence.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              The narrative will be regenerated from your latest validation evidence.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleRegenerate} disabled={isRegenerating}>
            {isRegenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
