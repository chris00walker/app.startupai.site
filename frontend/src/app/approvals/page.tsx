/**
 * Approvals Dashboard Page
 *
 * Displays pending approval requests for the current user.
 * Includes separate sections for own approvals and client approvals (consultants).
 *
 * @story US-F03, US-C04, US-H01, US-H02, US-H04, US-H05, US-H06, US-H07, US-H08, US-H09
 */

'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Users, Clock, CheckCircle } from 'lucide-react';
import {
  ApprovalList,
  ApprovalDetailModal,
} from '@/components/approvals';
import { useApprovals } from '@/hooks/useApprovals';
import type { ApprovalRequest } from '@/types/crewai';

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch approvals based on active tab
  const {
    approvals,
    clientApprovals,
    pendingCount,
    isLoading,
    error,
    refetch,
    approve,
    reject,
  } = useApprovals(activeTab);

  const handleSelectApproval = (approval: ApprovalRequest) => {
    setSelectedApproval(approval);
    setIsModalOpen(true);
  };

  const handleApprove = async (id: string, decision?: string, feedback?: string) => {
    const success = await approve(id, decision, feedback);
    if (success) {
      setIsModalOpen(false);
      setSelectedApproval(null);
    }
    return success;
  };

  const handleReject = async (id: string, feedback?: string) => {
    const success = await reject(id, feedback);
    if (success) {
      setIsModalOpen(false);
      setSelectedApproval(null);
    }
    return success;
  };

  // Count pending in each category
  const ownPendingCount = approvals.filter((a) => a.status === 'pending').length;
  const clientPendingCount = clientApprovals.filter((a) => a.status === 'pending').length;
  const hasClientApprovals = clientApprovals.length > 0;

  return (
    <DashboardLayout
      breadcrumbs={[
        { title: 'Dashboard', href: '/' },
        { title: 'Approvals' },
      ]}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Approvals</h1>
              <p className="text-muted-foreground">
                Review and approve AI-generated recommendations
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              {pendingCount} pending
            </Badge>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Pending</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ownPendingCount}</div>
              <p className="text-xs text-muted-foreground">
                approvals awaiting your decision
              </p>
            </CardContent>
          </Card>

          {hasClientApprovals && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Client Pending</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientPendingCount}</div>
                <p className="text-xs text-muted-foreground">
                  client approvals you can review
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Processed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {approvals.filter((a) => a.status !== 'pending').length +
                  clientApprovals.filter((a) => a.status !== 'pending').length}
              </div>
              <p className="text-xs text-muted-foreground">
                decisions made
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Approvals Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'pending' | 'all')}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              {ownPendingCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {ownPendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">All History</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-6">
            {/* Your Approvals */}
            <Card>
              <CardHeader>
                <CardTitle>Your Approvals</CardTitle>
                <CardDescription>
                  AI recommendations requiring your decision
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">
                    Error loading approvals: {error.message}
                  </div>
                ) : (
                  <ApprovalList
                    approvals={approvals.filter((a) => a.status === 'pending')}
                    onSelectApproval={handleSelectApproval}
                    onRefresh={refetch}
                    isLoading={isLoading}
                    emptyMessage="You're all caught up! No pending approvals."
                  />
                )}
              </CardContent>
            </Card>

            {/* Client Approvals (for consultants) */}
            {hasClientApprovals && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>Client Approvals</CardTitle>
                      <CardDescription>
                        Review approvals on behalf of your clients
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : (
                    <ApprovalList
                      approvals={clientApprovals.filter((a) => a.status === 'pending')}
                      onSelectApproval={handleSelectApproval}
                      onRefresh={refetch}
                      isLoading={isLoading}
                      emptyMessage="No pending client approvals."
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all">
            <Card>
              <CardHeader>
                <CardTitle>Approval History</CardTitle>
                <CardDescription>
                  All approvals including completed decisions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : error ? (
                  <div className="text-center py-8 text-red-500">
                    Error loading approvals: {error.message}
                  </div>
                ) : (
                  <ApprovalList
                    approvals={[...approvals, ...clientApprovals]}
                    onSelectApproval={handleSelectApproval}
                    onRefresh={refetch}
                    isLoading={isLoading}
                    emptyMessage="No approval history yet."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Approval Detail Modal */}
      <ApprovalDetailModal
        approval={selectedApproval}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </DashboardLayout>
  );
}
