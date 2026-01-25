'use client';

/**
 * Admin Failed Workflows Page
 *
 * View and retry failed CrewAI workflows.
 *
 * @story US-A04
 */

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { WorkflowRetryDialog, type FailedWorkflow } from '@/components/admin/WorkflowRetryDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw,
  AlertTriangle,
  Play,
  Clock,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

export default function AdminWorkflowsPage() {
  const [workflows, setWorkflows] = useState<FailedWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<FailedWorkflow | null>(null);

  const fetchWorkflows = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/workflows?limit=50');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch workflows');
      }

      if (data.success && data.data?.workflows) {
        const transformedWorkflows: FailedWorkflow[] = data.data.workflows.map((w: {
          id: string;
          runId: string;
          userId: string;
          userEmail: string;
          projectId: string;
          projectName: string;
          status: string;
          phase: string | number;
          crew: string | null;
          errorMessage: string | null;
          failedAt: string;
        }) => ({
          id: w.id,
          runId: w.runId,
          userId: w.userId,
          userEmail: w.userEmail,
          projectId: w.projectId,
          projectName: w.projectName,
          runStatus: w.status,
          phase: typeof w.phase === 'number' ? w.phase : parseInt(w.phase) || 0,
          crewName: w.crew,
          errorMessage: w.errorMessage,
          failedAt: w.failedAt,
          retryCount: 0, // Would need to track in separate table
        }));

        setWorkflows(transformedWorkflows);
      }
    } catch (error) {
      console.error('Failed to fetch workflows:', error);
      toast.error('Failed to load workflows');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const handleRetryClick = (workflow: FailedWorkflow) => {
    setSelectedWorkflow(workflow);
    setRetryDialogOpen(true);
  };

  const handleRetrySuccess = () => {
    // Refresh the list after a short delay
    setTimeout(fetchWorkflows, 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'timeout':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            Timeout
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Failed Workflows</h2>
            <p className="text-muted-foreground">
              View and retry failed CrewAI validation workflows
            </p>
          </div>
          <Button variant="outline" onClick={fetchWorkflows}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Failed</CardDescription>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <CardTitle className="text-3xl text-red-500">{workflows.length}</CardTitle>
              )}
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Last 24 Hours</CardDescription>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <CardTitle className="text-3xl">
                  {
                    workflows.filter(
                      (w) =>
                        new Date(w.failedAt).getTime() >
                        Date.now() - 24 * 60 * 60 * 1000
                    ).length
                  }
                </CardTitle>
              )}
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Unique Users Affected</CardDescription>
              {loading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <CardTitle className="text-3xl">
                  {new Set(workflows.map((w) => w.userId)).size}
                </CardTitle>
              )}
            </CardHeader>
          </Card>
        </div>

        {/* Workflows Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Failed Workflows
            </CardTitle>
            <CardDescription>
              Click retry to attempt running the workflow again
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : workflows.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500 opacity-50" />
                <h3 className="font-medium mb-2">No Failed Workflows</h3>
                <p className="text-sm">All workflows are running successfully</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Phase</TableHead>
                    <TableHead>Crew</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Failed</TableHead>
                    <TableHead className="w-20"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workflows.map((workflow) => (
                    <TableRow key={workflow.id}>
                      <TableCell>
                        <div className="text-sm">{workflow.userEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{workflow.projectName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Phase {workflow.phase}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {workflow.crewName || '-'}
                      </TableCell>
                      <TableCell>{getStatusBadge(workflow.runStatus)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(workflow.failedAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleRetryClick(workflow)}
                          disabled={retryingId === workflow.id}
                        >
                          {retryingId === workflow.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Retry Dialog */}
        <WorkflowRetryDialog
          workflow={selectedWorkflow}
          open={retryDialogOpen}
          onOpenChange={setRetryDialogOpen}
          onRetrySuccess={handleRetrySuccess}
        />
      </div>
    </AdminLayout>
  );
}
