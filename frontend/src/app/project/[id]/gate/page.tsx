/**
 * Project Gate Page
 * 
 * Full gate evaluation dashboard for a project.
 * Shows gate status, readiness, and alerts.
 */

'use client';

import { useParams } from 'next/navigation';
import { GateDashboard } from '@/components/gates/GateDashboard';
import { useGateEvaluation } from '@/hooks/useGateEvaluation';
import { useGateAlerts } from '@/hooks/useGateAlerts';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Bell, RefreshCw } from 'lucide-react';
import { useEffect } from 'react';

export default function ProjectGatePage() {
  const params = useParams();
  const projectId = params.id as string;

  // For demo, using DESIRABILITY stage
  // In production, fetch from project data
  const stage = 'DESIRABILITY';

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

  if (isLoading && !result) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Evaluating gate...</span>
        </div>
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
