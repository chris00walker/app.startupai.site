/**
 * Import Dialog Component
 *
 * Modal dialog for importing data from external integrations.
 * Handles the complete import flow: listing items, selection, and import.
 *
 * @story US-BI01
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ImportableItemsList, type ImportableItem } from './ImportableItemsList';
import { AlertCircle, Download, Loader2 } from 'lucide-react';
import type { IntegrationType } from '@/types/integrations';

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  integrationType: IntegrationType;
  integrationName: string;
  projectId: string;
  onImportComplete?: (results: ImportResult[]) => void;
}

interface ImportResult {
  sourceId: string;
  sourceName: string;
  success: boolean;
  importId?: string;
  error?: string;
}

type ImportStep = 'loading' | 'select' | 'importing' | 'complete' | 'error';

export function ImportDialog({
  open,
  onOpenChange,
  integrationType,
  integrationName,
  projectId,
  onImportComplete,
}: ImportDialogProps) {
  const [step, setStep] = useState<ImportStep>('loading');
  const [items, setItems] = useState<ImportableItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ImportResult[]>([]);

  const fetchItems = useCallback(async () => {
    setStep('loading');
    setError(null);

    try {
      const response = await fetch(`/api/imports/${integrationType}/items`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch items');
      }

      setItems(data.items || []);
      setStep('select');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('error');
    }
  }, [integrationType]);

  useEffect(() => {
    if (open) {
      fetchItems();
      setSelectedIds([]);
      setResults([]);
    }
  }, [open, fetchItems]);

  const handleImport = async () => {
    if (selectedIds.length === 0) return;

    setStep('importing');
    setError(null);

    try {
      const selectedItems = items.filter((item) =>
        selectedIds.includes(item.id)
      );

      const response = await fetch(`/api/imports/${integrationType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          items: selectedItems.map((item) => ({
            id: item.id,
            name: item.name,
            type: item.type,
            url: item.url,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Import failed');
      }

      setResults(data.results || []);
      setStep('complete');
      onImportComplete?.(data.results || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStep('error');
    }
  };

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Import from {integrationName}
          </DialogTitle>
          <DialogDescription>
            {step === 'loading' && `Loading items from ${integrationName}...`}
            {step === 'select' &&
              `Select items to import into your project. ${items.length} items available.`}
            {step === 'importing' && 'Importing selected items...'}
            {step === 'complete' && 'Import completed.'}
            {step === 'error' && 'An error occurred.'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {step === 'loading' && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {step === 'select' && (
            <ImportableItemsList
              items={items}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Importing {selectedIds.length} items...
              </p>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  Successfully imported {successCount} of {results.length} items.
                  {failCount > 0 && ` ${failCount} items failed.`}
                </AlertDescription>
              </Alert>

              {failCount > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Failed items:
                  </p>
                  {results
                    .filter((r) => !r.success)
                    .map((r) => (
                      <div
                        key={r.sourceId}
                        className="text-sm text-muted-foreground"
                      >
                        {r.sourceName}: {r.error}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {step === 'error' && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          {step === 'select' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedIds.length === 0}
              >
                Import {selectedIds.length > 0 && `(${selectedIds.length})`}
              </Button>
            </>
          )}

          {step === 'complete' && (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}

          {step === 'error' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={fetchItems}>Retry</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
