'use client';

/**
 * Audit Log Filters Component
 *
 * Filter controls for the audit logs table.
 *
 * @story US-A07
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Filter } from 'lucide-react';
import { ADMIN_ACTION_TYPES } from '@/db/schema/admin-audit-log';

export interface AuditLogFiltersState {
  actionType: string;
  dateFrom: string;
  dateTo: string;
}

interface AuditLogFiltersProps {
  filters: AuditLogFiltersState;
  onFilterChange: (filters: Partial<AuditLogFiltersState>) => void;
  onClear: () => void;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
  user_search: 'User Search',
  user_view: 'User View',
  user_impersonate: 'Impersonation',
  user_impersonate_end: 'End Impersonation',
  user_role_change: 'Role Change',
  workflow_retry: 'Workflow Retry',
  feature_flag_create: 'Flag Create',
  feature_flag_update: 'Flag Update',
  data_export_start: 'Data Export',
  integrity_check_run: 'Integrity Check',
  admin_login: 'Admin Login',
  billing_retry: 'Billing Retry',
  billing_refund: 'Billing Refund',
  billing_credit: 'Billing Credit',
  ad_platform_connect: 'Ad Connect',
  ad_platform_update: 'Ad Update',
};

export function AuditLogFilters({
  filters,
  onFilterChange,
  onClear,
}: AuditLogFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Filter className="h-4 w-4" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Action Type</label>
            <Select
              value={filters.actionType}
              onValueChange={(value) => onFilterChange({ actionType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All actions</SelectItem>
                {Object.entries(ADMIN_ACTION_TYPES).map(([key, value]) => (
                  <SelectItem key={value} value={value}>
                    {ACTION_TYPE_LABELS[value] || value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">From Date</label>
            <Input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => onFilterChange({ dateFrom: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">To Date</label>
            <Input
              type="date"
              value={filters.dateTo}
              onChange={(e) => onFilterChange({ dateTo: e.target.value })}
            />
          </div>
          <div className="flex items-end">
            <Button variant="outline" onClick={onClear}>
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
