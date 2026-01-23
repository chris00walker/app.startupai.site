/**
 * Project Gate Page
 * 
 * Full gate evaluation dashboard for a project.
 * Shows gate status, readiness, and alerts.
 *
 * @story US-H06, US-H07, US-H08
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { GateDashboard } from '@/components/gates/GateDashboard';
import { useGateEvaluation } from '@/hooks/useGateEvaluation';
import { useGateAlerts } from '@/hooks/useGateAlerts';
import { useProjects } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, RefreshCw, Sparkles, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ProjectGatePage() {
  const params = useParams();
  const projectId = params?.id as string;
  const { projects, isLoading: projectsLoading } = useProjects();
  const currentProject = projects.find((project) => project.id === projectId);

  const [analysisSummary, setAnalysisSummary] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisInsights, setAnalysisInsights] = useState<string[]>([]);

  if (!projectId) {
    return <div>Project not found</div>;
  }

  const stage = currentProject?.stage || 'DESIRABILITY';

  const { result, isLoading, error, refetch } = useGateEvaluation({
    projectId,
    stage,
    autoRefresh: true,
  });

  const {
    alerts,
    dismissAlert,
    requestNotificationPermission,
  } = useGateAlerts({
    projectId,
    stage,
    readinessScore: result?.readiness_score || 0,
  });

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
  }, [requestNotificationPermission]);

  // Prefill from session storage for immediate feedback
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('startupai:lastAnalysis');
      if (stored) {
        const parsed = JSON.parse(stored) as { summary?: string; analysisId?: string; insights?: { headline: string }[] };
        if (parsed.summary) {
          setAnalysisSummary(parsed.summary);
        }
        if (parsed.analysisId) {
          setAnalysisId(parsed.analysisId);
        }
        if (Array.isArray(parsed.insights) && parsed.insights.length > 0) {
          setAnalysisInsights(parsed.insights.map((item) => item.headline));
        }
        sessionStorage.removeItem('startupai:lastAnalysis');
      }
    } catch (error) {
      console.warn('Unable to read cached analysis summary', error);
    }
  }, []);

  useEffect(() => {
    const loadCrewAnalysis = async () => {
      if (!projectId) return;

      setAnalysisLoading(true);
      setAnalysisError(null);

      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('reports')
          .select('id, title, content, generation_metadata, generated_at')
          .eq('project_id', projectId)
          .contains('generation_metadata', { kind: 'crew_analysis' })
          .order('generated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          throw error;
        }

        if (data) {
          setAnalysisId((data.generation_metadata as any)?.analysis_id ?? data.id);
          // Show full report content - no truncation
          const summary = data.content ?? null;
          setAnalysisSummary(summary);

          const insights = Array.isArray((data.generation_metadata as any)?.insights)
            ? ((data.generation_metadata as any).insights as string[])
            : [];
          if (insights.length > 0) {
            setAnalysisInsights(insights);
          }
        }
      } catch (loadError) {
        console.error('Failed to load CrewAI analysis summary:', loadError);
        setAnalysisError('Unable to load the latest CrewAI deliverable at the moment.');
      } finally {
        setAnalysisLoading(false);
      }
    };

    loadCrewAnalysis();
  }, [projectId]);

  if ((projectsLoading || isLoading) && !result) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Evaluating gate...</span>
        </div>
      </div>
    );
  }

  if (!projectsLoading && !currentProject) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900">Project Not Found</h2>
          <p className="mt-2 text-sm text-red-700">We could not locate this project.</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200 bg-red-50 p-6">
          <h2 className="text-lg font-semibold text-red-900">
            Error Evaluating Gate
          </h2>
          <p className="mt-2 text-sm text-red-700">{error.message}</p>
          <Button onClick={refetch} variant="outline" className="mt-4">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Gate Evaluation
          </h1>
          <p className="mt-1 text-gray-600 dark:text-gray-400">
            Evidence-led stage gate assessment for your project
          </p>
        </div>
        <Button
          onClick={refetch}
          variant="outline"
          disabled={isLoading}
          aria-label="Refresh gate evaluation"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <Card className="border-primary/20 bg-primary/5 p-6" role="region" aria-label="CrewAI strategic summary">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-primary mt-1" aria-hidden="true" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold text-primary">CrewAI Strategic Summary</h2>
                {analysisId && (
                  <p className="text-xs text-primary/70">Run ID: {analysisId}</p>
                )}
              </div>
              {analysisLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />}
            </div>
            {analysisError && (
              <p className="text-sm text-destructive" role="alert">{analysisError}</p>
            )}
            {analysisSummary ? (
              <div
                className="text-sm text-gray-800 dark:text-gray-200 max-h-96 overflow-y-auto whitespace-pre-wrap"
                aria-live="polite"
              >
                {analysisSummary}
              </div>
            ) : (
              !analysisLoading && (
                <p className="text-sm text-muted-foreground">
                  AI deliverables will appear here once the CrewAI workflow finishes processing this project.
                </p>
              )
            )}
            {analysisInsights.length > 0 && (
              <ul className="mt-3 space-y-1 text-sm text-gray-700 dark:text-gray-300">
                {analysisInsights.slice(0, 3).map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Card
              key={alert.id}
              className="border-blue-200 bg-blue-50 dark:bg-blue-900/20 p-4"
              role="alert"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-blue-600 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-medium text-blue-900 dark:text-blue-300">
                      {alert.message}
                    </p>
                    <p className="mt-1 text-sm text-blue-700 dark:text-blue-400">
                      Complete the remaining criteria to pass this gate.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => dismissAlert(alert.id)}
                  variant="ghost"
                  size="sm"
                  aria-label="Dismiss alert"
                >
                  ✕
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Gate Dashboard */}
      <GateDashboard
        projectId={projectId}
        stage={result.stage as any}
        gateStatus={result.status}
        readinessScore={result.readiness_score}
        evidenceCount={result.evidence_count}
        experimentsCount={result.experiments_count}
        failureReasons={result.reasons}
      />

      {/* Help Section */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          About Stage Gates
        </h2>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong className="text-gray-900 dark:text-gray-100">Stage gates</strong> are evidence-based checkpoints that ensure your project has sufficient validation before progressing.
          </p>
          <p>
            Each gate evaluates multiple criteria including evidence quality, experiment count, evidence type diversity, and strength distribution.
          </p>
          <p>
            The system automatically re-evaluates when you add new evidence, keeping your gate status up to date.
          </p>
        </div>
      </Card>
    </div>
  );
}
