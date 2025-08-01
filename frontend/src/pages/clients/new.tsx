import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import api from '../../services/api';
import { ClientForm } from '../../components/ClientForm';
import { Button } from '../../components/ui/button';

const NewClientPage: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const createClientMutation = useMutation({
    mutationFn: (clientData: any) => api.post('/clients', clientData).then(r => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push(`/client/${data.client._id}`);
    },
    onError: (error: any) => {
      console.error('Failed to create client:', error);
      alert('Failed to create client. Please try again.');
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
        <ClientForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={createClientMutation.isPending}
        />
      </main>
    </div>
  );
};

export default NewClientPage;
