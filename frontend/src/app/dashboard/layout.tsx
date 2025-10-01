/**
 * Dashboard Layout (Protected)
 * 
 * Requires authentication. Redirects to login if not authenticated.
 * Includes navigation and user menu.
 */

import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth/actions';

// Force dynamic rendering for authentication
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Header */}
      <header className="border-b">
        <div className="flex h-16 items-center px-4 md:px-6">
          <div className="flex items-center gap-2 font-semibold">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>StartupAI</span>
          </div>

          <nav className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto py-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
