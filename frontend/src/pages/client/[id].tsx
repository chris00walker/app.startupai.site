/**
 * Client Detail Page
 *
 * @story US-C04
 */

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '../../services/api';
import { KanbanBoard } from '../../components/Dashboard/KanbanBoard';
import { AgentStatus } from '../../components/Agents/AgentStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { AlertCircle, CheckCircle, Clock, Play, RotateCcw, Activity, X, Eye, Plus, LayoutGrid, Map, Beaker, BookOpen, Target } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Progress } from '../../components/ui/progress';
import { VPCSummaryCard } from '@/components/vpc';
// Strategyzer Components
import { AssumptionMap, ExperimentCardsGrid, CanvasesGallery } from '@/components/strategyzer';
import { EvidenceLedger } from '@/components/fit/EvidenceLedger';

interface Client {
  _id: string;
  name: string;
  company: string;
  status: string;
  description?: string;
  workflowStatus?: {
    discovery: { status: string; completedAt?: string };
    validation: { status: string; completedAt?: string };
    scale: { status: string; completedAt?: string };
  };
}

interface Artefact {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  content?: any; // AI-generated content from workflows
}

interface WorkflowProgress {
  workflow: string;
  stage: string;
  progress: number;
  estimatedTimeRemaining: number;
  startTime: number;
}

const ClientPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id, tab } = router.query;
  const [selectedArtefact, setSelectedArtefact] = useState<Artefact | null>(null);
  const [showArtefactModal, setShowArtefactModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Set active tab from URL query parameter
  useEffect(() => {
    if (tab && typeof tab === 'string') {
      const validTabs = ['overview', 'canvases', 'assumptions', 'experiments', 'evidence'];
      if (validTabs.includes(tab)) {
        setActiveTab(tab);
      }
    }
  }, [tab]);

  const { data: client, isLoading: clientLoading, error: clientError } = useQuery<Client | null>({
    queryKey: ['client', id],
    queryFn: async () => {
      const response = await api.get(`/clients/${id}`);
      return response?.data?.client ?? null;
    },
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: artefacts = [], isLoading: artefactsLoading, error: artefactsError } = useQuery<Artefact[]>({
    queryKey: ['artefacts', id],
    queryFn: async () => {
      const response = await api.get(`/clients/${id}/artefacts`);
      return response?.data?.artefacts ?? [];
    },
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Enhanced workflow tracking state
  const [workflowProgress, setWorkflowProgress] = useState<Record<string, WorkflowProgress>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [workflowErrors, setWorkflowErrors] = useState<Record<string, string>>({});

  const displayClient = client || null;

  // Progress tracking for running workflows
  useEffect(() => {
    const intervals: Record<string, NodeJS.Timeout> = {};
    
    Object.entries(workflowProgress).forEach(([workflow, progress]) => {
      if (progress.progress < 100) {
        intervals[workflow] = setInterval(() => {
          setWorkflowProgress(prev => {
            const current = prev[workflow];
            if (!current || current.progress >= 100) return prev;
            
            const elapsed = Date.now() - current.startTime;
            const newProgress = Math.min(95, (elapsed / (current.estimatedTimeRemaining * 1000)) * 100);
            
            return {
              ...prev,
              [workflow]: {
                ...current,
                progress: newProgress,
                estimatedTimeRemaining: Math.max(5, current.estimatedTimeRemaining - 1)
              }
            };
          });
        }, 1000);
      }
    });
    
    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [workflowProgress]);

  // Workflow trigger mutation
  const workflowMutation = useMutation({
    mutationFn: async (workflowType: string) => {
      return api.post(`/clients/${id}/${workflowType}`, {});
    },
    onSuccess: () => {
      // Refresh client data to get updated workflow status
      queryClient.invalidateQueries({ queryKey: ['client', id] });
      queryClient.invalidateQueries({ queryKey: ['artefacts', id] });
    },
    onError: (error) => {
      console.error('Workflow failed:', error);
      alert('Failed to start workflow. Please try again.');
    }
  });

  const triggerWorkflow = (workflowType: string) => {
    workflowMutation.mutate(workflowType);
  };

  if (clientLoading && !clientError) {
    return (
      <div className="min-h-screen business-gradient">
        <div className="business-container py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-lg text-muted-foreground">Loading client dashboard...</div>
          </div>
        </div>
      </div>
    );
  }

  if (clientError || !displayClient) {
    return (
      <div className="min-h-screen business-gradient">
        <div className="business-container py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              We could not load this client right now. Please return to the portfolio and try again.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const clientName = displayClient.company || displayClient.name || 'Client';
  const clientContact = displayClient.name || '';
  const clientType = displayClient.description || clientContact || 'Client profile';
  const clientStatus = displayClient.status || 'Status unavailable';

  return (
    <div className="min-h-screen business-gradient">
      {/* Professional Header */}
      <header className="business-header">
        <div className="business-container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/consultant-dashboard" className="text-primary hover:text-primary/80 font-medium">
                ← Back to Portfolio
              </Link>
              <div>
                <h1 className="business-title">{clientName}</h1>
                <p className="business-subtitle">{clientType}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href={`/client/${id}/projects/new`}>
                <Button variant="default">
                  <Plus className="mr-2 h-4 w-4" />
                  New Project
                </Button>
              </Link>
              <Badge variant="default">
                {clientStatus}
              </Badge>
              <div className="flex items-center space-x-2">
                <div className="status-indicator bg-green-400"></div>
                <span className="text-sm text-muted-foreground">Live Dashboard</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="business-container py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="overview">
              <Target className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="canvases">
              <LayoutGrid className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Canvases
            </TabsTrigger>
            <TabsTrigger value="assumptions">
              <Map className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Assumption Map
            </TabsTrigger>
            <TabsTrigger value="experiments">
              <Beaker className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Experiment Cards
            </TabsTrigger>
            <TabsTrigger value="evidence">
              <BookOpen className="h-4 w-4 mr-1.5 hidden sm:inline" />
              Evidence
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB - Original client workspace content */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left Column - Kanban Board */}
              <div className="xl:col-span-2">
                <Card className="business-card">
                  <CardHeader className="business-card-header">
                    <CardTitle>Project Tasks & Milestones</CardTitle>
                    <CardDescription>Strategic initiatives and deliverables tracking</CardDescription>
                  </CardHeader>
                  <CardContent className="business-card-content">
                    <KanbanBoard clientId={id as string} />
                  </CardContent>
                </Card>
              </div>

              {/* Strategic Artefacts Column */}
              <Card className="business-card">
                <CardHeader className="business-card-header">
                  <CardTitle>Strategic Artefacts</CardTitle>
                  <CardDescription>Generated insights and deliverables</CardDescription>
                </CardHeader>
                <CardContent className="business-card-content">
                  {artefactsLoading && (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                      <div className="text-muted-foreground">Loading strategic artefacts...</div>
                    </div>
                  )}
                  {artefactsError && (
                    <div className="mb-4 p-4 border border-red-200 bg-red-50 rounded-lg">
                      <h3 className="font-semibold text-red-800 mb-2">Unable to load artefacts</h3>
                      <p className="text-red-700 text-sm">
                        Strategic artefacts are unavailable right now. Please try again later.
                      </p>
                    </div>
                  )}
                  <div className="space-y-4">
                    {artefacts.length > 0 ? (
                      artefacts.map((artefact) => (
                        <div
                          key={artefact.id}
                          className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => {
                            setSelectedArtefact(artefact);
                            setShowArtefactModal(true);
                          }}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{artefact.name}</h4>
                            <p className="text-sm text-muted-foreground">{artefact.type}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(artefact.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={artefact.status === 'completed' ? 'default' :
                                     artefact.status === 'in-progress' ? 'secondary' : 'outline'}
                            >
                              {artefact.status}
                            </Badge>
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <div className="text-muted-foreground mb-4">
                          <svg className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <p className="text-sm">No artefacts generated yet</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Generate Initial Analysis
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Right Column - Agent Status & Workflows */}
              <div className="xl:col-span-3 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Value Proposition Analysis */}
                {id && typeof id === 'string' && (
                  <VPCSummaryCard
                    projectId={id}
                    onClick={() => router.push(`/project/${id}/analysis`)}
                  />
                )}

                {/* Agent Status */}
                <Card className="business-card">
                  <CardHeader className="business-card-header">
                    <CardTitle>AI Agent Performance</CardTitle>
                    <CardDescription>Multi-agent system status and metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="business-card-content">
                    <AgentStatus />
                  </CardContent>
                </Card>

                {/* AI Workflow Controls */}
                <Card className="business-card">
                  <CardHeader className="business-card-header">
                    <CardTitle>AI Workflows</CardTitle>
                    <CardDescription>Automated business intelligence</CardDescription>
                  </CardHeader>
                  <CardContent className="business-card-content">
                    <div className="space-y-4">
                      {/* Discovery Workflow */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            displayClient?.workflowStatus?.discovery?.status === 'completed' ? 'bg-green-500' :
                            displayClient?.workflowStatus?.discovery?.status === 'in_progress' ? 'bg-yellow-500 animate-pulse' :
                            'bg-gray-300'
                          }`}></div>
                          <div>
                            <div className="font-medium text-sm">Discovery</div>
                            <div className="text-xs text-muted-foreground">Business analysis</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={displayClient?.workflowStatus?.discovery?.status === 'completed' ? 'outline' : 'default'}
                          onClick={() => triggerWorkflow('discovery')}
                        >
                          {displayClient?.workflowStatus?.discovery?.status === 'completed' ? 'Re-run' :
                           displayClient?.workflowStatus?.discovery?.status === 'in_progress' ? 'Running...' : 'Start'}
                        </Button>
                      </div>

                      {/* Validation Workflow */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            displayClient?.workflowStatus?.validation?.status === 'completed' ? 'bg-green-500' :
                            displayClient?.workflowStatus?.validation?.status === 'in_progress' ? 'bg-yellow-500 animate-pulse' :
                            'bg-gray-300'
                          }`}></div>
                          <div>
                            <div className="font-medium text-sm">Validation</div>
                            <div className="text-xs text-muted-foreground">Market testing</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={displayClient?.workflowStatus?.validation?.status === 'completed' ? 'outline' : 'default'}
                          onClick={() => triggerWorkflow('validation')}
                        >
                          {displayClient?.workflowStatus?.validation?.status === 'completed' ? 'Re-run' :
                           displayClient?.workflowStatus?.validation?.status === 'in_progress' ? 'Running...' : 'Start'}
                        </Button>
                      </div>

                      {/* Scale Workflow */}
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            displayClient?.workflowStatus?.scale?.status === 'completed' ? 'bg-green-500' :
                            displayClient?.workflowStatus?.scale?.status === 'in_progress' ? 'bg-yellow-500 animate-pulse' :
                            'bg-gray-300'
                          }`}></div>
                          <div>
                            <div className="font-medium text-sm">Scale</div>
                            <div className="text-xs text-muted-foreground">Growth strategy</div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant={displayClient?.workflowStatus?.scale?.status === 'completed' ? 'outline' : 'default'}
                          onClick={() => triggerWorkflow('scale')}
                        >
                          {displayClient?.workflowStatus?.scale?.status === 'completed' ? 'Re-run' :
                           displayClient?.workflowStatus?.scale?.status === 'in_progress' ? 'Running...' : 'Start'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* CANVASES TAB - Value Proposition Canvas + Business Model Canvas */}
          <TabsContent value="canvases" className="space-y-6">
            <CanvasesGallery projectId={id as string} />
          </TabsContent>

          {/* ASSUMPTION MAP TAB - Strategyzer terminology */}
          <TabsContent value="assumptions" className="space-y-6">
            <AssumptionMap projectId={id as string} />
          </TabsContent>

          {/* EXPERIMENT CARDS TAB - Strict Strategyzer format */}
          <TabsContent value="experiments" className="space-y-6">
            <ExperimentCardsGrid projectId={id as string} />
          </TabsContent>

          {/* EVIDENCE TAB - Evidence Ledger */}
          <TabsContent value="evidence" className="space-y-6">
            <EvidenceLedger />

            {/* Learning Cards Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Learning Cards
                </CardTitle>
                <CardDescription>
                  Capture insights and decisions from experiments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Learning cards will appear here after completing experiments.</p>
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab('experiments')}
                  >
                    <Beaker className="h-4 w-4 mr-2" />
                    View Experiment Cards
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Artefact Modal */}
      {showArtefactModal && selectedArtefact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-xl font-semibold">{selectedArtefact.name}</h2>
                <p className="text-sm text-muted-foreground">{selectedArtefact.type} • {new Date(selectedArtefact.createdAt).toLocaleDateString()}</p>
              </div>
              <button 
                onClick={() => setShowArtefactModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedArtefact.content ? (
                <div className="space-y-4">
                  {(() => {
                    // Handle different content structures
                    let contentData = selectedArtefact.content;
                    
                    // If content is a string, try to parse it as JSON
                    if (typeof contentData === 'string') {
                      try {
                        contentData = JSON.parse(contentData);
                      } catch (e) {
                        return <div className="whitespace-pre-wrap text-sm">{contentData}</div>;
                      }
                    }
                    
                    // If content has nested structure, extract the actual data
                    if (contentData && typeof contentData === 'object') {
                      // Check if it's wrapped in metadata (common in our backend)
                      const actualContent = contentData.content || contentData.data || contentData;
                      
                      return (
                        <div className="space-y-4">
                          {actualContent.analysis && (
                            <div>
                              <h3 className="font-semibold text-lg mb-2 text-blue-800">🔍 Analysis</h3>
                              <p className="text-sm text-gray-700 leading-relaxed">{actualContent.analysis}</p>
                            </div>
                          )}
                          {actualContent.recommendations && Array.isArray(actualContent.recommendations) && (
                            <div>
                              <h3 className="font-semibold text-lg mb-2 text-green-800">💡 Recommendations</h3>
                              <ul className="list-disc list-inside space-y-2">
                                {actualContent.recommendations.map((rec: string, index: number) => (
                                  <li key={index} className="text-sm text-gray-700 leading-relaxed">{rec}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {actualContent.nextSteps && Array.isArray(actualContent.nextSteps) && (
                            <div>
                              <h3 className="font-semibold text-lg mb-2 text-purple-800">🚀 Next Steps</h3>
                              <ul className="list-disc list-inside space-y-2">
                                {actualContent.nextSteps.map((step: string, index: number) => (
                                  <li key={index} className="text-sm text-gray-700 leading-relaxed">{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {actualContent.insights && Array.isArray(actualContent.insights) && (
                            <div>
                              <h3 className="font-semibold text-lg mb-2 text-orange-800">✨ Key Insights</h3>
                              <ul className="list-disc list-inside space-y-2">
                                {actualContent.insights.map((insight: string, index: number) => (
                                  <li key={index} className="text-sm text-gray-700 leading-relaxed">{insight}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {actualContent.status && (
                            <div>
                              <h3 className="font-semibold text-lg mb-2 text-gray-800">📊 Status</h3>
                              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                                actualContent.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {actualContent.status}
                              </span>
                            </div>
                          )}
                          
                          {/* Fallback: show raw JSON if no structured data found */}
                          {!actualContent.analysis && !actualContent.recommendations && !actualContent.nextSteps && !actualContent.insights && (
                            <div>
                              <h3 className="font-semibold text-lg mb-2 text-gray-800">📄 Raw Content</h3>
                              <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
                                {JSON.stringify(actualContent, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // Fallback for any other data type
                    return (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>Unable to parse artefact content.</p>
                        <pre className="mt-4 bg-gray-100 p-4 rounded-lg text-xs">
                          {JSON.stringify(contentData, null, 2)}
                        </pre>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No content available for this artefact.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPage;
