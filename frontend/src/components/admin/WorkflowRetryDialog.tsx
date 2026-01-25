'use client';

/**
 * Workflow Retry Dialog Component
 *
 * Confirmation dialog for retrying failed workflows with optional reason.
 *
 * @story US-A04
 */

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export interface FailedWorkflow {
  id: string;
  runId: string;
  userId: string;
  userEmail: string;
  projectId: string;
  projectName: string;
  runStatus: string;
  phase: number;
  crewName: string | null;
  errorMessage: string | null;
  failedAt: string;
  retryCount: number;
}

interface WorkflowRetryDialogProps {
  workflow: FailedWorkflow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRetrySuccess: () => void;
}

export function WorkflowRetryDialog({
  workflow,
  open,
  onOpenChange,
  onRetrySuccess,
}: WorkflowRetryDialogProps) {
  const [reason, setReason] = useState('');
  const [retrying, setRetrying] = useState(false);

  const handleRetry = async () => {
    if (!workflow) return;

    setRetrying(true);

    try {
      const response = await fetch(`/api/admin/workflows/${workflow.runId}/retry`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason || 'Admin retry',
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Workflow retry initiated');
        onOpenChange(false);
        setReason('');
        onRetrySuccess();
      } else {
        toast.error(data.error?.message || 'Failed to retry workflow');
      }
    } catch (error) {
      console.error('Retry error:', error);
      toast.error('Failed to retry workflow');
    } finally {
      setRetrying(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setReason('');
    }
    onOpenChange(isOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retry Workflow</AlertDialogTitle>
          <AlertDialogDescription>
            {workflow && (
              <>
                Retry the failed workflow for <strong>{workflow.projectName}</strong>{' '}
                (Phase {workflow.phase})?
                {workflow.errorMessage && (
                  <div className="mt-2 p-2 bg-muted rounded text-xs">
                    <strong>Error:</strong> {workflow.errorMessage}
                  </div>
                )}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <label className="text-sm font-medium mb-2 block">
            Reason (optional)
          </label>
          <Textarea
            placeholder="Why are you retrying this workflow?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={retrying}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRetry} disabled={retrying}>
            {retrying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Retry Workflow
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
