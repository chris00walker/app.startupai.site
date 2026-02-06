/**
 * FoundersBriefPanel Component
 *
 * Read-only accordion panel displaying the complete Founder's Brief
 * from Modal's nested format. Used inside ApprovalDetailModal for
 * approve_brief / approve_founders_brief checkpoints.
 *
 * @story US-AH01, US-H01
 */

'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Lightbulb,
  AlertTriangle,
  Users,
  Target,
  ListChecks,
  Trophy,
  UserCircle,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import type { ModalFoundersBrief } from '@/types/crewai';

interface FoundersBriefPanelProps {
  brief?: ModalFoundersBrief | null;
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">{value || 'Not captured'}</dd>
    </div>
  );
}

function ValidationBadge({ status }: { status?: string }) {
  if (!status) return null;
  const color =
    status === 'validated'
      ? 'bg-green-100 text-green-700'
      : status === 'invalidated'
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100 text-gray-700';
  return (
    <Badge variant="outline" className={cn('text-xs', color)}>
      {status}
    </Badge>
  );
}

function RiskBadge({ level }: { level?: string }) {
  if (!level) return null;
  const color =
    level === 'high'
      ? 'bg-red-100 text-red-700'
      : level === 'medium'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-green-100 text-green-700';
  return (
    <Badge variant="outline" className={cn('text-xs', color)}>
      {level} risk
    </Badge>
  );
}

function BoolIndicator({
  value,
  trueLabel,
  falseLabel,
}: {
  value?: boolean | null;
  trueLabel: string;
  falseLabel: string;
}) {
  if (value === undefined || value === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
        <HelpCircle className="h-3 w-3" />
        Unknown
      </span>
    );
  }
  return value ? (
    <span className="inline-flex items-center gap-1 text-xs text-green-700">
      <CheckCircle2 className="h-3 w-3" />
      {trueLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <XCircle className="h-3 w-3" />
      {falseLabel}
    </span>
  );
}

export function FoundersBriefPanel({ brief }: FoundersBriefPanelProps) {
  if (!brief) return null;

  const idea = brief.the_idea;
  const problem = brief.problem_hypothesis;
  const customer = brief.customer_hypothesis;
  const solution = brief.solution_hypothesis;
  const assumptions = brief.key_assumptions;
  const criteria = brief.success_criteria;
  const founder = brief.founder_context;
  const qa = brief.qa_status;
  const meta = brief.metadata;

  const hasFounderContext =
    founder &&
    (founder.motivation ||
      founder.time_commitment ||
      founder.founder_background ||
      founder.resources_available);

  const hasMetadata =
    meta &&
    (meta.interview_turns ||
      meta.confidence_score ||
      meta.followup_questions_asked ||
      meta.interview_duration_minutes);

  return (
    <div data-testid="founders-brief-panel" className="space-y-3">
      <h4 className="text-sm font-medium">Founder&apos;s Brief</h4>

      {/* QA Status Bar */}
      {qa && (
        <div
          data-testid="qa-status-bar"
          className={cn(
            'rounded-lg border p-3 text-sm',
            qa.overall_status === 'passed'
              ? 'bg-green-50 border-green-200'
              : qa.overall_status === 'failed'
                ? 'bg-red-50 border-red-200'
                : 'bg-yellow-50 border-yellow-200'
          )}
        >
          <div className="flex items-center gap-2 font-medium mb-1">
            <ShieldCheck className="h-4 w-4" />
            QA Status: {qa.overall_status || 'Unknown'}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
            {qa.legitimacy_check && (
              <div>
                <span className="font-medium">Legitimacy:</span> {qa.legitimacy_check}
                {qa.legitimacy_notes && (
                  <span className="block mt-0.5">{qa.legitimacy_notes}</span>
                )}
              </div>
            )}
            {qa.intent_verification && (
              <div>
                <span className="font-medium">Intent:</span> {qa.intent_verification}
                {qa.intent_notes && (
                  <span className="block mt-0.5">{qa.intent_notes}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Accordion type="multiple" defaultValue={['idea', 'problem', 'customer', 'solution', 'assumptions', 'criteria', 'founder']}>
        {/* 1. THE IDEA */}
        <AccordionItem value="idea">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              1. The Idea
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <dl className="space-y-3">
              {idea?.one_liner && (
                <div className="rounded-md bg-primary/5 p-3 text-sm font-medium">
                  {idea.one_liner}
                </div>
              )}
              <FieldRow label="Description" value={idea?.description} />
              <FieldRow label="Inspiration" value={idea?.inspiration} />
              <FieldRow label="Unique Insight" value={idea?.unique_insight} />
            </dl>
          </AccordionContent>
        </AccordionItem>

        {/* 2. THE PROBLEM */}
        <AccordionItem value="problem">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              2. The Problem
              {problem?.validation_status && (
                <ValidationBadge status={problem.validation_status} />
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <dl className="space-y-3">
              <FieldRow label="Problem Statement" value={problem?.problem_statement} />
              <FieldRow label="Who Has This Problem" value={problem?.who_has_this_problem} />
              <FieldRow label="Frequency" value={problem?.frequency} />
              <FieldRow label="Current Alternatives" value={problem?.current_alternatives} />
              <FieldRow label="Why Alternatives Fail" value={problem?.why_alternatives_fail} />
              <FieldRow
                label="Evidence of Problem"
                value={problem?.evidence_of_problem}
              />
            </dl>
          </AccordionContent>
        </AccordionItem>

        {/* 3. WHO YOU'RE BUILDING FOR */}
        <AccordionItem value="customer">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              3. Who You&apos;re Building For
              {customer?.validation_status && (
                <ValidationBadge status={customer.validation_status} />
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <dl className="space-y-3">
              {customer?.primary_segment && (
                <div className="rounded-md bg-blue-50 p-3 text-sm font-medium">
                  {customer.primary_segment}
                </div>
              )}
              <FieldRow label="Segment Description" value={customer?.segment_description} />
              {customer?.characteristics && customer.characteristics.length > 0 && (
                <div className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">
                    Characteristics
                  </dt>
                  <dd className="flex flex-wrap gap-1">
                    {customer.characteristics.map((c, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {c}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
              <FieldRow label="Where to Find Them" value={customer?.where_to_find_them} />
              <FieldRow
                label="Estimated Size"
                value={customer?.estimated_size}
              />
            </dl>
          </AccordionContent>
        </AccordionItem>

        {/* 4. YOUR PROPOSED SOLUTION */}
        <AccordionItem value="solution">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              4. Your Proposed Solution
              {solution?.validation_status && (
                <ValidationBadge status={solution.validation_status} />
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <dl className="space-y-3">
              <FieldRow label="Proposed Solution" value={solution?.proposed_solution} />
              {solution?.key_features && solution.key_features.length > 0 && (
                <div className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">
                    Key Features
                  </dt>
                  <dd className="flex flex-wrap gap-1">
                    {solution.key_features.map((f, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {f}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
              <FieldRow label="Differentiation" value={solution?.differentiation} />
              <FieldRow
                label="Unfair Advantage"
                value={solution?.unfair_advantage}
              />
            </dl>
          </AccordionContent>
        </AccordionItem>

        {/* 5. KEY ASSUMPTIONS */}
        <AccordionItem value="assumptions">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-orange-500" />
              5. Key Assumptions
              {assumptions && (
                <Badge variant="outline" className="text-xs">
                  {assumptions.length}
                </Badge>
              )}
            </span>
          </AccordionTrigger>
          <AccordionContent>
            {assumptions && assumptions.length > 0 ? (
              <div className="space-y-3">
                {assumptions.map((a, i) => (
                  <div key={i} className="rounded-md border p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{a.assumption || 'No description'}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {a.category && (
                          <Badge variant="outline" className="text-xs">
                            {a.category}
                          </Badge>
                        )}
                        <RiskBadge level={a.risk_level} />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <BoolIndicator
                        value={a.testable}
                        trueLabel="Testable"
                        falseLabel="Not testable"
                      />
                      <BoolIndicator
                        value={a.tested}
                        trueLabel="Tested"
                        falseLabel="Not tested"
                      />
                      <BoolIndicator
                        value={a.validated}
                        trueLabel="Validated"
                        falseLabel="Not validated"
                      />
                    </div>
                    {a.how_to_test && (
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">How to test:</span> {a.how_to_test}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No assumptions listed</p>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 6. SUCCESS CRITERIA */}
        <AccordionItem value="criteria">
          <AccordionTrigger className="text-sm">
            <span className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              6. Success Criteria
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <dl className="space-y-3">
              <FieldRow
                label="Minimum Viable Signal"
                value={criteria?.minimum_viable_signal}
              />
              {criteria?.target_metrics &&
                Object.keys(criteria.target_metrics).length > 0 && (
                  <div className="space-y-0.5">
                    <dt className="text-xs font-medium text-muted-foreground">
                      Target Metrics
                    </dt>
                    <dd className="space-y-1">
                      {Object.entries(criteria.target_metrics).map(([k, v]) => (
                        <div key={k} className="flex justify-between text-sm rounded bg-muted/50 px-2 py-1">
                          <span className="font-medium">{k}</span>
                          <span className="text-muted-foreground">{v}</span>
                        </div>
                      ))}
                    </dd>
                  </div>
                )}
              {criteria?.deal_breakers && criteria.deal_breakers.length > 0 && (
                <div className="space-y-0.5">
                  <dt className="text-xs font-medium text-muted-foreground">
                    Deal Breakers
                  </dt>
                  <dd>
                    <ul className="list-disc list-inside text-sm space-y-0.5">
                      {criteria.deal_breakers.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
              {(criteria?.fit_score_target !== undefined ||
                criteria?.zombie_ratio_max !== undefined ||
                criteria?.problem_resonance_target !== undefined) && (
                <div className="grid grid-cols-3 gap-2">
                  {criteria?.fit_score_target !== undefined && (
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Fit Score Target</p>
                      <p className="font-semibold">{criteria.fit_score_target}</p>
                    </div>
                  )}
                  {criteria?.zombie_ratio_max !== undefined && (
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Max Zombie Ratio</p>
                      <p className="font-semibold">{criteria.zombie_ratio_max}</p>
                    </div>
                  )}
                  {criteria?.problem_resonance_target !== undefined && (
                    <div className="text-center p-2 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground">Problem Resonance</p>
                      <p className="font-semibold">{criteria.problem_resonance_target}</p>
                    </div>
                  )}
                </div>
              )}
            </dl>
          </AccordionContent>
        </AccordionItem>

        {/* 7. FOUNDER CONTEXT */}
        {hasFounderContext && (
          <AccordionItem value="founder">
            <AccordionTrigger className="text-sm">
              <span className="flex items-center gap-2">
                <UserCircle className="h-4 w-4 text-teal-500" />
                7. Founder Context
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <dl className="space-y-3">
                <FieldRow label="Motivation" value={founder?.motivation} />
                {founder?.time_commitment && (
                  <div className="space-y-0.5">
                    <dt className="text-xs font-medium text-muted-foreground">
                      Time Commitment
                    </dt>
                    <dd>
                      <Badge variant="secondary" className="text-xs">
                        {founder.time_commitment}
                      </Badge>
                    </dd>
                  </div>
                )}
                <FieldRow label="Background" value={founder?.founder_background} />
                <FieldRow
                  label="Resources Available"
                  value={founder?.resources_available}
                />
              </dl>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>

      {/* 8. METADATA Footer */}
      {hasMetadata && (
        <div
          data-testid="brief-metadata"
          className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t pt-3"
        >
          {meta?.interview_turns !== undefined && meta.interview_turns > 0 && (
            <span className="flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              {meta.interview_turns} turns
            </span>
          )}
          {meta?.confidence_score !== undefined && meta.confidence_score > 0 && (
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              {Math.round(meta.confidence_score * 100)}% confidence
            </span>
          )}
          {meta?.followup_questions_asked !== undefined && meta.followup_questions_asked > 0 && (
            <span className="flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              {meta.followup_questions_asked} follow-ups
            </span>
          )}
          {meta?.interview_duration_minutes !== undefined && meta.interview_duration_minutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {meta.interview_duration_minutes}min
            </span>
          )}
        </div>
      )}
    </div>
  );
}

