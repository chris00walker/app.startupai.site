'use client';

/**
 * Admin Ad Platforms Page
 *
 * Dashboard for managing StartupAI's ad platform connections.
 * Allows admins to connect, monitor, and manage ad platform credentials.
 *
 * @story US-AM01, US-AM02, US-AM03, US-AM04, US-AM05, US-AM06, US-AM07
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  MoreHorizontal,
  Activity,
  Settings,
  Trash2,
  Pencil,
  Pause,
  Play,
  RefreshCw,
  Loader2,
  Shield,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import { PlatformConnectModal } from '@/components/admin/PlatformConnectModal';
import { AdPlatformHealth } from '@/components/admin/AdPlatformHealth';
import type { AdPlatform, AdPlatformStatus } from '@/db/schema';

interface PlatformConnection {
  id: string;
  platform: AdPlatform;
  accountId: string;
  accountName: string | null;
  businessManagerId: string | null;
  status: AdPlatformStatus;
  lastHealthCheck: string | null;
  lastSuccessfulCall: string | null;
  errorMessage: string | null;
  errorCode: string | null;
  rateLimitRemaining: string | null;
  rateLimitResetAt: string | null;
  tokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface AggregateSpend {
  totalBudgetAllocated: number;
  totalSpent: number;
  activeFounders: number;
  activeCampaigns: number;
  byPlatform: Record<AdPlatform, { allocated: number; spent: number; campaigns: number }>;
}

const PLATFORM_NAMES: Record<AdPlatform, string> = {
  meta: 'Meta (Facebook/Instagram)',
  google: 'Google Ads',
  tiktok: 'TikTok Ads',
  linkedin: 'LinkedIn Ads',
  x: 'X (Twitter) Ads',
  pinterest: 'Pinterest Ads',
};

const STATUS_BADGES: Record<AdPlatformStatus, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  active: { variant: 'default', label: 'Active' },
  paused: { variant: 'secondary', label: 'Paused' },
  error: { variant: 'destructive', label: 'Error' },
  expired: { variant: 'outline', label: 'Expired' },
};

export default function AdminAdPlatformsPage() {
  const router = useRouter();
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [aggregateSpend, setAggregateSpend] = useState<AggregateSpend | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<PlatformConnection | null>(null);
  const [deletingPlatform, setDeletingPlatform] = useState<PlatformConnection | null>(null);
  const [activeTab, setActiveTab] = useState('connections');

  const fetchConnections = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/ad-platforms');
      if (!response.ok) {
        if (response.status === 403) {
          router.push('/login?error=unauthorized');
          return;
        }
        throw new Error('Failed to fetch connections');
      }
      const data = await response.json();
      setConnections(data.connections || []);
      setAggregateSpend(data.aggregateSpend || null);
    } catch (error) {
      console.error('Failed to fetch platform connections:', error);
      toast.error('Failed to load platform connections');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handlePauseResume = async (connection: PlatformConnection) => {
    const newStatus = connection.status === 'active' ? 'paused' : 'active';
    try {
      const response = await fetch(`/api/admin/ad-platforms/${connection.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      toast.success(`Platform ${newStatus === 'active' ? 'resumed' : 'paused'}`);
      fetchConnections();
    } catch (error) {
      toast.error('Failed to update platform status');
    }
  };

  const handleDelete = async () => {
    if (!deletingPlatform) return;

    try {
      const response = await fetch(`/api/admin/ad-platforms/${deletingPlatform.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete connection');

      toast.success('Platform connection deleted');
      setDeletingPlatform(null);
      fetchConnections();
    } catch (error) {
      toast.error('Failed to delete platform connection');
    }
  };

  const handleHealthCheck = async (connectionId: string) => {
    try {
      const response = await fetch(`/api/admin/ad-platforms/${connectionId}/health`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Health check failed');

      toast.success('Health check completed');
      fetchConnections();
    } catch (error) {
      toast.error('Health check failed');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ad Platform Management</h1>
            <p className="text-muted-foreground">
              Manage StartupAI&apos;s connections to advertising platforms
            </p>
          </div>
          <Button onClick={() => setIsConnectModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Connect Platform
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Connected Platforms</CardDescription>
              <CardTitle className="text-3xl">{connections.length}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Founders</CardDescription>
              <CardTitle className="text-3xl">{aggregateSpend?.activeFounders || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Active Campaigns</CardDescription>
              <CardTitle className="text-3xl">{aggregateSpend?.activeCampaigns || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Ad Spend</CardDescription>
              <CardTitle className="text-3xl">
                ${(aggregateSpend?.totalSpent || 0).toLocaleString()}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="connections" className="gap-2">
              <Settings className="h-4 w-4" />
              Connections
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <Activity className="h-4 w-4" />
              Health Status
            </TabsTrigger>
            <TabsTrigger value="spend" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Spend Overview
            </TabsTrigger>
          </TabsList>

          {/* Connections Tab */}
          <TabsContent value="connections" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Platform Connections</CardTitle>
                <CardDescription>
                  Manage API credentials and account connections for each ad platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                {connections.length === 0 ? (
                  <div className="text-center py-12">
                    <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No Platforms Connected</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect your first ad platform to enable automated campaign management.
                    </p>
                    <Button onClick={() => setIsConnectModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Connect Platform
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Platform</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Last Check</TableHead>
                        <TableHead>Token Expires</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {connections.map((connection) => (
                        <TableRow key={connection.id}>
                          <TableCell className="font-medium">
                            {PLATFORM_NAMES[connection.platform]}
                          </TableCell>
                          <TableCell>
                            <div>
                              <div>{connection.accountName || connection.accountId}</div>
                              {connection.accountName && (
                                <div className="text-xs text-muted-foreground">
                                  {connection.accountId}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={STATUS_BADGES[connection.status].variant}>
                              {STATUS_BADGES[connection.status].label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {connection.lastHealthCheck
                              ? formatDistanceToNow(new Date(connection.lastHealthCheck), {
                                  addSuffix: true,
                                })
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            {connection.tokenExpiresAt
                              ? format(new Date(connection.tokenExpiresAt), 'MMM d, yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingPlatform(connection);
                                    setIsConnectModalOpen(true);
                                  }}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit Credentials
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleHealthCheck(connection.id)}>
                                  <RefreshCw className="h-4 w-4 mr-2" />
                                  Run Health Check
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePauseResume(connection)}>
                                  {connection.status === 'active' ? (
                                    <>
                                      <Pause className="h-4 w-4 mr-2" />
                                      Pause
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4 mr-2" />
                                      Resume
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeletingPlatform(connection)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="mt-4">
            <AdPlatformHealth
              connections={connections}
              onRefresh={fetchConnections}
              onHealthCheck={handleHealthCheck}
            />
          </TabsContent>

          {/* Spend Tab */}
          <TabsContent value="spend" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Aggregate Spend Overview</CardTitle>
                <CardDescription>
                  View total ad spend across all founders and platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                {aggregateSpend ? (
                  <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Total Budget Allocated</CardDescription>
                          <CardTitle className="text-2xl text-green-600">
                            ${aggregateSpend.totalBudgetAllocated.toLocaleString()}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardDescription>Total Spent</CardDescription>
                          <CardTitle className="text-2xl">
                            ${aggregateSpend.totalSpent.toLocaleString()}
                          </CardTitle>
                        </CardHeader>
                      </Card>
                    </div>

                    {Object.keys(aggregateSpend.byPlatform).length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3">Spend by Platform</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Platform</TableHead>
                              <TableHead className="text-right">Allocated</TableHead>
                              <TableHead className="text-right">Spent</TableHead>
                              <TableHead className="text-right">Campaigns</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Object.entries(aggregateSpend.byPlatform).map(([platform, data]) => (
                              <TableRow key={platform}>
                                <TableCell>{PLATFORM_NAMES[platform as AdPlatform]}</TableCell>
                                <TableCell className="text-right">
                                  ${data.allocated.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">
                                  ${data.spent.toLocaleString()}
                                </TableCell>
                                <TableCell className="text-right">{data.campaigns}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No spend data available
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Connect Modal */}
        <PlatformConnectModal
          open={isConnectModalOpen}
          onOpenChange={(open) => {
            setIsConnectModalOpen(open);
            if (!open) setEditingPlatform(null);
          }}
          onSuccess={fetchConnections}
          editingPlatform={editingPlatform}
        />

        {/* Delete Confirmation */}
        <AlertDialog open={!!deletingPlatform} onOpenChange={() => setDeletingPlatform(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Platform Connection</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the connection to{' '}
                {deletingPlatform && PLATFORM_NAMES[deletingPlatform.platform]}? This action cannot
                be undone and will affect all campaigns using this connection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
