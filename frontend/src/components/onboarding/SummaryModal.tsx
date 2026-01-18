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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Loader2, CheckCircle2, HelpCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ONBOARDING_STAGES_CONFIG, type OnboardingStageConfig } from '@/lib/onboarding/stages-config';

// ============================================================================
// Types
// ============================================================================

export interface StageSummaryData {
  stage: number;
  stageName: string;
  data: Record<string, string | string[] | undefined>;
}

export interface SummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stageData: StageSummaryData[];
  onApprove: () => Promise<void>;
  onRevise: () => void;
  isSubmitting?: boolean;
  // Customization options for different flows (founder vs consultant)
  title?: string;
  description?: string;
  approveButtonText?: string;
  reviseButtonText?: string;
  stagesConfig?: readonly OnboardingStageConfig[];
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if a value represents uncertainty
 */
function isUncertain(value: string | string[] | undefined): boolean {
  if (!value) return true;
  if (typeof value === 'string') {
    const lowerValue = value.toLowerCase();
    return (
      lowerValue === 'uncertain' ||
      lowerValue === 'unknown' ||
      lowerValue.includes("don't know") ||
      lowerValue.includes("haven't thought") ||
      lowerValue.includes('not sure')
    );
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}

/**
 * Format a value for display
 */
function formatValue(value: string | string[] | undefined): string {
  if (!value) return 'Not provided';
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : 'None specified';
  }
  return value;
}

/**
 * Format a field key for display
 */
function formatFieldKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

// ============================================================================
// Data Item Component
// ============================================================================

interface DataItemProps {
  fieldKey: string;
  value: string | string[] | undefined;
}

function DataItem({ fieldKey, value }: DataItemProps) {
  const uncertain = isUncertain(value);

  return (
    <div className="flex items-start gap-3 py-2 border-b border-border/50 last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        {uncertain ? (
          <HelpCircle className="w-4 h-4 text-amber-500" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">
          {formatFieldKey(fieldKey)}
        </div>
        <div
          className={cn(
            'text-sm mt-0.5',
            uncertain ? 'text-amber-600 italic' : 'text-muted-foreground'
          )}
        >
          {uncertain ? 'To be validated' : formatValue(value)}
        </div>
      </div>
      {uncertain && (
        <Badge variant="outline" className="flex-shrink-0 text-amber-600 border-amber-300">
          Needs validation
        </Badge>
      )}
    </div>
  );
}

// ============================================================================
// Stage Section Component
// ============================================================================

interface StageSectionProps {
  stageData: StageSummaryData;
  stagesConfig: readonly OnboardingStageConfig[];
}

function StageSection({ stageData, stagesConfig }: StageSectionProps) {
  const stageConfig = stagesConfig.find(s => s.stage === stageData.stage);
  const dataFields = stageConfig?.dataToCollect ?? [];

  // Count certain vs uncertain items
  const certainCount = dataFields.filter(
    field => !isUncertain(stageData.data[field])
  ).length;
  const totalCount = dataFields.length;

  return (
    <AccordionItem value={`stage-${stageData.stage}`}>
      <AccordionTrigger className="hover:no-underline">
        <div className="flex items-center gap-3 w-full pr-4">
          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-medium">
            {stageData.stage}
          </span>
          <span className="flex-1 text-left font-medium">{stageData.stageName}</span>
          <span className="text-xs text-muted-foreground">
            {certainCount}/{totalCount} captured
          </span>
        </div>
      </AccordionTrigger>
      <AccordionContent>
        <div className="pl-9 pr-2">
          {dataFields.map(field => (
            <DataItem
              key={field}
              fieldKey={field}
              value={stageData.data[field]}
            />
          ))}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}

// ============================================================================
// Summary Modal Component
// ============================================================================

export function SummaryModal({
  isOpen,
  onClose,
  stageData,
  onApprove,
  onRevise,
  isSubmitting = false,
  title = 'Onboarding Complete',
  description = 'Review the information captured during your conversation with Alex. This will be used by our AI leadership team for strategic analysis.',
  approveButtonText = 'Approve & Continue',
  reviseButtonText = 'Revise with Alex',
  stagesConfig = ONBOARDING_STAGES_CONFIG,
}: SummaryModalProps) {
  const [isApproving, setIsApproving] = useState(false);

  // Calculate overall statistics
  const totalFields = stageData.reduce((sum, stage) => {
    const config = stagesConfig.find(s => s.stage === stage.stage);
    return sum + (config?.dataToCollect.length ?? 0);
  }, 0);

  const certainFields = stageData.reduce((sum, stage) => {
    const config = stagesConfig.find(s => s.stage === stage.stage);
    const fields = config?.dataToCollect ?? [];
    return sum + fields.filter(field => !isUncertain(stage.data[field])).length;
  }, 0);

  const uncertainFields = totalFields - certainFields;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove();
    } finally {
      setIsApproving(false);
    }
  };

  const handleRevise = () => {
    onRevise();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && !isApproving && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="flex gap-4 py-3 px-4 bg-muted/50 rounded-lg">
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-foreground">{stageData.length}</div>
            <div className="text-xs text-muted-foreground">Stages Completed</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-green-600">{certainFields}</div>
            <div className="text-xs text-muted-foreground">Data Points Captured</div>
          </div>
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-amber-600">{uncertainFields}</div>
            <div className="text-xs text-muted-foreground">To Be Validated</div>
          </div>
        </div>

        {/* Stage Breakdown */}
        <ScrollArea className="flex-1 min-h-0 mt-2">
          <Accordion type="multiple" defaultValue={['stage-1']} className="w-full">
            {stageData.map(stage => (
              <StageSection key={stage.stage} stageData={stage} stagesConfig={stagesConfig} />
            ))}
          </Accordion>
        </ScrollArea>

        {/* Info about uncertain items */}
        {uncertainFields > 0 && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-sm">
            <HelpCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-amber-800 dark:text-amber-200">
              <strong>{uncertainFields} items</strong> need validation. Our AI team will help
              you design experiments to answer these questions.
            </div>
          </div>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleRevise}
            disabled={isApproving || isSubmitting}
            className="w-full sm:w-auto"
          >
            {reviseButtonText}
          </Button>
          <Button
            onClick={handleApprove}
            disabled={isApproving || isSubmitting}
            className="w-full sm:w-auto"
          >
            {isApproving || isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                {approveButtonText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SummaryModal;
