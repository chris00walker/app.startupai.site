import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '../../services/api';
import { ClientForm } from '../../components/ClientForm';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

const NewClientPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [workflowStatus, setWorkflowStatus] = useState<{
    stage: 'idle' | 'creating' | 'triggering-discovery' | 'complete' | 'error';
    message: string;
  }>({ stage: 'idle', message: '' });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      setWorkflowStatus({ stage: 'creating', message: 'Creating client profile...' });
      const response = await api.post('/clients', clientData);
      return response.data;
    },
    onSuccess: async (data) => {
      const clientId = data.client._id;
      
      try {
        // Trigger discovery workflow automatically
        setWorkflowStatus({ stage: 'triggering-discovery', message: 'Launching AI discovery workflow...' });
        
        // Start the discovery workflow
        await api.post(`/clients/${clientId}/discovery`);
        
        setWorkflowStatus({ stage: 'complete', message: 'Client created and AI analysis started!' });
        
        // Wait a moment to show success message, then redirect
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          router.push(`/client/${clientId}`);
        }, 2000);
        
      } catch (workflowError) {
        console.warn('Client created but workflow failed to start:', workflowError);
        setWorkflowStatus({ stage: 'complete', message: 'Client created! You can manually start workflows from the dashboard.' });
        
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ['clients'] });
          router.push(`/client/${clientId}`);
        }, 2000);
      }
    },
    onError: (error: any) => {
      console.error('Failed to create client:', error);
      setWorkflowStatus({ stage: 'error', message: 'Failed to create client. Please try again.' });
    }
  });

  const handleSubmit = (formData: any) => {
    createClientMutation.mutate(formData);
  };

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">New Client</h1>
              <p className="text-slate-600 mt-1">Add a new client to the intelligence platform</p>
            </div>
            <Link href="/">
              <Button variant="outline">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        {/* Progress Status Card */}
        {workflowStatus.stage !== 'idle' && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {workflowStatus.stage === 'creating' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                )}
                {workflowStatus.stage === 'triggering-discovery' && (
                  <div className="animate-pulse rounded-full h-4 w-4 bg-purple-600"></div>
                )}
                {workflowStatus.stage === 'complete' && (
                  <div className="rounded-full h-4 w-4 bg-green-600"></div>
                )}
                {workflowStatus.stage === 'error' && (
                  <div className="rounded-full h-4 w-4 bg-red-600"></div>
                )}
                <span>Processing Status</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{workflowStatus.message}</p>
              {workflowStatus.stage === 'triggering-discovery' && (
                <div className="mt-2 text-xs text-purple-600">
                  🤖 AI agents are analyzing your business requirements...
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <ClientForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createClientMutation.isPending || workflowStatus.stage !== 'idle'}
        />
      </main>
    </div>
  );
};

export default NewClientPage;
