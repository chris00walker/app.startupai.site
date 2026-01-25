'use client';

/**
 * Admin Navigation Component
 *
 * Sidebar navigation for the admin dashboard.
 *
 * @story US-A11
 */

import Link from 'next/link';
import {
  Users,
  LayoutDashboard,
  Activity,
  Flag,
  ScrollText,
  Megaphone,
  Settings,
} from 'lucide-react';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface AdminNavGroup {
  group: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_ITEMS: AdminNavGroup[] = [
  {
    group: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    ],
  },
  {
    group: 'User Management',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
    ],
  },
  {
    group: 'Operations',
    items: [
      { label: 'System Health', href: '/admin/health', icon: Activity },
      { label: 'Workflows', href: '/admin/workflows', icon: Settings },
      { label: 'Feature Flags', href: '/admin/features', icon: Flag },
    ],
  },
  {
    group: 'Advertising',
    items: [
      { label: 'Ad Platforms', href: '/admin/ad-platforms', icon: Megaphone },
    ],
  },
  {
    group: 'Audit & Compliance',
    items: [
      { label: 'Audit Logs', href: '/admin/audit', icon: ScrollText },
    ],
  },
];

interface AdminNavProps {
  currentPath: string;
}

export function AdminNav({ currentPath }: AdminNavProps) {
  return (
    <>
      {ADMIN_NAV_ITEMS.map((group) => (
        <SidebarGroup key={group.group}>
          <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {group.items.map((item) => {
                const isActive = currentPath === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                      <Link href={item.href}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </>
  );
}
