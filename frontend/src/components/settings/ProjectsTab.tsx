'use client';

/**
 * Projects Settings Tab
 *
 * Allows founders to archive and delete their projects.
 *
 * @story US-F04, US-F05
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { FolderArchive, Trash2, AlertTriangle, Loader2, RotateCcw, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { useProjects } from '@/hooks/useProjects';

interface ImpactCounts {
  hypotheses: number;
  evidence: number;
  experiments: number;
  reports: number;
}

interface ProjectWithStatus {
  id: string;
  name: string;
  status: 'active' | 'archived';
}

export function ProjectsTab() {
  const [showArchived, setShowArchived] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [confirmName, setConfirmName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [impactCounts, setImpactCounts] = useState<ImpactCounts | null>(null);
  const [projectDetails, setProjectDetails] = useState<ProjectWithStatus | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const { projects, isLoading, archiveProject, unarchiveProject, deleteProject, refetch } = useProjects({
    includeArchived: showArchived,
  });

  // Fetch project details and impact counts when selection changes
  const fetchProjectDetails = useCallback(async (projectId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/projects/${projectId}`);
      if (response.ok) {
        const data = await response.json();
        setProjectDetails(data.project);
        setImpactCounts(data.impactCounts);
      }
    } catch {
      // Silently fail - counts will show as unknown
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    } else {
      setProjectDetails(null);
      setImpactCounts(null);
    }
  }, [selectedProjectId, fetchProjectDetails]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const isProjectArchived = projectDetails?.status === 'archived';

  const handleArchive = async () => {
    if (!selectedProjectId || !selectedProject) return;
    setIsArchiving(true);
    try {
      await archiveProject(selectedProjectId);
      toast.success(`"${selectedProject.clientName}" has been archived`);
      setSelectedProjectId(null);
    } catch {
      toast.error('Failed to archive project. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleUnarchive = async () => {
    if (!selectedProjectId || !selectedProject) return;
    setIsArchiving(true);
    try {
      await unarchiveProject(selectedProjectId);
      toast.success(`"${selectedProject.clientName}" has been restored`);
      setSelectedProjectId(null);
    } catch {
      toast.error('Failed to restore project. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedProjectId || !selectedProject) return;
    if (confirmName !== selectedProject.clientName) return;

    setIsDeleting(true);
    try {
      await deleteProject(selectedProjectId);
      toast.success(`"${selectedProject.clientName}" has been permanently deleted`);
      setSelectedProjectId(null);
      setConfirmName('');
      setDeleteDialogOpen(false);
      await refetch();
    } catch {
      toast.error('Failed to delete project. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const totalImpact = impactCounts
    ? impactCounts.hypotheses + impactCounts.evidence + impactCounts.experiments + impactCounts.reports
    : 0;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-48">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Project Management Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FolderArchive className="h-5 w-5" />
            <span>Project Management</span>
          </CardTitle>
          <CardDescription>
            Archive or restore your projects. Archived projects are hidden from your dashboard but can be restored anytime.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Show Archived Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="showArchived"
              checked={showArchived}
              onCheckedChange={(checked) => {
                setShowArchived(checked === true);
                setSelectedProjectId(null);
              }}
            />
            <Label htmlFor="showArchived" className="text-sm font-normal cursor-pointer">
              Show archived projects
            </Label>
          </div>

          {/* Project Selector */}
          <div className="space-y-2">
            <Label htmlFor="projectSelect">Select Project</Label>
            <Select
              value={selectedProjectId || ''}
              onValueChange={(value) => setSelectedProjectId(value || null)}
            >
              <SelectTrigger id="projectSelect">
                <SelectValue placeholder="Choose a project to manage..." />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No projects found
                  </div>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.clientName}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Archive/Restore Buttons */}
          {selectedProject && !isLoadingDetails && (
            <div className="flex items-center space-x-3">
              {isProjectArchived ? (
                <Button
                  variant="outline"
                  onClick={handleUnarchive}
                  disabled={isArchiving}
                  className="flex items-center"
                >
                  {isArchiving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RotateCcw className="mr-2 h-4 w-4" />
                  )}
                  Restore Project
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={handleArchive}
                  disabled={isArchiving}
                  className="flex items-center text-amber-600 border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                >
                  {isArchiving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="mr-2 h-4 w-4" />
                  )}
                  Archive Project
                </Button>
              )}
            </div>
          )}

          {selectedProject && isLoadingDetails && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading project details...</span>
            </div>
          )}

          {!selectedProject && projects.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Select a project above to archive or restore it.
            </p>
          )}

          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {showArchived
                ? "You don't have any projects yet."
                : "You don't have any active projects. Check \"Show archived projects\" to see archived ones."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Permanently delete a project and all its data. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedProject ? (
            <>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                <p className="font-medium text-red-800">
                  Deleting &quot;{selectedProject.clientName}&quot; will permanently remove:
                </p>
                {isLoadingDetails ? (
                  <div className="flex items-center space-x-2 text-red-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading impact summary...</span>
                  </div>
                ) : impactCounts ? (
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    <li><strong>{impactCounts.hypotheses}</strong> hypotheses</li>
                    <li><strong>{impactCounts.evidence}</strong> evidence records</li>
                    <li><strong>{impactCounts.experiments}</strong> experiments</li>
                    <li><strong>{impactCounts.reports}</strong> reports</li>
                    <li>All canvas data (VPC, BMC)</li>
                    <li>All AI validation states</li>
                  </ul>
                ) : (
                  <ul className="text-sm text-red-700 list-disc list-inside space-y-1">
                    <li>All hypotheses and validation data</li>
                    <li>All evidence and experiment results</li>
                    <li>All reports and analysis outputs</li>
                    <li>All canvas data (VPC, BMC)</li>
                    <li>All AI validation states</li>
                  </ul>
                )}
                {impactCounts && totalImpact > 0 && (
                  <p className="text-sm font-medium text-red-800 pt-2 border-t border-red-200">
                    Total: {totalImpact} records will be deleted
                  </p>
                )}
              </div>

              <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="flex items-center">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Forever
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center space-x-2 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Delete Project Permanently</span>
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild>
                      <div className="space-y-3">
                        <p>
                          This will permanently delete <strong>{selectedProject.clientName}</strong> and all
                          associated data. This action cannot be undone.
                        </p>
                        <div className="space-y-2">
                          <Label htmlFor="confirmDelete" className="text-foreground">
                            Type <strong>{selectedProject.clientName}</strong> to confirm:
                          </Label>
                          <Input
                            id="confirmDelete"
                            value={confirmName}
                            onChange={(e) => setConfirmName(e.target.value)}
                            placeholder="Enter project name..."
                            className="font-mono"
                          />
                        </div>
                      </div>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setConfirmName('')}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={confirmName !== selectedProject.clientName || isDeleting}
                      className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Forever
                        </>
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Select a project above to see deletion options.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
