/**
 * Enhanced Value Proposition Canvas
 *
 * Displays the canonical Strategyzer VPC format with all CrewAI data:
 * - Jobs with functional/emotional/social dimensions and importance
 * - Pains with intensity scores and reliever mappings
 * - Gains with importance scores and creator mappings
 * - Fit indicators showing problem-solution alignment
 * - Differentiators and resonance scores
 *
 * This component is READ-ONLY and designed for displaying CrewAI analysis results.
 * For editable VPC, use the standard ValuePropositionCanvas component.
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Gift,
  TrendingUp,
  Pill,
  Smile,
  Frown,
  Briefcase,
  Heart,
  Users,
  Target,
  Zap,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  VPCUISegment,
  VPCJob,
  VPCPain,
  VPCGain,
} from '@/lib/crewai/vpc-transformer';
import {
  getIntensityColor,
  getImportanceColor,
  getFitPercentage,
  getFitStatus,
} from '@/lib/crewai/vpc-transformer';

interface EnhancedValuePropositionCanvasProps {
  segment: VPCUISegment;
  showFitLines?: boolean;
  className?: string;
}

// =======================================================================================
// SUB-COMPONENTS
// =======================================================================================

/**
 * Intensity/Importance badge with color coding
 */
function ScoreBadge({
  score,
  type,
  size = 'sm',
}: {
  score: number | undefined;
  type: 'intensity' | 'importance';
  size?: 'sm' | 'md';
}) {
  if (score === undefined) return null;

  const colorMap = {
    intensity: {
      high: 'bg-red-100 text-red-800 border-red-200',
      medium: 'bg-orange-100 text-orange-800 border-orange-200',
      low: 'bg-green-100 text-green-800 border-green-200',
    },
    importance: {
      high: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-slate-100 text-slate-800 border-slate-200',
    },
  };

  const level = score >= 7 ? 'high' : score >= 4 ? 'medium' : 'low';
  const colors = colorMap[type][level];

  return (
    <Badge
      variant="outline"
      className={cn(
        colors,
        size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'
      )}
    >
      {score}/10
    </Badge>
  );
}

/**
 * Job card showing all three dimensions
 */
function JobCard({ job, index }: { job: VPCJob; index: number }) {
  const hasContent = job.functional || job.emotional || job.social;

  if (!hasContent) return null;

  return (
    <div className="p-3 bg-white border rounded-lg shadow-sm space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Job {index + 1}
        </span>
        <ScoreBadge score={job.importance} type="importance" />
      </div>

      {job.functional && (
        <div className="flex items-start gap-2">
          <Briefcase className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-muted-foreground block">Functional</span>
            <span className="text-sm">{job.functional}</span>
          </div>
        </div>
      )}

      {job.emotional && (
        <div className="flex items-start gap-2">
          <Heart className="w-4 h-4 text-pink-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-muted-foreground block">Emotional</span>
            <span className="text-sm">{job.emotional}</span>
          </div>
        </div>
      )}

      {job.social && (
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs text-muted-foreground block">Social</span>
            <span className="text-sm">{job.social}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Pain card with intensity and reliever mapping
 */
function PainCard({ pain }: { pain: VPCPain }) {
  const hasReliever = !!pain.reliever;

  return (
    <div
      className={cn(
        'p-3 border rounded-lg space-y-2',
        hasReliever
          ? 'bg-green-50 border-green-200'
          : 'bg-white border-gray-200'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <Frown className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{pain.description}</span>
        </div>
        <ScoreBadge score={pain.intensity} type="intensity" />
      </div>

      {hasReliever && (
        <div className="flex items-start gap-2 pl-6 pt-1 border-t border-green-200">
          <ArrowRight className="w-3 h-3 text-green-600 mt-1 flex-shrink-0" />
          <div>
            <span className="text-xs text-green-700 font-medium">Relieved by:</span>
            <span className="text-sm text-green-800 block">{pain.reliever}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Gain card with importance and creator mapping
 */
function GainCard({ gain }: { gain: VPCGain }) {
  const hasCreator = !!gain.creator;

  return (
    <div
      className={cn(
        'p-3 border rounded-lg space-y-2',
        hasCreator
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-white border-gray-200'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1">
          <Smile className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{gain.description}</span>
        </div>
        <ScoreBadge score={gain.importance} type="importance" />
      </div>

      {hasCreator && (
        <div className="flex items-start gap-2 pl-6 pt-1 border-t border-emerald-200">
          <ArrowRight className="w-3 h-3 text-emerald-600 mt-1 flex-shrink-0" />
          <div>
            <span className="text-xs text-emerald-700 font-medium">Created by:</span>
            <span className="text-sm text-emerald-800 block">{gain.creator}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Fit indicator showing problem-solution alignment
 */
function FitIndicator({ segment }: { segment: VPCUISegment }) {
  const fitPercentage = getFitPercentage(segment);
  const fitStatus = getFitStatus(segment);

  const statusConfig = {
    strong: { color: 'text-green-600', bg: 'bg-green-500', label: 'Strong Fit' },
    partial: { color: 'text-yellow-600', bg: 'bg-yellow-500', label: 'Partial Fit' },
    weak: { color: 'text-orange-600', bg: 'bg-orange-500', label: 'Weak Fit' },
    none: { color: 'text-gray-600', bg: 'bg-gray-400', label: 'No Fit Data' },
  };

  const config = statusConfig[fitStatus];

  return (
    <div className="flex items-center gap-4 p-4 bg-white border rounded-lg">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Problem-Solution Fit</span>
          <Badge variant="outline" className={config.color}>
            {config.label}
          </Badge>
        </div>
        <Progress value={fitPercentage} className="h-2" />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>
            {segment.fit.painsAddressed}/{segment.fit.totalPains} pains addressed
          </span>
          <span>
            {segment.fit.gainsCreated}/{segment.fit.totalGains} gains created
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className={cn('text-3xl font-bold', config.color)}>{fitPercentage}%</div>
        <div className="text-xs text-muted-foreground">Fit Score</div>
      </div>
    </div>
  );
}

/**
 * Resonance score display
 */
function ResonanceScore({ score }: { score: number | undefined }) {
  if (score === undefined) return null;

  const percentage = Math.round(score * 100);
  const level =
    score >= 0.7 ? 'strong' : score >= 0.4 ? 'moderate' : 'low';
  const config = {
    strong: { color: 'text-green-600', label: 'Strong Resonance' },
    moderate: { color: 'text-yellow-600', label: 'Moderate Resonance' },
    low: { color: 'text-red-600', label: 'Low Resonance' },
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border rounded-full">
            <Target className={cn('w-4 h-4', config[level].color)} />
            <span className={cn('text-sm font-medium', config[level].color)}>
              {percentage}% Resonance
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config[level].label} from customer testing</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// =======================================================================================
// MAIN COMPONENT
// =======================================================================================

export default function EnhancedValuePropositionCanvas({
  segment,
  showFitLines = true,
  className,
}: EnhancedValuePropositionCanvasProps) {
  return (
    <div className={cn('w-full', className)}>
      {/* Header with segment name and resonance */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{segment.segmentName}</h2>
          <p className="text-muted-foreground">Value Proposition Canvas</p>
        </div>
        <ResonanceScore score={segment.customerProfile.resonanceScore} />
      </div>

      {/* Fit Indicator */}
      <div className="mb-6">
        <FitIndicator segment={segment} />
      </div>

      {/* Main Canvas - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* VALUE MAP (Left Side - Square in Strategyzer format) */}
        <Card className="border-2 border-purple-200 bg-purple-50/30">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-purple-800">
              <Gift className="w-5 h-5" />
              Value Map
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Products & Services */}
            <div>
              <h4 className="text-sm font-semibold text-purple-700 mb-3 flex items-center gap-2">
                <Gift className="w-4 h-4" />
                Products & Services
              </h4>
              <div className="space-y-2">
                {segment.valueMap.productsAndServices.length > 0 ? (
                  segment.valueMap.productsAndServices.map((item, i) => (
                    <div
                      key={i}
                      className="p-2 bg-white border border-purple-200 rounded-md text-sm"
                    >
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No products/services defined
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Pain Relievers */}
            <div>
              <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4" />
                Pain Relievers
                <Badge variant="secondary" className="ml-auto">
                  {Object.keys(segment.valueMap.painRelievers).length} mapped
                </Badge>
              </h4>
              <div className="space-y-2">
                {Object.entries(segment.valueMap.painRelievers).length > 0 ? (
                  Object.entries(segment.valueMap.painRelievers).map(
                    ([pain, relief], i) => (
                      <div
                        key={i}
                        className="p-2 bg-blue-50 border border-blue-200 rounded-md"
                      >
                        <div className="text-xs text-blue-600 mb-1">
                          Relieves: "{pain}"
                        </div>
                        <div className="text-sm text-blue-900">{relief}</div>
                      </div>
                    )
                  )
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No pain relievers mapped
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Gain Creators */}
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Gain Creators
                <Badge variant="secondary" className="ml-auto">
                  {Object.keys(segment.valueMap.gainCreators).length} mapped
                </Badge>
              </h4>
              <div className="space-y-2">
                {Object.entries(segment.valueMap.gainCreators).length > 0 ? (
                  Object.entries(segment.valueMap.gainCreators).map(
                    ([gain, creator], i) => (
                      <div
                        key={i}
                        className="p-2 bg-green-50 border border-green-200 rounded-md"
                      >
                        <div className="text-xs text-green-600 mb-1">
                          Creates: "{gain}"
                        </div>
                        <div className="text-sm text-green-900">{creator}</div>
                      </div>
                    )
                  )
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No gain creators mapped
                  </p>
                )}
              </div>
            </div>

            {/* Differentiators */}
            {segment.valueMap.differentiators.length > 0 && (
              <>
                <Separator />
                <div>
                  <h4 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Differentiators
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {segment.valueMap.differentiators.map((diff, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="bg-amber-50 border-amber-200 text-amber-800"
                      >
                        {diff}
                      </Badge>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* CUSTOMER PROFILE (Right Side - Circle in Strategyzer format) */}
        <Card className="border-2 border-teal-200 bg-teal-50/30">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-teal-800">
              <Users className="w-5 h-5" />
              Customer Profile: {segment.customerSegmentTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Customer Jobs */}
            <div>
              <h4 className="text-sm font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Customer Jobs
                <Badge variant="secondary" className="ml-auto">
                  {segment.customerProfile.jobs.length} jobs
                </Badge>
              </h4>
              <div className="space-y-3">
                {segment.customerProfile.jobs.length > 0 ? (
                  segment.customerProfile.jobs.map((job, i) => (
                    <JobCard key={i} job={job} index={i} />
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No jobs defined
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Pains */}
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
                <Frown className="w-4 h-4" />
                Pains
                <Badge variant="secondary" className="ml-auto">
                  {segment.fit.painsAddressed}/{segment.fit.totalPains} addressed
                </Badge>
              </h4>
              <div className="space-y-3">
                {segment.customerProfile.pains.length > 0 ? (
                  segment.customerProfile.pains
                    .sort((a, b) => (b.intensity || 0) - (a.intensity || 0))
                    .map((pain, i) => <PainCard key={i} pain={pain} />)
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No pains defined
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Gains */}
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-3 flex items-center gap-2">
                <Smile className="w-4 h-4" />
                Gains
                <Badge variant="secondary" className="ml-auto">
                  {segment.fit.gainsCreated}/{segment.fit.totalGains} created
                </Badge>
              </h4>
              <div className="space-y-3">
                {segment.customerProfile.gains.length > 0 ? (
                  segment.customerProfile.gains
                    .sort((a, b) => (b.importance || 0) - (a.importance || 0))
                    .map((gain, i) => <GainCard key={i} gain={gain} />)
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No gains defined
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 border rounded-lg">
        <h4 className="text-sm font-medium mb-3">Legend</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span>High intensity pain (8-10)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span>Medium intensity (4-7)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span>High importance gain (8-10)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Pain/Gain addressed</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =======================================================================================
// EXPORTS
// =======================================================================================

export { EnhancedValuePropositionCanvas };
export type { EnhancedValuePropositionCanvasProps };
