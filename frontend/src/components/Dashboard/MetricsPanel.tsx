/**
 * @story US-CP06
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import { Badge } from '../ui/badge';

type Status = 'pending' | 'in_progress' | 'complete' | 'exception';

export const MetricsPanel: React.FC = () => {
  const { data, isLoading, error } = useQuery<Record<Status, number>>({
    queryKey: ['metrics', 'tasks'],
    queryFn: async () => {
      const response = await api.get('/metrics/tasks');
      return response?.data?.counts ?? ({} as Record<Status, number>);
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  if (isLoading) return <div>Loading metrics...</div>;
  if (error) return <div>Error loading metrics.</div>;

  const counts = data || {} as Record<Status, number>;
  const max = Math.max(...Object.values(counts), 1);
  const statuses: Status[] = ['pending', 'in_progress', 'complete', 'exception'];

  return (
    <div className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Task Metrics</h2>
      {statuses.map((status) => (
        <div key={status} className="mb-3">
          <div className="flex justify-between mb-1">
            <span className="capitalize">{status.replace('_', ' ')}</span>
            <Badge>{counts[status] || 0}</Badge>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div
              className="h-2 bg-blue-500 rounded-full"
              style={{ width: `${((counts[status] || 0) / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
