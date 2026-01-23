/**
 * Gate Evaluation Redirect
 *
 * @story US-H06, US-H07, US-H08
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProjects } from '@/hooks/useProjects';
import { Card, CardContent } from '@/components/ui/card';

/**
 * Dynamic Gate Route Handler
 * 
 * Redirects /project/current/gate to /project/[currentProjectId]/gate
 * This allows the sidebar to have a consistent link while supporting multiple projects
 */
export default function CurrentProjectGatePage() {
  const router = useRouter();
  const { projects, isLoading, error } = useProjects();

  useEffect(() => {
    if (!isLoading && !error && projects.length > 0) {
      // Get the current project (first project for now)
      const currentProject = projects[0];
      
      // Redirect to the specific project gate page
      router.replace(`/project/${currentProject.id}/gate`);
    }
  }, [projects, isLoading, error, router]);

  // Show loading state while redirecting
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading gate evaluation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h2 className="text-lg font-semibold mb-2">Error Loading Projects</h2>
              <p className="text-muted-foreground mb-4">{error.message}</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Try Again
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show no projects state
  if (projects.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <h2 className="text-lg font-semibold mb-2">No Projects Found</h2>
              <p className="text-muted-foreground mb-4">
                Create a project to access gate evaluation.
              </p>
              <a 
                href="/projects/new"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Create Project
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // This should not be reached due to the redirect, but just in case
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Redirecting to gate evaluation...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
