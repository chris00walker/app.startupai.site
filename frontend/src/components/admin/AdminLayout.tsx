'use client';

/**
 * Admin Layout Component
 *
 * Provides the admin dashboard layout with sidebar navigation.
 * Automatically verifies admin role and redirects non-admins.
 *
 * @story US-A11
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, LogOut } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { createClient } from '@/lib/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AdminNav } from '@/components/admin/AdminNav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);

  useEffect(() => {
    async function checkAdminRole() {
      const supabase = createClient();

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login?redirect=/admin');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role, email')
        .eq('id', user.id)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        router.push('/dashboard?error=unauthorized');
        return;
      }

      setIsAdmin(true);
      setAdminEmail(profile.email);
    }

    checkAdminRole();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Show loading state while checking admin role
  if (isAdmin === null) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="space-y-4 text-center">
          <Shield className="mx-auto h-12 w-12 animate-pulse text-muted-foreground" />
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-2 py-3">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">Admin Panel</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <AdminNav currentPath={pathname ?? '/admin'} />
        </SidebarContent>

        <SidebarSeparator />

        <SidebarFooter>
          <div className="px-2 py-2 text-xs text-muted-foreground">
            Signed in as
            <br />
            <span className="font-medium text-foreground">{adminEmail}</span>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
          <SidebarTrigger />
          <div className="flex-1">
            <h1 className="text-lg font-semibold">StartupAI Admin</h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
