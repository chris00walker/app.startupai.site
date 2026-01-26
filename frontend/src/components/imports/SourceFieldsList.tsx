/**
 * Source Fields List Component
 *
 * Displays the list of fields from imported data that can be mapped
 * to StartupAI schema fields.
 *
 * @story US-BI03
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Database, GripVertical } from 'lucide-react';

export interface SourceField {
  field: string;
  type: string;
  sample?: unknown;
  mapped?: boolean;
}

interface SourceFieldsListProps {
  fields: SourceField[];
  selectedField: string | null;
  onFieldSelect: (field: string) => void;
  maxHeight?: string;
}

function getTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'string':
    case 'text':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'number':
    case 'integer':
    case 'float':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'boolean':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
    case 'array':
    case 'list':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'object':
    case 'json':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  }
}

function formatSample(sample: unknown): string {
  if (sample === null || sample === undefined) return '';
  if (typeof sample === 'string') {
    return sample.length > 50 ? sample.substring(0, 50) + '...' : sample;
  }
  if (typeof sample === 'object') {
    const str = JSON.stringify(sample);
    return str.length > 50 ? str.substring(0, 50) + '...' : str;
  }
  return String(sample);
}

export function SourceFieldsList({
  fields,
  selectedField,
  onFieldSelect,
  maxHeight = '400px',
}: SourceFieldsListProps) {
  const unmappedFields = fields.filter((f) => !f.mapped);
  const mappedFields = fields.filter((f) => f.mapped);

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Database className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm">No source fields detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Source Fields</h4>
        <Badge variant="outline">
          {unmappedFields.length} unmapped / {fields.length} total
        </Badge>
      </div>

      <ScrollArea style={{ maxHeight }} className="pr-2">
        <div className="space-y-1">
          {unmappedFields.length > 0 && (
            <div className="space-y-1">
              {unmappedFields.map((field) => (
                <SourceFieldItem
                  key={field.field}
                  field={field}
                  isSelected={selectedField === field.field}
                  onClick={() => onFieldSelect(field.field)}
                />
              ))}
            </div>
          )}

          {mappedFields.length > 0 && (
            <>
              <div className="py-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  Mapped Fields
                </p>
              </div>
              <div className="space-y-1 opacity-60">
                {mappedFields.map((field) => (
                  <SourceFieldItem
                    key={field.field}
                    field={field}
                    isSelected={selectedField === field.field}
                    onClick={() => onFieldSelect(field.field)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function SourceFieldItem({
  field,
  isSelected,
  onClick,
}: {
  field: SourceField;
  isSelected: boolean;
  onClick: () => void;
}) {
  const sample = formatSample(field.sample);

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-2 py-2 rounded-md cursor-pointer transition-colors group',
        isSelected
          ? 'bg-primary/10 border border-primary/30'
          : 'hover:bg-muted/50',
        field.mapped && 'bg-muted/30'
      )}
      onClick={onClick}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{field.field}</p>
          <Badge className={cn('text-xs', getTypeColor(field.type))}>
            {field.type}
          </Badge>
          {field.mapped && (
            <Badge variant="secondary" className="text-xs">
              mapped
            </Badge>
          )}
        </div>
        {sample && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {sample}
          </p>
        )}
      </div>
    </div>
  );
}
