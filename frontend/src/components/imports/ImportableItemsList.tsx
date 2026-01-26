/**
 * Importable Items List Component
 *
 * Displays a selectable list of items from an external integration
 * that can be imported into StartupAI.
 *
 * @story US-BI01
 */

'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FileText,
  Table,
  Database,
  File,
  Image,
  Presentation,
} from 'lucide-react';

export interface ImportableItem {
  id: string;
  name: string;
  type: string;
  url?: string;
  lastModified?: string;
  metadata?: Record<string, unknown>;
}

interface ImportableItemsListProps {
  items: ImportableItem[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
  maxHeight?: string;
}

const typeIcons: Record<string, React.ReactNode> = {
  document: <FileText className="h-4 w-4" />,
  page: <FileText className="h-4 w-4" />,
  spreadsheet: <Table className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  table: <Table className="h-4 w-4" />,
  presentation: <Presentation className="h-4 w-4" />,
  image: <Image className="h-4 w-4" />,
  file: <File className="h-4 w-4" />,
};

export function ImportableItemsList({
  items,
  selectedIds,
  onSelectionChange,
  loading = false,
  maxHeight = '400px',
}: ImportableItemsListProps) {
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      onSelectionChange(items.map((item) => item.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleItemToggle = (itemId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, itemId]);
    } else {
      onSelectionChange(selectedIds.filter((id) => id !== itemId));
      setSelectAll(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <File className="h-12 w-12 mb-2 opacity-50" />
        <p>No importable items found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 px-2 py-1 border-b">
        <Checkbox
          id="select-all"
          checked={selectAll || selectedIds.length === items.length}
          onCheckedChange={handleSelectAll}
        />
        <label
          htmlFor="select-all"
          className="text-sm font-medium cursor-pointer"
        >
          Select all ({items.length} items)
        </label>
        {selectedIds.length > 0 && (
          <Badge variant="secondary" className="ml-auto">
            {selectedIds.length} selected
          </Badge>
        )}
      </div>

      <ScrollArea style={{ maxHeight }} className="pr-4">
        <div className="space-y-1">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const icon = typeIcons[item.type] || typeIcons.file;
            const modifiedDate = formatDate(item.lastModified);

            return (
              <div
                key={item.id}
                className={cn(
                  'flex items-center gap-3 px-2 py-2 rounded-md cursor-pointer transition-colors',
                  isSelected
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-muted/50'
                )}
                onClick={() => handleItemToggle(item.id, !isSelected)}
              >
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    handleItemToggle(item.id, checked as boolean)
                  }
                  onClick={(e) => e.stopPropagation()}
                />

                <div className="flex items-center gap-2 text-muted-foreground">
                  {icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-xs">
                      {item.type}
                    </Badge>
                    {modifiedDate && <span>Modified {modifiedDate}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
