/**
 * Evidence Package Viewer
 *
 * Three-tab layout showing Pitch Narrative, Validation Evidence, and Integrity metadata.
 * Used by both founders (preview) and portfolio holders (full view).
 *
 * @story US-NL01
 */

'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NarrativePreview } from '@/components/narrative/NarrativePreview';
import { FileText, Shield, BarChart3, CheckCircle, Clock } from 'lucide-react';
import type { EvidencePackage } from '@/lib/narrative/types';

interface EvidencePackageViewerProps {
  package_data: EvidencePackage;
  accessId?: string;
  onTabChange?: (tab: string) => void;
}

function IntegrityTab({ integrity }: { integrity: EvidencePackage['integrity'] }) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evidence Hash</CardTitle>
          <CardDescription>Cryptographic proof of evidence integrity</CardDescription>
        </CardHeader>
        <CardContent>
          <code className="text-xs bg-muted p-2 rounded block break-all font-mono">
            {integrity.evidence_hash}
          </code>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Methodology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">VPD Version</span>
            <span className="font-mono">{integrity.methodology_version}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fit Score Algorithm</span>
            <span className="font-mono">{integrity.fit_score_algorithm}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Last HITL Review</span>
            <span>{new Date(integrity.last_hitl_checkpoint).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {integrity.agent_versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Agent Versions</CardTitle>
            <CardDescription>Agents that contributed to this analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {integrity.agent_versions.map((agent, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{agent.agent_name}</span>
                  <Badge variant="outline" className="text-xs font-mono">
                    v{agent.version}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ValidationEvidenceTab({ evidence }: { evidence: EvidencePackage['validation_evidence'] }) {
  return (
    <div className="space-y-6">
      {/* Gate Scores */}
      {evidence.gate_scores && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gate Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">
                  {((evidence.gate_scores.overall_fit ?? 0) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Overall Fit</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">
                  {((evidence.gate_scores.desirability ?? 0) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Desirability</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">
                  {((evidence.gate_scores.feasibility ?? 0) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Feasibility</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted">
                <p className="text-2xl font-bold">
                  {((evidence.gate_scores.viability ?? 0) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">Viability</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* VPC Summary */}
      {evidence.vpc && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Value Proposition Canvas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {evidence.vpc.pains && evidence.vpc.pains.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Customer Pains ({evidence.vpc.pains.length})</p>
                <div className="flex flex-wrap gap-1">
                  {evidence.vpc.pains.slice(0, 5).map((p, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {typeof p === 'string' ? p : (p as { description?: string }).description || 'Pain'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {evidence.vpc.gains && evidence.vpc.gains.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Customer Gains ({evidence.vpc.gains.length})</p>
                <div className="flex flex-wrap gap-1">
                  {evidence.vpc.gains.slice(0, 5).map((g, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {typeof g === 'string' ? g : (g as { description?: string }).description || 'Gain'}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Experiment Results */}
      {evidence.experiment_results && evidence.experiment_results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Experiment Results ({evidence.experiment_results.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {evidence.experiment_results.map((exp, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  {exp.outcome === 'validated' ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  ) : (
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium">{exp.hypothesis_id}</p>
                    <p className="text-xs text-muted-foreground">{exp.outcome}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* HITL Record */}
      {evidence.hitl_record && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Human-in-the-Loop Record</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evidence.hitl_record.checkpoints?.map((cp, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>{cp.checkpoint_type}</span>
                  <Badge variant="outline" className="text-xs">
                    {cp.approval_status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function EvidencePackageViewer({
  package_data,
  accessId,
  onTabChange,
}: EvidencePackageViewerProps) {
  const mountTimeRef = useRef(Date.now());

  const trackEvent = useCallback(
    (eventType: string, eventValue?: Record<string, unknown>) => {
      if (!accessId) return;
      fetch('/api/evidence-package/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'engagement',
          access_id: accessId,
          event_type: eventType,
          event_value: eventValue,
        }),
      }).catch(() => {});
    },
    [accessId]
  );

  // View duration beacon on unload
  useEffect(() => {
    if (!accessId) return;

    const sendDuration = () => {
      const seconds = Math.round((Date.now() - mountTimeRef.current) / 1000);
      if (seconds < 1) return;
      navigator.sendBeacon(
        '/api/evidence-package/track',
        JSON.stringify({
          action: 'duration',
          access_id: accessId,
          duration_seconds: seconds,
        })
      );
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') sendDuration();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', sendDuration);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', sendDuration);
      sendDuration();
    };
  }, [accessId]);

  const handleTabChange = (tab: string) => {
    trackEvent('tab_switch', { tab });
    onTabChange?.(tab);
  };

  return (
    <Tabs defaultValue="narrative" onValueChange={handleTabChange} className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="narrative" className="gap-1.5">
          <FileText className="h-4 w-4" />
          Pitch Narrative
        </TabsTrigger>
        <TabsTrigger value="evidence" className="gap-1.5">
          <BarChart3 className="h-4 w-4" />
          Validation Evidence
        </TabsTrigger>
        <TabsTrigger value="integrity" className="gap-1.5">
          <Shield className="h-4 w-4" />
          Integrity
        </TabsTrigger>
      </TabsList>

      <TabsContent value="narrative">
        {package_data.pitch_narrative?.content && (
          <NarrativePreview content={package_data.pitch_narrative.content} />
        )}
      </TabsContent>

      <TabsContent value="evidence">
        <ValidationEvidenceTab evidence={package_data.validation_evidence} />
      </TabsContent>

      <TabsContent value="integrity">
        <IntegrityTab integrity={package_data.integrity} />
      </TabsContent>
    </Tabs>
  );
}
