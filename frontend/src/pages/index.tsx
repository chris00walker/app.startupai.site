// TODO: implement home page overview of all clients
import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';

interface Client {
  id: string;
  name: string;
  status: string;
}

const HomePage: React.FC = () => {
  const { data: clients = [], isLoading, error } = useQuery<Client[]>({
    queryKey: ['clients'],
    queryFn: () => api.get('/clients').then((r) => r.data.clients),
    retry: false,
    refetchOnWindowFocus: false,
  });

  // Check if backend services are online based on API call success
  const isBackendOnline = !error && !isLoading;
  const hasClients = clients && clients.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-screen business-gradient">
        <div className="business-container py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <div className="text-lg text-muted-foreground">Loading client portfolio...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen business-gradient">
        {/* Professional Header */}
        <header className="business-header">
          <div className="business-container py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="business-title">Multi-Agent Intelligence Platform</h1>
                <p className="business-subtitle">Strategic Business Development & Market Analysis</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="status-indicator bg-amber-400"></div>
                <span className="text-sm text-muted-foreground">Demo Mode</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="business-container py-12">
          {/* Dynamic Status Alert */}
          {!isBackendOnline && (
            <Card className="mb-8 border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-semibold text-amber-800">Backend Services Offline</h3>
                    <p className="text-sm text-amber-700 mt-1">
                      The frontend platform is operational. Connect backend services to access live client data and analytics.
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

          {/* Demo Client Portfolio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Demo Client 1 */}
            <Card className="business-card">
              <CardHeader className="business-card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">TechStart Ventures</CardTitle>
                    <CardDescription>Series A SaaS Startup</CardDescription>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              </CardHeader>
              <CardContent className="business-card-content">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="metric-card">
                      <div className="metric-value text-primary">87%</div>
                      <div className="metric-label">Market Fit</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value text-green-600">$2.4M</div>
                      <div className="metric-label">ARR</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value text-purple-600">4.2x</div>
                      <div className="metric-label">Growth</div>
                    </div>
                  </div>
                  <Link href="/client/demo-1" passHref>
                    <Button className="w-full">
                      View Strategic Dashboard →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Demo Client 2 */}
            <Card className="business-card">
              <CardHeader className="business-card-header">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Global Manufacturing Co</CardTitle>
                    <CardDescription>Enterprise Digital Transformation</CardDescription>
                  </div>
                  <Badge variant="warning">In Progress</Badge>
                </div>
              </CardHeader>
              <CardContent className="business-card-content">
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="metric-card">
                      <div className="metric-value text-primary">64%</div>
                      <div className="metric-label">Efficiency</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value text-green-600">$18M</div>
                      <div className="metric-label">Cost Savings</div>
                    </div>
                    <div className="metric-card">
                      <div className="metric-value text-purple-600">12</div>
                      <div className="metric-label">Months</div>
                    </div>
                  </div>
                  <Link href="/client/demo-2" passHref>
                    <Button className="w-full">
                      View Strategic Dashboard →
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Features */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Intelligence Platform Capabilities</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <CardTitle className="text-lg mb-2">Market Discovery</CardTitle>
                  <CardDescription>AI-powered market analysis and opportunity identification</CardDescription>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <CardTitle className="text-lg mb-2">Strategic Validation</CardTitle>
                  <CardDescription>Data-driven validation of business hypotheses and strategies</CardDescription>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <CardTitle className="text-lg mb-2">Scale Optimization</CardTitle>
                  <CardDescription>Intelligent scaling strategies and performance optimization</CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container-professional py-6">
          <h1 className="page-title">Client Portfolio</h1>
          <p className="page-subtitle">Strategic business intelligence and growth analytics</p>
        </div>
      </header>
      
      <main className="container-professional py-12">
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-slate-500">No clients found. Connect your backend services to load client data.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map((c) => (
              <div key={c.id} className="card-professional hover:shadow-xl transition-shadow duration-300">
                <div className="card-content-professional">
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">{c.name}</h3>
                  <Link href={`/client/${c.id}`} className="btn-primary">
                    View Dashboard →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default HomePage;
