'use client';

/**
 * Admin Audit Logs Page
 *
 * View all admin actions with filtering and search.
 *
 * @story US-A07
 */

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AuditLogFilters, type AuditLogFiltersState } from '@/components/admin/AuditLogFilters';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollText, Eye, RefreshCw, Clock } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import type { AdminAuditLogEntry } from '@/lib/types/admin';

const ACTION_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  user_search: { label: 'User Search', color: 'bg-blue-500/10 text-blue-500' },
  user_view: { label: 'User View', color: 'bg-blue-500/10 text-blue-500' },
  user_impersonate: { label: 'Impersonation', color: 'bg-yellow-500/10 text-yellow-500' },
  user_impersonate_end: { label: 'End Impersonation', color: 'bg-yellow-500/10 text-yellow-500' },
  user_role_change: { label: 'Role Change', color: 'bg-purple-500/10 text-purple-500' },
  workflow_retry: { label: 'Workflow Retry', color: 'bg-green-500/10 text-green-500' },
  feature_flag_create: { label: 'Flag Create', color: 'bg-cyan-500/10 text-cyan-500' },
  feature_flag_update: { label: 'Flag Update', color: 'bg-cyan-500/10 text-cyan-500' },
  data_export_start: { label: 'Data Export', color: 'bg-orange-500/10 text-orange-500' },
  admin_login: { label: 'Admin Login', color: 'bg-gray-500/10 text-gray-500' },
  ad_platform_connect: { label: 'Ad Connect', color: 'bg-pink-500/10 text-pink-500' },
  ad_platform_update: { label: 'Ad Update', color: 'bg-pink-500/10 text-pink-500' },
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AdminAuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AuditLogFiltersState>({
    actionType: '',
    dateFrom: '',
    dateTo: '',
  });
  const [selectedLog, setSelectedLog] = useState<AdminAuditLogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);

    try {
      const params = new URLSearchParams();
      if (filters.actionType && filters.actionType !== 'all') params.set('actionType', filters.actionType);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      params.set('limit', '100');

      const response = await fetch(`/api/admin/audit?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setLogs(data.data.logs);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilterChange = (newFilters: Partial<AuditLogFiltersState>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const clearFilters = () => {
    setFilters({ actionType: '', dateFrom: '', dateTo: '' });
  };

  const getActionBadge = (type: string) => {
    const config = ACTION_TYPE_LABELS[type] || { label: type, color: 'bg-gray-500/10 text-gray-500' };
    return (
      <Badge variant="outline" className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
            <p className="text-muted-foreground">
              Track all admin actions across the platform
            </p>
          </div>
          <Button variant="outline" onClick={fetchLogs}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <AuditLogFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClear={clearFilters}
        />

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScrollText className="h-5 w-5" />
              Audit Log Entries
            </CardTitle>
            <CardDescription>
              {total > 0 ? `${total} entries found` : 'No entries found'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <h3 className="font-medium mb-2">No Audit Logs</h3>
                <p className="text-sm">
                  Admin actions will be logged here as they occur.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(log.createdAt), {
                            addSuffix: true,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{log.adminEmail}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {getActionBadge(log.actionType)}
                          {log.actionDescription && (
                            <div className="text-xs text-muted-foreground">
                              {log.actionDescription.slice(0, 50)}
                              {log.actionDescription.length > 50 ? '...' : ''}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {log.targetUserEmail ? (
                          <div className="text-sm">{log.targetUserEmail}</div>
                        ) : log.targetResourceType ? (
                          <div className="text-sm text-muted-foreground">
                            {log.targetResourceType}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Detail Dialog */}
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Audit Log Details</DialogTitle>
              <DialogDescription>
                {selectedLog && format(new Date(selectedLog.createdAt), 'PPpp')}
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Admin
                    </label>
                    <p className="mt-1">{selectedLog.adminEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Action Type
                    </label>
                    <p className="mt-1">{getActionBadge(selectedLog.actionType)}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Description
                    </label>
                    <p className="mt-1">{selectedLog.actionDescription || '-'}</p>
                  </div>
                  {selectedLog.targetUserEmail && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Target User
                      </label>
                      <p className="mt-1">{selectedLog.targetUserEmail}</p>
                    </div>
                  )}
                  {selectedLog.targetResourceType && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Resource
                      </label>
                      <p className="mt-1">
                        {selectedLog.targetResourceType}
                        {selectedLog.targetResourceId && (
                          <span className="text-muted-foreground ml-1">
                            ({selectedLog.targetResourceId.slice(0, 8)}...)
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                  {selectedLog.reason && (
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Reason
                      </label>
                      <p className="mt-1">{selectedLog.reason}</p>
                    </div>
                  )}
                  {selectedLog.ipAddress && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        IP Address
                      </label>
                      <p className="mt-1 font-mono text-sm">{selectedLog.ipAddress}</p>
                    </div>
                  )}
                </div>

                {(selectedLog.oldValue || selectedLog.newValue) && (
                  <div className="grid grid-cols-2 gap-4 border-t pt-4">
                    {selectedLog.oldValue && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Old Value
                        </label>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(selectedLog.oldValue, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.newValue && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          New Value
                        </label>
                        <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                          {JSON.stringify(selectedLog.newValue, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
