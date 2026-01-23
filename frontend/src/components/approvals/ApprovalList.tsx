/**
 * ApprovalList Component
 *
 * Renders a list of ApprovalCard components with filtering and sorting.
 *
 * @story US-F03, US-H01, US-H02, US-H04, US-H05, US-H06, US-H07, US-H08, US-H09
 */

'use client';

import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Inbox,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { ApprovalCard } from './ApprovalCard';
import type { ApprovalRequest, ApprovalType, OwnerRole } from '@/types/crewai';

interface ApprovalListProps {
  approvals: ApprovalRequest[];
  onSelectApproval: (approval: ApprovalRequest) => void;
  showProject?: boolean;
  isLoading?: boolean;
  onRefresh?: () => void;
  className?: string;
  emptyMessage?: string;
}

type SortField = 'expires_at' | 'created_at' | 'title';
type SortDirection = 'asc' | 'desc';

export function ApprovalList({
  approvals,
  onSelectApproval,
  showProject = true,
  isLoading = false,
  onRefresh,
  className,
  emptyMessage = 'No approvals to display',
}: ApprovalListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('expires_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<ApprovalType | 'all'>('all');
  const [filterOwner, setFilterOwner] = useState<OwnerRole | 'all'>('all');

  // Get unique types and owners for filter options
  const { availableTypes, availableOwners } = useMemo(() => {
    const types = new Set<ApprovalType>();
    const owners = new Set<OwnerRole>();
    approvals.forEach((a) => {
      types.add(a.approval_type as ApprovalType);
      owners.add(a.owner_role as OwnerRole);
    });
    return {
      availableTypes: Array.from(types),
      availableOwners: Array.from(owners),
    };
  }, [approvals]);

  // Filter and sort approvals
  const filteredApprovals = useMemo(() => {
    let result = [...approvals];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.description.toLowerCase().includes(query) ||
          a.project?.name.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      result = result.filter((a) => a.approval_type === filterType);
    }

    // Owner filter
    if (filterOwner !== 'all') {
      result = result.filter((a) => a.owner_role === filterOwner);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      switch (sortField) {
        case 'expires_at':
          aVal = new Date(a.expires_at).getTime();
          bVal = new Date(b.expires_at).getTime();
          break;
        case 'created_at':
          aVal = new Date(a.created_at).getTime();
          bVal = new Date(b.created_at).getTime();
          break;
        case 'title':
          aVal = a.title.toLowerCase();
          bVal = b.title.toLowerCase();
          break;
        default:
          return 0;
      }

      if (sortDirection === 'asc') {
        return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
        return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
      }
    });

    return result;
  }, [approvals, searchQuery, sortField, sortDirection, filterType, filterOwner]);

  const toggleSortDirection = () => {
    setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
  };

  // Empty state
  if (approvals.length === 0 && !isLoading) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12', className)}>
        <div className="rounded-full bg-muted p-4 mb-4">
          <Inbox className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">No Pending Approvals</h3>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          {emptyMessage}
        </p>
        {onRefresh && (
          <Button variant="outline" className="mt-4 gap-2" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search approvals..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {availableTypes.length > 1 && (
            <Select
              value={filterType}
              onValueChange={(v) => setFilterType(v as ApprovalType | 'all')}
            >
              <SelectTrigger className="w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Sort */}
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="expires_at">Expires</SelectItem>
              <SelectItem value="created_at">Created</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={toggleSortDirection}>
            {sortDirection === 'asc' ? (
              <SortAsc className="h-4 w-4" />
            ) : (
              <SortDesc className="h-4 w-4" />
            )}
          </Button>

          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {filteredApprovals.length} of {approvals.length}
        </Badge>
        {searchQuery && (
          <span className="text-sm text-muted-foreground">
            matching &quot;{searchQuery}&quot;
          </span>
        )}
      </div>

      {/* Approval Cards */}
      <div className="space-y-3">
        {filteredApprovals.map((approval) => (
          <ApprovalCard
            key={approval.id}
            approval={approval}
            onClick={() => onSelectApproval(approval)}
            showProject={showProject}
          />
        ))}
      </div>

      {/* No Results */}
      {filteredApprovals.length === 0 && approvals.length > 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No approvals match your filters</p>
          <Button
            variant="link"
            onClick={() => {
              setSearchQuery('');
              setFilterType('all');
              setFilterOwner('all');
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}

export default ApprovalList;
