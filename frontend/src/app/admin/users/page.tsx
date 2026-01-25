'use client';

/**
 * Admin User Search Page
 *
 * Search and browse user accounts by email, name, role, or project ID.
 *
 * @story US-A01
 */

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { UserSearchForm, type UserSearchFilters } from '@/components/admin/UserSearchForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { AdminUserSearchResult } from '@/lib/types/admin';

const ROLE_BADGES: Record<string, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
  admin: { variant: 'destructive', label: 'Admin' },
  founder: { variant: 'default', label: 'Founder' },
  consultant: { variant: 'secondary', label: 'Consultant' },
  trial: { variant: 'outline', label: 'Trial' },
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserSearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async (filters: UserSearchFilters) => {
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams();
      if (filters.email) params.set('email', filters.email);
      if (filters.name) params.set('name', filters.name);
      if (filters.role && filters.role !== 'all') params.set('role', filters.role);
      if (filters.projectId) params.set('projectId', filters.projectId);
      params.set('limit', '50');

      const response = await fetch(`/api/admin/users?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users);
        setTotal(data.pagination?.total || 0);
      } else {
        console.error('Search failed:', data.error);
        setUsers([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Search error:', error);
      setUsers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClear = () => {
    setUsers([]);
    setSearched(false);
    setTotal(0);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
          <p className="text-muted-foreground">
            Search and manage user accounts across the platform.
          </p>
        </div>

        {/* Search Filters */}
        <UserSearchForm
          onSearch={handleSearch}
          onClear={handleClear}
          loading={loading}
        />

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>
              {searched
                ? `Results (${total} user${total === 1 ? '' : 's'})`
                : 'Search Results'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : !searched ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Enter search criteria above to find users</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No users found matching your criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.fullName || 'No name'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.email}
                          </div>
                          {user.company && (
                            <div className="text-xs text-muted-foreground">
                              {user.company}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={ROLE_BADGES[user.role]?.variant || 'outline'}>
                          {ROLE_BADGES[user.role]?.label || user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {user.subscriptionTier}
                          {user.subscriptionStatus && (
                            <span className="text-muted-foreground ml-1">
                              ({user.subscriptionStatus})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(user.createdAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/admin/users/${user.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
