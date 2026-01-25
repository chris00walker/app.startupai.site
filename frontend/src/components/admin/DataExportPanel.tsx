'use client';

/**
 * Data Export Panel Component
 *
 * Admin component to export user data in JSON format.
 *
 * @story US-A09
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2, FileJson, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface DataExportPanelProps {
  userId: string;
  userEmail: string;
}

type ExportType = 'full' | 'projects' | 'activity';

export function DataExportPanel({ userId, userEmail }: DataExportPanelProps) {
  const [exportType, setExportType] = useState<ExportType>('full');
  const [exporting, setExporting] = useState(false);
  const [exportResult, setExportResult] = useState<'success' | 'error' | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setExportResult(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exportType }),
      });

      const data = await response.json();

      if (data.success) {
        // Create downloadable file
        const blob = new Blob([JSON.stringify(data.data.export, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `user-export-${userId}-${exportType}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExportResult('success');
        toast.success('Export downloaded successfully');
      } else {
        setExportResult('error');
        toast.error(data.error?.message || 'Export failed');
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportResult('error');
      toast.error('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-start gap-3">
        <FileJson className="h-5 w-5 mt-0.5 text-muted-foreground" />
        <div>
          <h4 className="font-medium">Export User Data</h4>
          <p className="text-sm text-muted-foreground">
            Download data for {userEmail}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Select
          value={exportType}
          onValueChange={(v) => setExportType(v as ExportType)}
          disabled={exporting}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Export</SelectItem>
            <SelectItem value="projects">Projects Only</SelectItem>
            <SelectItem value="activity">Activity Only</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : exportResult === 'success' ? (
            <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
          ) : exportResult === 'error' ? (
            <AlertCircle className="h-4 w-4 mr-2 text-red-500" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          {exporting ? 'Exporting...' : 'Export'}
        </Button>
      </div>
    </div>
  );
}
