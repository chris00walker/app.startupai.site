/**
 * ApprovalDetailModal Component
 *
 * Full decision modal with context, options, and feedback form.
 *
 * @story US-AH01, US-H01, US-H02, US-H04, US-H05, US-H06, US-H07, US-H08, US-H09
 */

'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
} from 'lucide-react';
import { FounderAvatarWithLabel } from './FounderAvatar';
import { ApprovalTypeIndicator } from './ApprovalTypeIndicator';
import { EvidenceSummary } from './EvidenceSummary';
import { FoundersBriefPanel } from './FoundersBriefPanel';
import type { ApprovalRequest, ApprovalOption, OwnerRole, ApprovalType, ModalFoundersBrief } from '@/types/crewai';
import {
  getApprovalRenderVariant,
  isHitlCheckpointId,
  isFoundersBriefCheckpoint,
} from '@/lib/approvals/checkpoint-contract';
import { trackEvent } from '@/lib/analytics/index';
import { toast } from 'sonner';

interface ApprovalDetailModalProps {
  approval: ApprovalRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (id: string, decision?: string, feedback?: string) => Promise<boolean>;
  onReject: (id: string, feedback?: string, decision?: string) => Promise<boolean>;
}

function formatTimeRemaining(expiresAt: string): { text: string; isUrgent: boolean } {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diff = expires.getTime() - now.getTime();

  if (diff < 0) return { text: 'Expired', isUrgent: true };

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;

  if (days > 0) {
    return { text: `${days}d ${remainingHours}h remaining`, isUrgent: days < 1 };
  }
  if (hours > 0) {
    return { text: `${hours}h remaining`, isUrgent: hours < 24 };
  }
  const minutes = Math.floor(diff / (1000 * 60));
  return { text: `${minutes}m remaining`, isUrgent: true };
}

function RiskLevelBadge({ level }: { level?: 'low' | 'medium' | 'high' }) {
  if (!level) return null;

  const config = {
    low: { bg: 'bg-green-100', text: 'text-green-700', label: 'Low Risk' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Medium Risk' },
    high: { bg: 'bg-red-100', text: 'text-red-700', label: 'High Risk' },
  };

  const { bg, text, label } = config[level];

  return (
    <Badge variant="outline" className={cn(bg, text, 'text-xs')}>
      {label}
    </Badge>
  );
}

export function ApprovalDetailModal({
  approval,
  open,
  onOpenChange,
  onApprove,
  onReject,
}: ApprovalDetailModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (!approval) return;
    if (isHitlCheckpointId(approval.task_id)) return;

    trackEvent('approval_checkpoint_unsupported', {
      approvalId: approval.id,
      taskId: approval.task_id,
      approvalType: approval.approval_type,
    });
  }, [approval]);

  if (!approval) return null;

  const timeRemaining = formatTimeRemaining(approval.expires_at);
  const hasOptions = approval.options && approval.options.length > 0;
  const recommendedOption = approval.options?.find((opt) => opt.recommended);

  const renderVariant = getApprovalRenderVariant(approval.task_id);
  const isBriefApproval = renderVariant === 'founders_brief_panel';
  const isUnsupportedCheckpoint = !isHitlCheckpointId(approval.task_id);
  const briefData = isBriefApproval
    ? (approval.task_output?.founders_brief as ModalFoundersBrief | undefined)
    : undefined;

  const handleApprove = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const success = await onApprove(
        approval.id,
        selectedOption || undefined,
        feedback || undefined
      );
      if (success) {
        onOpenChange(false);
        toast.success('Brief approved — validation will resume');
        resetForm();
      } else {
        setSubmitError('Failed to approve. Please try again.');
      }
    } catch (err) {
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    // Require feedback for brief checkpoints
    if (isFoundersBriefCheckpoint(approval.task_id) && !feedback.trim()) {
      setSubmitError('Feedback is required when rejecting. Please explain what needs to change.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const success = await onReject(approval.id, feedback || undefined, 'rejected');
      if (success) {
        onOpenChange(false);
        toast.success('Brief rejected — feedback submitted');
        resetForm();
      } else {
        setSubmitError('Failed to reject. Please try again.');
      }
    } catch (err) {
      setSubmitError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedOption(null);
    setFeedback('');
    setSubmitError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]" data-testid="approval-modal">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl">{approval.title}</DialogTitle>
              <DialogDescription>
                {approval.project && (
                  <span className="text-sm">Project: {approval.project.name}</span>
                )}
              </DialogDescription>
            </div>
            <ApprovalTypeIndicator type={approval.approval_type as ApprovalType} />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Founder & Time */}
            <div className="flex items-center justify-between">
              <FounderAvatarWithLabel
                role={approval.owner_role as OwnerRole}
                size="md"
                showTitle
              />
              <div
                className={cn(
                  'flex items-center gap-1 text-sm',
                  timeRemaining.isUrgent ? 'text-red-600 font-medium' : 'text-muted-foreground'
                )}
              >
                {timeRemaining.isUrgent ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
                <span>{timeRemaining.text}</span>
              </div>
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-muted-foreground">{approval.description}</p>
            </div>

            {isUnsupportedCheckpoint && (
              <div
                data-testid="unsupported-checkpoint-warning"
                className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"
              >
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    Unsupported checkpoint contract: <code>{approval.task_id}</code>. Rendering generic fallback.
                  </div>
                </div>
              </div>
            )}

            {/* Original Input (for brief checkpoints) */}
            {isBriefApproval && Boolean(approval.task_output?.entrepreneur_input) && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Your original input:</p>
                <p className="mt-1 text-sm text-blue-800 dark:text-blue-200">{String(approval.task_output.entrepreneur_input)}</p>
                {Boolean(approval.task_output?.hints) && (
                  <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium">Hints provided:</p>
                    <ul className="mt-1 list-disc list-inside">
                      {Object.entries(approval.task_output.hints as Record<string, string>).map(([key, value]) => (
                        <li key={key}>{key.replace(/_/g, ' ')}: {String(value)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Founder's Brief (for brief approval checkpoints) */}
            {isBriefApproval && briefData && (
              <FoundersBriefPanel brief={briefData} />
            )}

            {/* Evidence Summary */}
            {approval.evidence_summary && Object.keys(approval.evidence_summary).length > 0 && (
              <EvidenceSummary evidenceSummary={approval.evidence_summary} />
            )}

            {/* Options Selection */}
            {hasOptions && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Decision Options</h4>
                <RadioGroup
                  value={selectedOption || ''}
                  onValueChange={setSelectedOption}
                  className="space-y-2"
                >
                  {approval.options?.map((option) => (
                    <div
                      key={option.id}
                      className={cn(
                        'flex items-start space-x-3 p-3 rounded-lg border transition-colors',
                        selectedOption === option.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                    >
                      <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                      <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.label}</span>
                          {option.recommended && (
                            <Badge variant="secondary" className="text-xs">
                              Recommended
                            </Badge>
                          )}
                          <RiskLevelBadge level={option.risk_level} />
                        </div>
                        {option.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {option.description}
                          </p>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            )}

            {/* Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback">
                Your Feedback {isBriefApproval ? '(required for rejection)' : '(optional)'}
              </Label>
              <Textarea
                id="feedback"
                placeholder="Add any notes or reasoning for your decision..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {submitError}
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || (isBriefApproval && !feedback.trim())}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ThumbsDown className="h-4 w-4" />
              )}
              Reject
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting || (hasOptions && !selectedOption)}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ThumbsUp className="h-4 w-4" />
              )}
              Approve
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ApprovalDetailModal;
