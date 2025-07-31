import React from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '../../services/api';
import { KanbanBoard } from '../../components/Dashboard/KanbanBoard';
import { AgentStatus } from '../../components/Agents/AgentStatus';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

interface Client {
  id: string;
  name: string;
  status: string;
  description?: string;
}

interface Artefact {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
}

// Demo data for when backend is offline
const getDemoClient = (id: string): Client => {
  const demoClients = {
    'demo-1': {
      id: 'demo-1',
      name: 'TechStart Ventures',
      status: 'active',
      description: 'Series A SaaS Startup - Strategic Growth & Market Expansion'
    },
    'demo-2': {
      id: 'demo-2',
      name: 'Global Manufacturing Co',
      status: 'in-progress',
      description: 'Enterprise Digital Transformation - Operations Optimization'
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
  const { id } = router.query;

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

  // Use demo data if there's an error (backend offline) or if it's a demo ID
  const displayClient = clientError || (typeof id === 'string' && id.startsWith('demo-')) 
    ? getDemoClient(id as string) 
    : client;
  
  const displayArtefacts = artefactsError || (typeof id === 'string' && id.startsWith('demo-')) 
    ? getDemoArtefacts(id as string) 
    : artefacts;

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
                    <div key={artefact.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">{artefact.name}</h4>
                        <p className="text-sm text-muted-foreground">{artefact.type}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(artefact.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge 
                        variant={artefact.status === 'completed' ? 'success' : 
                               artefact.status === 'in-progress' ? 'warning' : 'info'}
                      >
                        {artefact.status}
                      </Badge>
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

            {/* Quick Actions */}
            <Card className="business-card">
              <CardHeader className="business-card-header">
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Strategic management tools</CardDescription>
              </CardHeader>
              <CardContent className="business-card-content">
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Generate Market Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                    Update Strategic Plan
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Run Risk Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientPage;
