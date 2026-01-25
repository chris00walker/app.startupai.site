'use client';

/**
 * Integrity Check Panel Component
 *
 * Admin component to run data integrity checks on a user's data.
 *
 * @story US-A10
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  ShieldCheck,
  Loader2,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface IntegrityIssue {
  severity: 'error' | 'warning' | 'info';
  category: string;
  message: string;
  table?: string;
  recordId?: string;
  field?: string;
}

interface IntegrityCheckResult {
  userId: string;
  checksRun: number;
  issuesFound: IntegrityIssue[];
  status: 'passed' | 'issues_found' | 'failed';
  completedAt: string;
}

interface IntegrityCheckPanelProps {
  userId: string;
  userEmail: string;
}

const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/20',
  },
  info: {
    icon: Info,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
  },
};

export function IntegrityCheckPanel({ userId, userEmail }: IntegrityCheckPanelProps) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<IntegrityCheckResult | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/integrity`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setResult(data.data.result);
        setIsOpen(data.data.result.issuesFound.length > 0);

        if (data.data.result.status === 'passed') {
          toast.success('All integrity checks passed');
        } else {
          toast.warning(`Found ${data.data.result.issuesFound.length} issues`);
        }
      } else {
        toast.error(data.error?.message || 'Check failed');
      }
    } catch (error) {
      console.error('Integrity check error:', error);
      toast.error('Failed to run integrity check');
    } finally {
      setChecking(false);
    }
  };

  const getStatusBadge = () => {
    if (!result) return null;

    switch (result.status) {
      case 'passed':
        return (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
            <CheckCircle className="h-3 w-3 mr-1" />
            Passed
          </Badge>
        );
      case 'issues_found':
        return (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Issues Found
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
    }
  };

  return (
    <div className="border rounded-lg">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 mt-0.5 text-muted-foreground" />
          <div>
            <h4 className="font-medium">Data Integrity Check</h4>
            <p className="text-sm text-muted-foreground">
              Verify data consistency for {userEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <Button onClick={handleCheck} disabled={checking}>
            {checking ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            {checking ? 'Checking...' : 'Run Check'}
          </Button>
        </div>
      </div>

      {result && result.issuesFound.length > 0 && (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <button className="w-full px-4 py-2 border-t bg-muted/50 flex items-center justify-between hover:bg-muted/80 transition-colors">
              <span className="text-sm font-medium">
                {result.issuesFound.length} issue{result.issuesFound.length !== 1 ? 's' : ''} found
              </span>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-4 border-t space-y-2 max-h-80 overflow-y-auto">
              {result.issuesFound.map((issue, index) => {
                const config = SEVERITY_CONFIG[issue.severity];
                const Icon = config.icon;

                return (
                  <div
                    key={index}
                    className={`flex items-start gap-3 p-3 rounded-lg ${config.bg} border ${config.border}`}
                  >
                    <Icon className={`h-4 w-4 mt-0.5 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${config.color}`}>
                          {issue.category}
                        </span>
                        {issue.table && (
                          <Badge variant="outline" className="text-xs">
                            {issue.table}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm">{issue.message}</p>
                      {(issue.recordId || issue.field) && (
                        <p className="text-xs text-muted-foreground mt-1 font-mono">
                          {issue.recordId && `ID: ${issue.recordId}`}
                          {issue.recordId && issue.field && ' • '}
                          {issue.field && `Field: ${issue.field}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {result && result.issuesFound.length === 0 && result.status === 'passed' && (
        <div className="px-4 py-3 border-t bg-green-500/5 flex items-center gap-2 text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span className="text-sm">
            All {result.checksRun} checks passed successfully
          </span>
        </div>
      )}
    </div>
  );
}
