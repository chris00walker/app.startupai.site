/**
 * Gate Dashboard Component
 *
 * Comprehensive gate status display for project dashboard.
 * Shows current status, readiness, and actionable feedback.
 */

'use client';

import { GateStatusBadge } from './GateStatusBadge';
import { GateReadinessIndicator } from './GateReadinessIndicator';
import { Card } from '@/components/ui/card';
import { AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import type { ValidationStage, GateStatus } from '@/types/portfolio';

interface GateDashboardProps {
  projectId: string;
  stage: ValidationStage;
  gateStatus: GateStatus;
  readinessScore: number;
  evidenceCount: number;
  experimentsCount: number;
  failureReasons?: string[];
}

export function GateDashboard({
  projectId,
  stage,
  gateStatus,
  readinessScore,
  evidenceCount,
  experimentsCount,
  failureReasons = [],
}: GateDashboardProps) {
  const getIcon = () => {
    switch (gateStatus) {
      case 'Passed':
        return <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />;
      case 'Failed':
        return <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />;
      case 'At Risk':
        return <AlertCircle className="h-6 w-6 text-orange-600" aria-hidden="true" />;
      case 'Pending':
      default:
        return <Clock className="h-6 w-6 text-yellow-600" aria-hidden="true" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {getIcon()}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {stage} Gate
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Evidence-Led Stage Gate Evaluation
              </p>
            </div>
          </div>
          <GateStatusBadge status={gateStatus} />
        </div>

        {/* Readiness Indicator */}
        <GateReadinessIndicator
          score={readinessScore}
          stage={stage}
        />

        {/* Evidence Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {evidenceCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Total Evidence
            </div>
          </div>
          <div className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {experimentsCount}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Experiments Run
            </div>
          </div>
        </div>

        {/* Failure Reasons */}
        {gateStatus === 'Failed' && failureReasons.length > 0 && (
          <div
            className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4"
            role="alert"
            aria-labelledby="failure-reasons-title"
          >
            <h4
              id="failure-reasons-title"
              className="mb-2 font-semibold text-red-900 dark:text-red-300"
            >
              Areas to Improve:
            </h4>
            <ul className="space-y-1 text-sm text-red-800 dark:text-red-400">
              {failureReasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span aria-hidden="true">•</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pending Message */}
        {gateStatus === 'Pending' && (
          <div
            className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4"
            role="status"
          >
            <p className="text-sm text-yellow-800 dark:text-yellow-400">
              Keep collecting evidence to evaluate this gate. The gate will be automatically
              evaluated as you add evidence.
            </p>
          </div>
        )}

        {/* At Risk Message */}
        {gateStatus === 'At Risk' && (
          <div
            className="rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4"
            role="alert"
          >
            <p className="text-sm text-orange-800 dark:text-orange-400">
              ⚠️ Warning signals detected. Review the evidence and consider pivoting or
              strengthening your approach before progressing.
            </p>
          </div>
        )}

        {/* Passed Message */}
        {gateStatus === 'Passed' && (
          <div
            className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4"
            role="status"
          >
            <p className="text-sm text-green-800 dark:text-green-400">
              ✓ This gate has been passed! You can now progress to the next stage.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
