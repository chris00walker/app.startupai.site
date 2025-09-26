// TODO: implement Dashboard/KanbanBoard UI component
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';

// Simple card components for demo (replace with actual ShadCN UI when available)
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`border rounded-lg shadow-sm ${className || ''}`}>{children}</div>
);

const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`p-3 ${className || ''}`}>{children}</div>
);

const CardTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 className="text-sm font-medium">{children}</h3>
);

const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="px-3 pb-3 text-xs text-gray-600">{children}</div>
);

const Badge: React.FC<{ children: React.ReactNode; variant?: string }> = ({ children, variant }) => (
  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
    variant === 'outline' ? 'bg-gray-100 text-gray-800 border' : 'bg-blue-100 text-blue-800'
  }`}>
    {children}
  </span>
);

interface Task {
  _id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'complete' | 'exception';
  assignedAgent?: string;
}

export const KanbanBoard: React.FC<{ clientId: string }> = ({ clientId }) => {
  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['tasks', clientId],
    queryFn: async () => {
      const response = await api.get(`/clients/${clientId}/tasks`);
      return response?.data?.tasks ?? [];
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div>Loading tasks...</div>;
  
  // Show demo data when API is not available OR when no tasks are returned
  if (error || !tasks || tasks.length === 0) {
    // Demo data when API is not available
    const demoTasks: Task[] = [
      { _id: '1', title: 'Discovery Analysis', status: 'complete', assignedAgent: 'DiscoveryAgent' },
      { _id: '2', title: 'Market Validation', status: 'in_progress', assignedAgent: 'ValidationAgent' },
      { _id: '3', title: 'Scale Planning', status: 'pending', assignedAgent: 'ScaleAgent' },
      { _id: '4', title: 'Risk Assessment', status: 'exception', assignedAgent: 'RiskAgent' },
    ];
    
    const columns = ['pending', 'in_progress', 'complete', 'exception'] as const;
    const tasksByStatus = columns.reduce((acc, status) => {
      acc[status] = demoTasks.filter(t => t.status === status);
      return acc;
    }, {} as Record<typeof columns[number], Task[]>);

    return (
      <div>
        <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded mb-4 text-sm">
          Demo Mode: Showing sample tasks (backend not connected)
        </div>
        <div className="grid grid-cols-4 gap-4">
          {columns.map(status => (
            <div key={status}>
              <h3 className="font-semibold mb-2 capitalize">
                {status.replace('_', ' ')}
              </h3>
              {tasksByStatus[status].map(task => (
                <Card key={task._id} className="mb-2">
                  <CardHeader className="flex justify-between items-center">
                    <CardTitle>{task.title}</CardTitle>
                    <Badge variant="outline">{task.status}</Badge>
                  </CardHeader>
                  <CardContent>
                    Assigned: {task.assignedAgent || 'Unassigned'}
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const columns = ['pending', 'in_progress', 'complete', 'exception'] as const;
  const tasksByStatus = columns.reduce((acc, status) => {
    acc[status] = tasks.filter(t => t.status === status);
    return acc;
  }, {} as Record<typeof columns[number], Task[]>);

  return (
    <div className="grid grid-cols-4 gap-4">
      {columns.map(status => (
        <div key={status}>
          <h3 className="font-semibold mb-2 capitalize">
            {status.replace('_', ' ')}
          </h3>
          {tasksByStatus[status].map(task => (
            <Card key={task._id} className="mb-2">
              <CardHeader className="flex justify-between items-center">
                <CardTitle>{task.title}</CardTitle>
                <Badge variant="outline">{task.status}</Badge>
              </CardHeader>
              <CardContent>
                Assigned: {task.assignedAgent || 'Unassigned'}
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </div>
  );
};
