"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Brain, 
  Palette, 
  Users, 
  TrendingUp, 
  Zap,
  ArrowRight,
  CheckCircle,
  Target,
  Layers,
  Sparkles
} from "lucide-react"

interface Client {
  _id: string;
  name: string;
  company: string;
  industry: string;
  status: string;
  riskLevel: string;
  description?: string;
  assignedConsultant?: string;
  workflowStatus?: {
    discovery: { status: string; completedAt?: string };
    validation: { status: string; completedAt?: string };
    scale: { status: string; completedAt?: string };
  };
  metrics?: {
    totalTasks: number;
    completedTasks: number;
    lastActivity: string;
  };
  createdAt: string;
}

function HomePage() {
  const features = [
    {
      icon: Target,
      title: "Value Proposition Canvas",
      description: "AI-powered customer segment analysis and value proposition mapping with visual generation.",
      badge: "Core Framework"
    },
    {
      icon: Layers,
      title: "Business Model Canvas",
      description: "Complete 9-block business model visualization with multi-agent collaboration.",
      badge: "Strategic Planning"
    },
    {
      icon: Zap,
      title: "Testing Business Ideas",
      description: "Hypothesis-driven validation framework with automated experiment design.",
      badge: "Validation"
    },
    {
      icon: Brain,
      title: "Multi-Agent AI",
      description: "Collaborative AI agents working together to generate professional consulting deliverables.",
      badge: "AI Innovation"
    }
  ]

  const stats = [
    { label: "Canvas Generated", value: "2,500+", icon: Palette },
    { label: "Success Rate", value: "94%", icon: CheckCircle },
    { label: "Avg. Generation Time", value: "<2s", icon: Zap },
    { label: "Client Satisfaction", value: "4.8/5", icon: Users }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Brain className="h-4 w-4" />
              </div>
              <span className="text-xl font-bold">Strategyzer AI</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost">Dashboard</Button>
              </Link>
              <Link href="/login">
                <Button>Sign In</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20">
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            AI-Powered Strategy Consulting
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Transform Strategy with{" "}
            <span className="text-primary">Multi-Agent AI</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Generate professional business canvases, validate ideas, and accelerate 
            strategic planning with collaborative AI agents following proven Strategyzer methodology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
            <Link href="/dashboard">
              <Button size="lg" className="w-full sm:w-auto">
                <Brain className="h-4 w-4 mr-2" />
                Start AI Workflow
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Demo
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <div className="flex justify-center mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Strategyzer Methodology + AI Innovation</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Proven business strategy frameworks enhanced with multi-agent AI collaboration 
            for faster, more accurate strategic insights.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-6 py-20">
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="text-center py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Strategy?</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join leading consultants and strategists using AI to generate professional 
              business canvases and accelerate client outcomes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg">
                  Get Started Today
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button variant="outline" size="lg">
                  <Palette className="h-4 w-4 mr-2" />
                  View Canvas Gallery
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-primary-foreground">
                <Brain className="h-3 w-3" />
              </div>
              <span className="font-semibold">Strategyzer AI Platform</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 Strategyzer AI. Powered by multi-agent collaboration.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default HomePage
          {/* Dynamic Status Alert */}
          {!isBackendOnline && (
            <Card className="mb-8 border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-red-800">Backend Services Offline</h3>
                    <p className="text-sm text-red-700 mt-1">
                      Unable to connect to backend services. Please check your connection and try again.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Backend Online Status */}
          {isBackendOnline && (
            <Card className="mb-8 border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-green-800">Backend Services Online</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Connected to live backend services. Displaying real-time client data and analytics.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI-Generated Canvas Gallery */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">AI-Generated Canvas Gallery</h2>
                <p className="text-slate-600 mt-1">Interactive Strategyzer frameworks powered by multi-agent AI</p>
              </div>
              <div className="flex items-center space-x-3">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Brain className="w-3 h-3 mr-1" />
                  AI Active
                </Badge>
                <Button variant="outline" size="sm">
                  <FileImage className="w-4 h-4 mr-2" />
                  View All
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hasClients && clients.map((client) => {
                const completion = getWorkflowProgress(client.workflowStatus);
                const canvasType = "Business Model Canvas"; // Placeholder
                return (
                  <Card key={client._id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-slate-900 mb-1">
                            {`${client.company} Model`}
                          </CardTitle>
                          <CardDescription className="text-sm text-slate-600">
                            {canvasType} • {client.name}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                            <Brain className="w-3 h-3 mr-1" />
                            AI
                          </Badge>
                          <Badge 
                            className={`text-xs ${getStatusColor(client.status)}`}
                          >
                            {client.status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        <div className="aspect-video bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg border border-slate-200 flex items-center justify-center">
                          <div className="text-center">
                            <Palette className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm text-slate-600">{canvasType}</p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">Completion</span>
                            <span className="font-medium text-slate-900">{completion}%</span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                              style={{ width: `${completion}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span>Updated {client.metrics?.lastActivity || 'recently'}</span>
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span>Live</span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button size="sm" variant="outline" className="flex-1">
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* AI Canvas Generation Capabilities */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">AI-Powered Strategyzer Canvas Generation</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Palette className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg mb-2">Business Model Canvas</CardTitle>
                  <CardDescription>AI-generated 9-block interactive business model visualization with real-time collaboration</CardDescription>
                  <div className="mt-4">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      <Brain className="w-3 h-3 mr-1" />
                      Multi-Agent AI
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-lg mb-2">Value Proposition Canvas</CardTitle>
                  <CardDescription>Interactive interlocked circles design with customer jobs, pains, and gains analysis</CardDescription>
                  <div className="mt-4">
                    <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                      <Layers className="w-3 h-3 mr-1" />
                      Interactive SVG
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              <Card className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg mb-2">Testing Business Ideas</CardTitle>
                  <CardDescription>Hypothesis-driven testing framework with automated validation and metrics tracking</CardDescription>
                  <div className="mt-4">
                    <Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      Analytics
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* AI Capabilities Highlight */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
              <div className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mr-4">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900">Multi-Agent AI Orchestration</h3>
                </div>
                <p className="text-slate-600 text-lg mb-6 max-w-3xl mx-auto">
                  Our sophisticated AI agents collaborate to generate professional, client-ready visual canvases 
                  with rich insights, interactive elements, and export capabilities for strategic consulting.
                </p>
                <div className="flex items-center justify-center space-x-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">95%</div>
                    <div className="text-sm text-slate-600">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">&lt;2s</div>
                    <div className="text-sm text-slate-600">Generation Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">100%</div>
                    <div className="text-sm text-slate-600">Client Ready</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Client Portfolio</h1>
              <p className="text-slate-600 mt-1">Strategic business intelligence and growth analytics</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isBackendOnline ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-sm text-slate-600">{isBackendOnline ? 'Services Online' : 'Services Offline'}</span>
              </div>
              <Link href="/clients/new">
                <Button>+ New Client</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Backend Online Status */}
        {isBackendOnline && (
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardContent className="pt-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-semibold text-green-800">Multi-Agent Platform Online</h3>
                  <p className="text-sm text-green-700 mt-1">
                    Connected to live backend services. All AI agents and workflows are operational.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {clients.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-slate-900">No clients yet</h3>
              <p className="mt-2 text-slate-500">Get started by adding your first client to the intelligence platform.</p>
              <div className="mt-6">
                <Link href="/clients/new">
                  <Button>+ Add Your First Client</Button>
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((client) => (
              <Card key={client._id} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{client.company}</CardTitle>
                      <CardDescription className="mt-1">
                        {client.name} • {client.industry}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end space-y-1">
                      <Badge className={getStatusColor(client.status)} variant="secondary">
                        {client.status}
                      </Badge>
                      <Badge className={getRiskColor(client.riskLevel)} variant="outline">
                        {client.riskLevel} risk
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {client.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{client.description}</p>
                    )}
                    
                    {/* Workflow Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Workflow Progress</span>
                        <span>{getWorkflowProgress(client.workflowStatus)}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${getWorkflowProgress(client.workflowStatus)}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Workflow Progress Metrics */}
                    {(() => {
                      const workflows = ['discovery', 'validation', 'scale'];
                      const completedWorkflows = workflows.filter(w => 
                        client.workflowStatus?.[w]?.status === 'completed'
                      ).length;
                      const totalWorkflows = workflows.length;
                      
                      return (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="text-center p-2 bg-slate-50 rounded">
                            <div className="font-semibold text-slate-900">{totalWorkflows}</div>
                            <div className="text-slate-600">AI Workflows</div>
                          </div>
                          <div className="text-center p-2 bg-slate-50 rounded">
                            <div className="font-semibold text-slate-900">{completedWorkflows}</div>
                            <div className="text-slate-600">Completed</div>
                          </div>
                        </div>
                      );
                    })()}

                    {client.assignedConsultant && (
                      <div className="text-xs text-slate-600">
                        <span className="font-medium">Consultant:</span> {client.assignedConsultant}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Link href={`/client/${client._id}`}>
                      <Button className="w-full" variant="outline">
                        View Dashboard →
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
