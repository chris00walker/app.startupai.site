'use client';

/**
 * User Search Form Component
 *
 * Reusable search form for finding users by email, name, role, or project ID.
 *
 * @story US-A01
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Loader2 } from 'lucide-react';

export interface UserSearchFilters {
  email: string;
  name: string;
  role: string;
  projectId: string;
}

interface UserSearchFormProps {
  onSearch: (filters: UserSearchFilters) => void;
  onClear: () => void;
  loading?: boolean;
}

export function UserSearchForm({ onSearch, onClear, loading = false }: UserSearchFormProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<string>('');
  const [projectId, setProjectId] = useState('');

  const handleSearch = () => {
    onSearch({ email, name, role, projectId });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setEmail('');
    setName('');
    setRole('');
    setProjectId('');
    onClear();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Search Users
        </CardTitle>
        <CardDescription>
          Search by email, name, role, or project ID
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Email</label>
            <Input
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Name</label>
            <Input
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="All roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="founder">Founder</SelectItem>
                <SelectItem value="consultant">Consultant</SelectItem>
                <SelectItem value="trial">Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Project ID</label>
            <Input
              placeholder="UUID"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Search
          </Button>
          <Button variant="outline" onClick={handleClear}>
            Clear
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
