'use client';

/**
 * FoundersBriefReview Component
 *
 * Displays the Founder's Brief for HITL approval during the approve_brief checkpoint (Phase 1 Stage A).
 * Shows 6 sections per master-architecture specification:
 * 1. THE IDEA
 * 2. THE PROBLEM YOU'RE SOLVING
 * 3. WHO YOU'RE BUILDING FOR
 * 4. YOUR PROPOSED SOLUTION
 * 5. KEY ASSUMPTIONS WE'LL TEST
 * 6. YOUR SUCCESS CRITERIA
 *
 * Note: This component is also reused for approve_discovery_output checkpoint (Phase 1 Stage B)
 * to show the complete VPC discovery results.
 *
 * @story US-H01, US-F01
 */

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Lightbulb,
  AlertTriangle,
  Users,
  Target,
  ListChecks,
  Trophy,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

// EntrepreneurBrief type (matches database schema)
export interface EntrepreneurBrief {
  id: string;
  session_id: string;
  user_id: string;

  // Customer segments
  customer_segments: string[];
  primary_customer_segment: string | null;
  customer_segment_confidence: number;

  // Problem definition
  problem_description: string;
  problem_pain_level: number;
  problem_frequency: string;
  problem_impact: Record<string, unknown>;
  problem_evidence: string[];

  // Solution concept
  solution_description: string;
  solution_mechanism: string;
  unique_value_proposition: string;
  differentiation_factors: string[];
  solution_confidence: number;

  // Competitive landscape
  competitors: string[];
  competitive_alternatives: string[];
  switching_barriers: string[];
  competitive_advantages: string[];

  // Resources and constraints
  budget_range: string;
  budget_constraints: Record<string, unknown>;
  available_channels: string[];
  existing_assets: string[];
  team_capabilities: string[];
  time_constraints: Record<string, unknown>;

  // Business stage and goals
  business_stage: string;
  three_month_goals: string[];
  six_month_goals: string[];
  success_criteria: string[];
  key_metrics: string[];

  // Quality metrics
  completeness_score: number;
  clarity_score: number;
  consistency_score: number;
  overall_quality_score: number;

  // AI analysis metadata
  ai_confidence_scores: Record<string, number>;
  validation_flags: string[];
  recommended_next_steps: string[];

  created_at: string;
  updated_at: string;
}

interface FoundersBriefReviewProps {
  briefData: Partial<EntrepreneurBrief>;
  approvalId?: string;
  runId: string;
  onApprove: () => Promise<void>;
  onRequestChanges: (feedback: string) => Promise<void>;
  isApproving?: boolean;
}

export function FoundersBriefReview({
  briefData,
  approvalId,
  runId,
  onApprove,
  onRequestChanges,
  isApproving = false,
}: FoundersBriefReviewProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isSubmittingChanges, setIsSubmittingChanges] = useState(false);

  const handleRequestChanges = async () => {
    if (!feedback.trim()) return;
    setIsSubmittingChanges(true);
    try {
      await onRequestChanges(feedback);
    } finally {
      setIsSubmittingChanges(false);
      setShowFeedbackDialog(false);
    }
  };

  // Extract key assumptions from validation_flags and other data
  // Filter out undefined/empty values to avoid rendering "undefined..."
  const keyAssumptions = [
    ...(briefData.validation_flags || []),
    // Only include problem assumption if we have a description
    ...(briefData.problem_description
      ? [`Customers experience "${briefData.problem_description.slice(0, 50)}${briefData.problem_description.length > 50 ? '...' : ''}" frequently`]
      : []),
    // Only include segment assumption if we have a segment
    ...(briefData.primary_customer_segment
      ? [`"${briefData.primary_customer_segment}" will pay for this solution`]
      : []),
    // Map differentiation factors if available
    ...(briefData.differentiation_factors || [])
      .filter(f => f) // Filter out empty strings
      .map(f => `Our "${f}" is a real differentiator`),
  ]
    .filter(a => a && a.trim()) // Filter out empty/whitespace-only assumptions
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2 pb-4 border-b">
        <h2 className="text-2xl font-semibold">Your Founder's Brief</h2>
        <p className="text-muted-foreground">
          Please review this summary of your idea. We want to make sure we
          understood you correctly before we begin validation.
        </p>
      </div>

      {/* 6 Sections - Accordion */}
      <Accordion type="multiple" defaultValue={['the-idea', 'the-problem', 'who-for', 'solution', 'assumptions', 'success']} className="space-y-2">
        {/* Section 1: THE IDEA */}
        <AccordionItem value="the-idea" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">THE IDEA</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-3">
              {briefData.unique_value_proposition && (
                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
                    One-Liner
                  </p>
                  <p className="text-base">{briefData.unique_value_proposition}</p>
                </div>
              )}
              {briefData.solution_description && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Description</p>
                  <p className="text-sm">{briefData.solution_description}</p>
                </div>
              )}
              {briefData.business_stage && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Stage:</span>
                  <Badge variant="outline" className="capitalize">{briefData.business_stage}</Badge>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 2: THE PROBLEM */}
        <AccordionItem value="the-problem" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <span className="font-medium">THE PROBLEM YOU'RE SOLVING</span>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                HYPOTHESIS
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-3">
              <p className="text-sm">{briefData.problem_description || 'Problem description not captured'}</p>
              {briefData.problem_pain_level && (
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Pain Level: </span>
                    <Badge variant={briefData.problem_pain_level >= 7 ? 'destructive' : 'secondary'}>
                      {briefData.problem_pain_level}/10
                    </Badge>
                  </div>
                  {briefData.problem_frequency && (
                    <div>
                      <span className="text-sm text-muted-foreground">Frequency: </span>
                      <span className="text-sm capitalize">{briefData.problem_frequency}</span>
                    </div>
                  )}
                </div>
              )}
              {briefData.problem_evidence && briefData.problem_evidence.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Evidence</p>
                  <ul className="space-y-1">
                    {briefData.problem_evidence.slice(0, 3).map((evidence, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {evidence}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 3: WHO YOU'RE BUILDING FOR */}
        <AccordionItem value="who-for" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-purple-500" />
              <span className="font-medium">WHO YOU'RE BUILDING FOR</span>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                HYPOTHESIS
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-3">
              {briefData.primary_customer_segment && (
                <div className="bg-purple-50 dark:bg-purple-950 p-3 rounded-lg">
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
                    Primary Segment
                  </p>
                  <p className="text-base">{briefData.primary_customer_segment}</p>
                </div>
              )}
              {briefData.customer_segments && briefData.customer_segments.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">All Segments</p>
                  <div className="flex flex-wrap gap-2">
                    {briefData.customer_segments.map((segment, i) => (
                      <Badge
                        key={i}
                        variant={segment === briefData.primary_customer_segment ? 'default' : 'outline'}
                      >
                        {segment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {briefData.customer_segment_confidence && (
                <p className="text-xs text-muted-foreground">
                  Confidence: {briefData.customer_segment_confidence}%
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 4: YOUR PROPOSED SOLUTION */}
        <AccordionItem value="solution" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Target className="h-5 w-5 text-blue-500" />
              <span className="font-medium">YOUR PROPOSED SOLUTION</span>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                HYPOTHESIS
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-3">
              <p className="text-sm">{briefData.solution_description || 'Solution description not captured'}</p>
              {briefData.solution_mechanism && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">How It Works</p>
                  <p className="text-sm">{briefData.solution_mechanism}</p>
                </div>
              )}
              {briefData.differentiation_factors && briefData.differentiation_factors.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Differentiators</p>
                  <div className="flex flex-wrap gap-2">
                    {briefData.differentiation_factors.map((factor, i) => (
                      <Badge key={i} variant="outline">
                        {factor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {briefData.competitive_advantages && briefData.competitive_advantages.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Competitive Advantages</p>
                  <ul className="space-y-1">
                    {briefData.competitive_advantages.map((advantage, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {advantage}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 5: KEY ASSUMPTIONS */}
        <AccordionItem value="assumptions" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <ListChecks className="h-5 w-5 text-orange-500" />
              <span className="font-medium">KEY ASSUMPTIONS WE'LL TEST</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">
                These are the assumptions we'll validate through experiments:
              </p>
              <ol className="space-y-2">
                {keyAssumptions.map((assumption, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 text-xs font-medium flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-sm">{assumption}</span>
                  </li>
                ))}
              </ol>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Section 6: SUCCESS CRITERIA */}
        <AccordionItem value="success" className="border rounded-lg px-4">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">YOUR SUCCESS CRITERIA</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                What would make this worth pursuing:
              </p>
              {briefData.success_criteria && briefData.success_criteria.length > 0 ? (
                <ul className="space-y-2">
                  {briefData.success_criteria.map((criteria, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {criteria}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm italic text-muted-foreground">
                  Success criteria will be defined based on validation results.
                </p>
              )}
              {briefData.three_month_goals && briefData.three_month_goals.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">3-Month Goals</p>
                  <ul className="space-y-1">
                    {briefData.three_month_goals.slice(0, 3).map((goal, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <Target className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        {goal}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {briefData.key_metrics && briefData.key_metrics.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-muted-foreground mb-2">Key Metrics to Track</p>
                  <div className="flex flex-wrap gap-2">
                    {briefData.key_metrics.map((metric, i) => (
                      <Badge key={i} variant="outline">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* Confirmation Checkbox */}
      <div className="border-t pt-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            id="confirm"
            checked={confirmed}
            onCheckedChange={(checked) => setConfirmed(checked === true)}
            className="mt-0.5"
          />
          <div>
            <span className="text-sm font-medium">This captures my idea correctly</span>
            <p className="text-xs text-muted-foreground mt-1">
              By approving, you confirm that this brief accurately represents your business concept.
              The AI team will use this as the foundation for validation analysis.
            </p>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center pt-4">
        <Button
          variant="outline"
          onClick={() => setShowFeedbackDialog(true)}
          disabled={isApproving}
        >
          Request Changes
        </Button>
        <Button
          onClick={onApprove}
          disabled={!confirmed || isApproving}
          className="min-w-[180px]"
        >
          {isApproving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Approving...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Approve & Continue
            </>
          )}
        </Button>
      </div>

      {/* Request Changes Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription>
              Please describe what needs to be corrected in the brief.
              Our team will review your feedback and help make adjustments.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Describe what was captured incorrectly or what needs to be added..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowFeedbackDialog(false)}
              disabled={isSubmittingChanges}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestChanges}
              disabled={!feedback.trim() || isSubmittingChanges}
            >
              {isSubmittingChanges ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
