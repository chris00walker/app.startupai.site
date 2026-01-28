/**
 * @story US-F02
 */
/**
 * AgentStatus Component
 *
 * Displays real-time status of the 6 AI Founders in the StartupAI system.
 * Polls the /api/agents/status endpoint for workflow progress.
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Brain,
  Hammer,
  TrendingUp,
  Compass,
  Shield,
  Calculator,
  Loader2,
  CheckCircle,
  Circle,
  AlertCircle,
} from 'lucide-react';

interface AgentInfo {
  id: string;
  name: string;
  title: string;
  role: string;
  status: 'running' | 'idle' | 'completed' | 'error';
  lastUpdated: string;
  currentTask?: string;
}

interface AgentStatusResponse {
  success: boolean;
  data: {
    agents: AgentInfo[];
    timestamp: string;
  };
}

// Map founder IDs to icons
const founderIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  sage: Brain,
  forge: Hammer,
  pulse: TrendingUp,
  compass: Compass,
  guardian: Shield,
  ledger: Calculator,
};

// Map founder IDs to colors
const founderColors: Record<string, string> = {
  sage: 'text-blue-600',
  forge: 'text-orange-600',
  pulse: 'text-pink-600',
  compass: 'text-purple-600',
  guardian: 'text-green-600',
  ledger: 'text-yellow-600',
};

function getStatusIcon(status: AgentInfo['status']) {
  switch (status) {
    case 'running':
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-500" />;
    default:
      return <Circle className="h-4 w-4 text-gray-300" />;
  }
}

function getStatusBadgeVariant(status: AgentInfo['status']): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case 'running':
      return 'default';
    case 'completed':
      return 'outline';
    case 'error':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export const AgentStatus: React.FC = () => {
  const { data, isLoading, error } = useQuery<AgentStatusResponse>({
    queryKey: ['agentsStatus'],
    queryFn: async () => {
      const response = await fetch('/api/agents/status');
      if (!response.ok) throw new Error('Failed to fetch agent status');
      return response.json();
    },
    refetchInterval: 5000, // Poll every 5 seconds
    retry: 1,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
          <span className="text-gray-500">Loading AI Founders status...</span>
        </CardContent>
      </Card>
    );
  }

  if (error || !data?.success) {
    return (
      <Card className="border-amber-200">
        <CardContent className="py-4">
          <p className="text-sm text-amber-600">
            Unable to connect to agent status service. The AI Founders are operating in the background.
          </p>
        </CardContent>
      </Card>
    );
  }

  const agents = data.data.agents;
  const hasRunningAgents = agents.some(a => a.status === 'running');

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">AI Founders Team</CardTitle>
          {hasRunningAgents && (
            <Badge variant="default" className="animate-pulse">
              Processing
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {agents.map((agent) => {
            const Icon = founderIcons[agent.id] || Brain;
            const colorClass = founderColors[agent.id] || 'text-gray-600';

            return (
              <div
                key={agent.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  agent.status === 'running'
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
                    : 'bg-gray-50 dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full bg-white dark:bg-gray-800 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{agent.name}</span>
                      <span className="text-xs text-gray-500">({agent.title})</span>
                    </div>
                    <p className="text-xs text-gray-500">{agent.role}</p>
                    {agent.currentTask && (
                      <p className="text-xs text-blue-600 mt-1 truncate max-w-[200px]">
                        {agent.currentTask}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(agent.status)}
                  <Badge variant={getStatusBadgeVariant(agent.status)} className="text-xs">
                    {agent.status}
                  </Badge>
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Last updated: {new Date(data.data.timestamp).toLocaleTimeString()}
        </p>
      </CardContent>
    </Card>
  );
};
