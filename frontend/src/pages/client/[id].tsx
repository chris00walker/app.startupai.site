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
import { Separator } from '../../components/ui/separator';
import { AlertCircle, CheckCircle, Clock, Play, RotateCcw, Activity, X, Eye } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Progress } from '../../components/ui/progress';

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

// Demo data for when backend is offline
const getDemoClient = (id: string): Client => {
  const demoClients = {
    'demo-1': {
      _id: 'demo-1',
      name: 'TechStart Ventures',
      company: 'TechStart Ventures',
      status: 'active',
      description: 'Series A SaaS Startup - Strategic Growth & Market Expansion',
      workflowStatus: {
        discovery: { status: 'completed', completedAt: '2025-08-01T10:00:00Z' },
        validation: { status: 'in_progress' },
        scale: { status: 'not_started' }
      }
    },
    'demo-2': {
      _id: 'demo-2',
      name: 'Global Manufacturing Co',
      company: 'Global Manufacturing Co',
      status: 'in-progress',
      description: 'Enterprise Digital Transformation - Operations Optimization',
      workflowStatus: {
        discovery: { status: 'completed', completedAt: '2025-07-30T14:30:00Z' },
        validation: { status: 'completed', completedAt: '2025-08-01T16:45:00Z' },
        scale: { status: 'in_progress' }
      }
    }
  };
  return demoClients[id as keyof typeof demoClients] || demoClients['demo-1'];
};

const getDemoArtefacts = (id: string): Artefact[] => {
  const baseArtefacts = [
    {
      id: '1',
      name: 'Market Analysis Report',
      type: 'Research',
      status: 'completed',
      createdAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Competitive Intelligence',
      type: 'Analysis',
      status: 'in-progress',
      createdAt: '2024-01-20T14:30:00Z'
    },
    {
      id: '3',
      name: 'Strategic Roadmap',
      type: 'Planning',
      status: 'completed',
      createdAt: '2024-01-10T09:15:00Z'
    },
    {
      id: '4',
      name: 'Risk Assessment',
      type: 'Analysis',
      status: 'pending',
      createdAt: '2024-01-25T16:45:00Z'
    }
  ];
  
  if (id === 'demo-2') {
    return [
      ...baseArtefacts,
      {
        id: '5',
        name: 'Process Optimization Study',
        type: 'Operations',
        status: 'completed',
        createdAt: '2024-01-12T11:20:00Z'
      },
      {
        id: '6',
        name: 'Digital Transformation Plan',
        type: 'Strategy',
        status: 'in-progress',
        createdAt: '2024-01-22T13:10:00Z'
      }
    ];
  }
  
  return baseArtefacts;
};

const ClientPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { id } = router.query;
  const [selectedArtefact, setSelectedArtefact] = useState<Artefact | null>(null);
  const [showArtefactModal, setShowArtefactModal] = useState(false);

  const { data: client, isLoading: clientLoading, error: clientError } = useQuery<Client>({
    queryKey: ['client', id],
    queryFn: () => api.get(`/clients/${id}`).then((r) => r.data.client),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const { data: artefacts = [], isLoading: artefactsLoading, error: artefactsError } = useQuery<Artefact[]>({
    queryKey: ['artefacts', id],
    queryFn: () => api.get(`/clients/${id}/artefacts`).then((r) => r.data.artefacts),
    enabled: !!id,
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Enhanced workflow tracking state
  const [workflowProgress, setWorkflowProgress] = useState<Record<string, WorkflowProgress>>({});
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});
  const [workflowErrors, setWorkflowErrors] = useState<Record<string, string>>({});

  // Use demo data if there's an error (backend offline) or if it's a demo ID
  const displayClient = clientError || (typeof id === 'string' && id.startsWith('demo-')) 
    ? getDemoClient(id as string) 
    : client;
  
  const displayArtefacts = artefactsError || (typeof id === 'string' && id.startsWith('demo-')) 
    ? getDemoArtefacts(id as string) 
    : artefacts;

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
      return api.post(`/clients/${id}/${workflowType}`);
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

  const clientName = displayClient?.name || 'Loading Client...';
  const clientType = displayClient?.description || 'Loading client information...';

  return (
    <div className="min-h-screen business-gradient">
      {/* Professional Header */}
      <header className="business-header">
        <div className="business-container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/" className="text-primary hover:text-primary/80 font-medium">
                ← Back to Portfolio
              </Link>
              <div>
                <h1 className="business-title">{clientName}</h1>
                <p className="business-subtitle">{clientType}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="success">
                Active
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

          {/* Left Column - Artefacts */}
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
                <div className="mb-4 p-4 border border-amber-200 bg-amber-50 rounded-lg">
                  <h3 className="font-semibold text-amber-800 mb-2">Demo Artefacts Available</h3>
                  <p className="text-amber-700 text-sm">
                    Backend services are offline. Displaying demo strategic artefacts and insights.
                  </p>
                </div>
              )}
              <div className="space-y-4">
                {displayArtefacts.length > 0 ? (
                  displayArtefacts.map((artefact) => (
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
                          variant={artefact.status === 'completed' ? 'success' : 
                                 artefact.status === 'in-progress' ? 'warning' : 'info'}
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

          {/* Right Column - Agent Status & Artefacts */}
          <div className="space-y-8">
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
                <CardTitle>🤖 AI Workflows</CardTitle>
                <CardDescription>Automated business intelligence & strategy</CardDescription>
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
                        <div className="text-xs text-muted-foreground">Business analysis & strategy</div>
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
                        <div className="text-xs text-muted-foreground">Market testing & validation</div>
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
                        <div className="text-xs text-muted-foreground">Growth & scaling strategy</div>
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
                  {typeof selectedArtefact.content === 'string' ? (
                    <div className="whitespace-pre-wrap text-sm">{selectedArtefact.content}</div>
                  ) : (
                    <div className="space-y-4">
                      {selectedArtefact.content.analysis && (
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Analysis</h3>
                          <p className="text-sm text-gray-700">{selectedArtefact.content.analysis}</p>
                        </div>
                      )}
                      {selectedArtefact.content.recommendations && (
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Recommendations</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {selectedArtefact.content.recommendations.map((rec: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700">{rec}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedArtefact.content.nextSteps && (
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Next Steps</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {selectedArtefact.content.nextSteps.map((step: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700">{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {selectedArtefact.content.insights && (
                        <div>
                          <h3 className="font-semibold text-lg mb-2">Key Insights</h3>
                          <ul className="list-disc list-inside space-y-1">
                            {selectedArtefact.content.insights.map((insight: string, index: number) => (
                              <li key={index} className="text-sm text-gray-700">{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
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
