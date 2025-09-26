// TODO: implement Agents/AgentStatus UI component
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

// Simple badge component for demo (replace with actual ShadCN UI when available)
const Badge: React.FC<{ children: React.ReactNode; variant?: string }> = ({ children, variant }) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'outline': return 'bg-green-100 text-green-800 border border-green-300';
      case 'secondary': return 'bg-gray-100 text-gray-800';
      case 'destructive': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };
  
  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVariantClasses()}`}>
      {children}
    </span>
  );
};

interface AgentInfo {
  name: string;
  status: 'running' | 'idle' | 'error';
  lastUpdated: string;
}

export const AgentStatus: React.FC = () => {
  const { data, isLoading, error, refetch } = useQuery<AgentInfo[]>({
    queryKey: ['agentsStatus'],
    queryFn: async () => {
      const response = await api.get('/agents/status');
      return response?.data?.agents ?? [];
    },
    refetchInterval: 5000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div>Loading agents...</div>;
  
  if (error) {
    // Demo data when API is not available
    const demoAgents: AgentInfo[] = [
      { name: 'DiscoveryAgent', status: 'running', lastUpdated: new Date().toISOString() },
      { name: 'ValidationAgent', status: 'idle', lastUpdated: new Date(Date.now() - 300000).toISOString() },
      { name: 'ScaleAgent', status: 'running', lastUpdated: new Date(Date.now() - 60000).toISOString() },
      { name: 'RiskAgent', status: 'error', lastUpdated: new Date(Date.now() - 600000).toISOString() },
    ];
    
    return (
      <div>
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded mb-4 text-sm">
          Demo Mode: Showing sample agent status (backend not connected)
        </div>
        <table className="w-full table-auto">
          <thead>
            <tr>
              <th className="text-left p-2">Agent</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            {demoAgents.map((agent) => (
              <tr key={agent.name} className="border-t">
                <td className="p-2">{agent.name}</td>
                <td className="p-2">
                  <Badge variant={
                    agent.status === 'running'
                      ? 'outline'
                      : agent.status === 'idle'
                      ? 'secondary'
                      : 'destructive'
                  }>{agent.status}</Badge>
                </td>
                <td className="p-2">{new Date(agent.lastUpdated).toLocaleTimeString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <table className="w-full table-auto">
      <thead>
        <tr>
          <th className="text-left p-2">Agent</th>
          <th className="text-left p-2">Status</th>
          <th className="text-left p-2">Last Updated</th>
        </tr>
      </thead>
      <tbody>
        {data!.map((agent) => (
          <tr key={agent.name} className="border-t">
            <td className="p-2">{agent.name}</td>
            <td className="p-2">
              <Badge variant={
                agent.status === 'running'
                  ? 'outline'
                  : agent.status === 'idle'
                  ? 'secondary'
                  : 'destructive'
              }>{agent.status}</Badge>
            </td>
            <td className="p-2">{new Date(agent.lastUpdated).toLocaleTimeString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
