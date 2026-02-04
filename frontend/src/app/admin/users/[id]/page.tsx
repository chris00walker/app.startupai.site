'use client';

/**
 * Admin User Profile Page
 *
 * View detailed user profile with options to change role and view activity.
 *
 * @story US-A02, US-A08
 */

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { RoleChangeDialog } from '@/components/admin/RoleChangeDialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
  ArrowLeft,
  User,
  Mail,
  Building,
  Calendar,
  Shield,
  Briefcase,
  Activity,
  Clock,
  Eye,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import type { AdminUserProfile } from '@/lib/types/admin';
import { DataExportPanel } from '@/components/admin/DataExportPanel';
import { IntegrityCheckPanel } from '@/components/admin/IntegrityCheckPanel';
import { BillingActionsPanel } from '@/components/admin/BillingActionsPanel';

const ROLE_BADGES: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
  admin: { variant: 'destructive', label: 'Admin' },
  founder: { variant: 'default', label: 'Founder' },
  consultant: { variant: 'secondary', label: 'Consultant' },
  trial: { variant: 'outline', label: 'Trial' },
};

export default function AdminUserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<AdminUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(`/api/admin/users/${userId}`);
        const data = await response.json();

        if (data.success) {
          setUser(data.data.user);
        } else {
          console.error('Failed to fetch user:', data.error);
          toast.error(data.error?.message || 'Failed to load user');
        }
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, [userId]);

  const handleRoleChanged = (newRole: string) => {
    setUser((prev) => (prev ? { ...prev, role: newRole as AdminUserProfile['role'] } : null));
  };

  const handleImpersonate = async () => {
    setImpersonating(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/impersonate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin support debugging' }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(`Now viewing as ${user?.email}`);
        // Navigate to dashboard to view as user
        router.push('/dashboard');
      } else {
        toast.error(data.error?.message || 'Failed to start impersonation');
      }
    } catch (error) {
      console.error('Impersonation error:', error);
      toast.error('Failed to start impersonation');
    } finally {
      setImpersonating(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">User Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The user you're looking for doesn't exist or you don't have access.
          </p>
          <Button asChild variant="outline">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Back Link */}
        <Button asChild variant="ghost" className="-ml-4">
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Link>
        </Button>

        {/* User Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              {user.fullName || 'Unnamed User'}
            </h2>
            <p className="text-muted-foreground flex items-center gap-2 mt-1">
              <Mail className="h-4 w-4" />
              {user.email}
            </p>
          </div>
          <Badge
            variant={ROLE_BADGES[user.role]?.variant || 'outline'}
            className="text-sm"
          >
            {ROLE_BADGES[user.role]?.label || user.role}
          </Badge>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="projects">Projects ({user.projects.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="actions">Admin Actions</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4 mt-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Full Name
                      </label>
                      <p className="mt-1">{user.fullName || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Company
                      </label>
                      <p className="mt-1 flex items-center gap-1">
                        {user.company ? (
                          <>
                            <Building className="h-4 w-4" />
                            {user.company}
                          </>
                        ) : (
                          '-'
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Timezone
                      </label>
                      <p className="mt-1">{user.timezone || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Language
                      </label>
                      <p className="mt-1">{user.language || '-'}</p>
                    </div>
                  </div>
                  {user.bio && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Bio
                      </label>
                      <p className="mt-1 text-sm">{user.bio}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Subscription Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Tier
                      </label>
                      <p className="mt-1 capitalize">{user.subscriptionTier}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Status
                      </label>
                      <p className="mt-1 capitalize">{user.subscriptionStatus || '-'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Plan Status
                      </label>
                      <p className="mt-1 capitalize">{user.planStatus}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Trial Intent
                      </label>
                      <p className="mt-1">{user.trialIntent || '-'}</p>
                    </div>
                  </div>
                  {user.trialExpiresAt && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Trial Expires
                      </label>
                      <p className="mt-1 flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {format(new Date(user.trialExpiresAt), 'PPP')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dates */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Account Dates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Created
                      </label>
                      <p className="mt-1">{format(new Date(user.createdAt), 'PPP')}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Last Updated
                      </label>
                      <p className="mt-1">{format(new Date(user.updatedAt), 'PPP')}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* IDs */}
              <Card>
                <CardHeader>
                  <CardTitle>Internal IDs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        User ID
                      </label>
                      <p className="mt-1 font-mono text-sm">{user.id}</p>
                    </div>
                    {user.consultantId && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">
                          Consultant ID
                        </label>
                        <p className="mt-1 font-mono text-sm">{user.consultantId}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>User Projects</CardTitle>
                <CardDescription>Projects owned by this user</CardDescription>
              </CardHeader>
              <CardContent>
                {user.projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No projects found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stage</TableHead>
                        <TableHead>Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {user.projects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell className="font-medium">{project.name}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{project.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {project.validationStage || '-'}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDistanceToNow(new Date(project.createdAt), {
                              addSuffix: true,
                            })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Security events and account activity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.recentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent activity</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {user.recentActivity.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 border-l-2 border-muted pl-4 py-2"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {activity.type}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin Actions Tab */}
          <TabsContent value="actions" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Admin Actions
                </CardTitle>
                <CardDescription>
                  Actions you can take on this user account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Role Change */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Change Role</h4>
                    <p className="text-sm text-muted-foreground">
                      Current role: {ROLE_BADGES[user.role]?.label || user.role}
                    </p>
                  </div>
                  <Button onClick={() => setRoleDialogOpen(true)}>
                    Change Role
                  </Button>
                </div>

                {/* Impersonate User */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    <div>
                      <h4 className="font-medium">Impersonate User</h4>
                      <p className="text-sm text-muted-foreground">
                        View the app as this user (read-only mode)
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={handleImpersonate}
                    disabled={impersonating || user.role === 'admin'}
                    variant={user.role === 'admin' ? 'outline' : 'default'}
                  >
                    {impersonating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Eye className="h-4 w-4 mr-2" />
                    )}
                    {user.role === 'admin' ? 'Cannot Impersonate Admin' : 'View as User'}
                  </Button>
                </div>

                {/* Data Export */}
                <DataExportPanel userId={user.id} userEmail={user.email} />

                {/* Integrity Check */}
                <IntegrityCheckPanel userId={user.id} userEmail={user.email} />

                {/* Billing Management */}
                <BillingActionsPanel userId={user.id} userEmail={user.email} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Role Change Dialog */}
        <RoleChangeDialog
          userId={user.id}
          userEmail={user.email}
          currentRole={user.role}
          open={roleDialogOpen}
          onOpenChange={setRoleDialogOpen}
          onRoleChanged={handleRoleChanged}
        />
      </div>
    </AdminLayout>
  );
}
