'use client';

/**
 * Admin Feature Flags Page
 *
 * Manage feature flag rollouts and A/B testing.
 *
 * @story US-A06
 */

import { useEffect, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { FeatureFlagEditor } from '@/components/admin/FeatureFlagEditor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Flag, Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import type { FeatureFlag } from '@/lib/types/admin';

export default function AdminFeaturesPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const fetchFlags = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/features');
      const data = await response.json();

      if (data.success) {
        setFlags(data.data.flags);
      }
    } catch (error) {
      console.error('Failed to fetch flags:', error);
      toast.error('Failed to load feature flags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const openEditDialog = (flag: FeatureFlag) => {
    setEditingFlag(flag);
    setEditorOpen(true);
  };

  const handleEditorClose = () => {
    setEditorOpen(false);
    setEditingFlag(null);
  };

  const getStatusBadge = (flag: FeatureFlag) => {
    if (flag.enabledGlobally) {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          Enabled
        </Badge>
      );
    }
    if (flag.percentageRollout > 0) {
      return (
        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
          {flag.percentageRollout}% Rollout
        </Badge>
      );
    }
    return <Badge variant="outline">Disabled</Badge>;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Feature Flags</h2>
            <p className="text-muted-foreground">
              Control feature rollouts and A/B testing
            </p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            Add Flag
          </Button>
        </div>

        {/* Flags Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : flags.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Flag className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="font-medium mb-2">No Feature Flags</h3>
              <p className="text-sm text-muted-foreground">
                Feature flags will appear here once created.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {flags.map((flag) => (
              <Card key={flag.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="h-4 w-4" />
                        {flag.name}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs mt-1">
                        {flag.key}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditDialog(flag)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {flag.description && (
                    <p className="text-sm text-muted-foreground">{flag.description}</p>
                  )}
                  <div className="flex items-center justify-between">
                    {getStatusBadge(flag)}
                    <span className="text-xs text-muted-foreground">
                      Updated{' '}
                      {formatDistanceToNow(new Date(flag.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                  {flag.targetUserIds && (
                    <p className="text-xs text-muted-foreground">
                      {flag.targetUserIds.split(',').length} targeted users
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <FeatureFlagEditor
          flag={editingFlag}
          open={editorOpen}
          onOpenChange={handleEditorClose}
          onSave={fetchFlags}
        />
      </div>
    </AdminLayout>
  );
}
