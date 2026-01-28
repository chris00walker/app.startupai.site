/**
 * BriefSummary Component
 *
 * Displays a comprehensive summary of an entrepreneur brief,
 * showing all captured data from the onboarding conversation.
 */

'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  AlertTriangle,
  Lightbulb,
  Users,
  DollarSign,
  Trophy,
  BarChart3,
  Loader2,
  ChevronRight,
} from 'lucide-react';

interface EntrepreneurBrief {
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
  problem_impact: Record<string, any>;
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
  budget_constraints: Record<string, any>;
  available_channels: string[];
  existing_assets: string[];
  team_capabilities: string[];
  time_constraints: Record<string, any>;

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

interface BriefSummaryProps {
  projectId: string;
  sessionId?: string;
  compact?: boolean;
}

export function BriefSummary({ projectId, sessionId, compact = false }: BriefSummaryProps) {
  const supabase = createClient();

  const { data: brief, isLoading, error } = useQuery<EntrepreneurBrief | null>({
    queryKey: ['entrepreneur-brief', projectId, sessionId],
    queryFn: async () => {
      let query = supabase
        .from('entrepreneur_briefs')
        .select('*');

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      // Get project to find the session
      const { data: project } = await supabase
        .from('projects')
        .select('metadata')
        .eq('id', projectId)
        .single();

      if (project?.metadata?.onboardingSessionId) {
        query = query.eq('session_id', project.metadata.onboardingSessionId);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-500">Loading brief summary...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !brief) {
    return (
      <Card className="border-amber-200">
        <CardContent className="py-4">
          <p className="text-sm text-amber-600">
            No entrepreneur brief found. Complete onboarding to generate your strategic brief.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Compact view for sidebar/summary
  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-yellow-500" />
            Business Brief
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Problem</p>
            <p className="text-sm line-clamp-2">{brief.problem_description}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Solution</p>
            <p className="text-sm line-clamp-2">{brief.solution_description}</p>
          </div>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="text-xs">
              {brief.business_stage}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Quality: {brief.overall_quality_score}%
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <div className="space-y-6">
      {/* Quality Score Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Brief</CardTitle>
              <CardDescription>
                Your strategic foundation captured through onboarding
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{brief.overall_quality_score}%</div>
              <div className="text-xs text-muted-foreground">Brief Quality</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Completeness</span>
                <span className="text-xs font-medium">{brief.completeness_score}%</span>
              </div>
              <Progress value={brief.completeness_score} className="h-1" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Clarity</span>
                <span className="text-xs font-medium">{brief.clarity_score}%</span>
              </div>
              <Progress value={brief.clarity_score} className="h-1" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Consistency</span>
                <span className="text-xs font-medium">{brief.consistency_score}%</span>
              </div>
              <Progress value={brief.consistency_score} className="h-1" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Problem & Solution */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              Problem Statement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{brief.problem_description}</p>
            <div className="flex items-center gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Pain Level:</span>{' '}
                <Badge variant={brief.problem_pain_level >= 7 ? 'destructive' : 'secondary'}>
                  {brief.problem_pain_level}/10
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Frequency:</span>{' '}
                <span className="capitalize">{brief.problem_frequency}</span>
              </div>
            </div>
            {brief.problem_evidence.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Supporting Evidence</p>
                <ul className="text-xs space-y-1">
                  {brief.problem_evidence.slice(0, 3).map((evidence, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 mt-0.5 text-muted-foreground" />
                      {evidence}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-yellow-500" />
              Solution Concept
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">{brief.solution_description}</p>
            {brief.unique_value_proposition && (
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">
                  Unique Value Proposition
                </p>
                <p className="text-sm">{brief.unique_value_proposition}</p>
              </div>
            )}
            {brief.differentiation_factors.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Differentiators</p>
                <div className="flex flex-wrap gap-1">
                  {brief.differentiation_factors.map((factor, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Target Market */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-500" />
            Target Market
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Customer Segments</p>
              <div className="space-y-2">
                {brief.customer_segments.map((segment, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg ${
                      segment === brief.primary_customer_segment
                        ? 'bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800'
                        : 'bg-gray-50 dark:bg-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{segment}</span>
                      {segment === brief.primary_customer_segment && (
                        <Badge className="text-xs">Primary</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Competitive Landscape</p>
              {brief.competitors.length > 0 ? (
                <ul className="space-y-1 text-sm">
                  {brief.competitors.map((competitor, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                      {competitor}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No direct competitors identified
                </p>
              )}
              {brief.competitive_advantages.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-muted-foreground mb-1">Your Advantages</p>
                  <div className="flex flex-wrap gap-1">
                    {brief.competitive_advantages.map((advantage, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {advantage}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Business Context */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              Business Stage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge className="capitalize mb-3">{brief.business_stage}</Badge>
            {brief.available_channels.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Available Channels</p>
                <div className="flex flex-wrap gap-1">
                  {brief.available_channels.map((channel, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {brief.budget_range && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground">Budget Range</p>
                <p className="text-sm font-medium">{brief.budget_range}</p>
              </div>
            )}
            {brief.team_capabilities.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Team Capabilities</p>
                <div className="flex flex-wrap gap-1">
                  {brief.team_capabilities.map((cap, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4 text-yellow-500" />
              Goals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {brief.three_month_goals.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">3-Month Goals</p>
                <ul className="text-sm space-y-1">
                  {brief.three_month_goals.slice(0, 3).map((goal, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Target className="h-3 w-3 mt-1 text-muted-foreground" />
                      {goal}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {brief.success_criteria.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-1">Success Criteria</p>
                <ul className="text-xs space-y-1">
                  {brief.success_criteria.slice(0, 2).map((criteria, i) => (
                    <li key={i} className="text-muted-foreground">
                      {criteria}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      {brief.recommended_next_steps.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-blue-500" />
              AI-Recommended Next Steps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2">
              {brief.recommended_next_steps.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs font-medium flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="text-sm">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Validation Flags */}
      {brief.validation_flags.length > 0 && (
        <Card className="border-amber-200 dark:border-amber-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Areas Needing Validation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {brief.validation_flags.map((flag, i) => (
                <Badge key={i} variant="outline" className="text-amber-600 border-amber-300">
                  {flag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <p className="text-xs text-center text-muted-foreground">
        Brief captured on {new Date(brief.created_at).toLocaleDateString()} at{' '}
        {new Date(brief.created_at).toLocaleTimeString()}
      </p>
    </div>
  );
}
