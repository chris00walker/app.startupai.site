/**
 * Field Mapping Editor Component
 *
 * Two-column interface for mapping source fields to StartupAI schema fields.
 * Supports drag-and-drop mapping and transform configuration.
 *
 * @story US-BI03
 */

'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SourceFieldsList, type SourceField } from './SourceFieldsList';
import {
  TargetFieldsList,
  DEFAULT_TARGET_FIELDS,
  type TargetField,
  type TargetSection,
} from './TargetFieldsList';
import { ArrowRight, Link2, Unlink, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FieldMapping {
  sourceField: string;
  targetSection: TargetSection;
  targetField: string;
  transform?: string;
}

interface FieldMappingEditorProps {
  sourceFields: SourceField[];
  mappings: FieldMapping[];
  onMappingsChange: (mappings: FieldMapping[]) => void;
  onApply?: () => void;
  loading?: boolean;
}

const TRANSFORMS = [
  { value: '', label: 'No transform' },
  { value: 'toString', label: 'To String' },
  { value: 'toNumber', label: 'To Number' },
  { value: 'toBoolean', label: 'To Boolean' },
  { value: 'toArray', label: 'To Array' },
  { value: 'join', label: 'Join (array to string)' },
  { value: 'split', label: 'Split (string to array)' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'trim', label: 'Trim whitespace' },
];

export function FieldMappingEditor({
  sourceFields,
  mappings,
  onMappingsChange,
  onApply,
  loading = false,
}: FieldMappingEditorProps) {
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<{
    section: TargetSection;
    field: string;
  } | null>(null);

  // Compute which source fields are mapped
  const sourceFieldsWithMapping = sourceFields.map((sf) => ({
    ...sf,
    mapped: mappings.some((m) => m.sourceField === sf.field),
  }));

  // Compute which target fields are mapped
  const targetFieldsWithMapping = DEFAULT_TARGET_FIELDS.map((tf) => {
    const mapping = mappings.find(
      (m) => m.targetSection === tf.section && m.targetField === tf.field
    );
    return {
      ...tf,
      mapped: !!mapping,
      mappedFrom: mapping?.sourceField,
    };
  });

  const handleSourceSelect = useCallback((field: string) => {
    setSelectedSource((prev) => (prev === field ? null : field));
  }, []);

  const handleTargetSelect = useCallback(
    (section: TargetSection, field: string) => {
      setSelectedTarget((prev) =>
        prev?.section === section && prev?.field === field
          ? null
          : { section, field }
      );
    },
    []
  );

  const handleCreateMapping = useCallback(() => {
    if (!selectedSource || !selectedTarget) return;

    // Check if mapping already exists
    const existingIndex = mappings.findIndex(
      (m) =>
        m.targetSection === selectedTarget.section &&
        m.targetField === selectedTarget.field
    );

    const newMapping: FieldMapping = {
      sourceField: selectedSource,
      targetSection: selectedTarget.section,
      targetField: selectedTarget.field,
    };

    if (existingIndex >= 0) {
      // Replace existing mapping
      const newMappings = [...mappings];
      newMappings[existingIndex] = newMapping;
      onMappingsChange(newMappings);
    } else {
      // Add new mapping
      onMappingsChange([...mappings, newMapping]);
    }

    // Clear selection
    setSelectedSource(null);
    setSelectedTarget(null);
  }, [selectedSource, selectedTarget, mappings, onMappingsChange]);

  const handleRemoveMapping = useCallback(
    (index: number) => {
      const newMappings = mappings.filter((_, i) => i !== index);
      onMappingsChange(newMappings);
    },
    [mappings, onMappingsChange]
  );

  const handleTransformChange = useCallback(
    (index: number, transform: string) => {
      const newMappings = [...mappings];
      newMappings[index] = {
        ...newMappings[index],
        transform: transform || undefined,
      };
      onMappingsChange(newMappings);
    },
    [mappings, onMappingsChange]
  );

  const canCreateMapping = selectedSource && selectedTarget;

  return (
    <div className="space-y-6">
      {/* Mapping Interface */}
      <div className="grid grid-cols-[1fr,auto,1fr] gap-4">
        {/* Source Fields */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">Source Data</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <SourceFieldsList
              fields={sourceFieldsWithMapping}
              selectedField={selectedSource}
              onFieldSelect={handleSourceSelect}
              maxHeight="350px"
            />
          </CardContent>
        </Card>

        {/* Connection Button */}
        <div className="flex flex-col items-center justify-center gap-2">
          <Button
            variant={canCreateMapping ? 'default' : 'outline'}
            size="icon"
            disabled={!canCreateMapping}
            onClick={handleCreateMapping}
            className="rounded-full h-12 w-12"
          >
            <Link2 className="h-5 w-5" />
          </Button>
          {canCreateMapping && (
            <span className="text-xs text-muted-foreground text-center">
              Click to map
            </span>
          )}
        </div>

        {/* Target Fields */}
        <Card>
          <CardHeader className="py-3">
            <CardTitle className="text-sm">StartupAI Schema</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <TargetFieldsList
              fields={targetFieldsWithMapping}
              selectedField={selectedTarget}
              onFieldSelect={handleTargetSelect}
              maxHeight="350px"
            />
          </CardContent>
        </Card>
      </div>

      {/* Current Mappings */}
      {mappings.length > 0 && (
        <Card>
          <CardHeader className="py-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">
                Field Mappings ({mappings.length})
              </CardTitle>
              {onApply && (
                <Button size="sm" onClick={onApply} disabled={loading}>
                  <Wand2 className="h-4 w-4 mr-1" />
                  Apply Mappings
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2">
              {mappings.map((mapping, index) => (
                <div
                  key={`${mapping.sourceField}-${mapping.targetSection}-${mapping.targetField}`}
                  className="flex items-center gap-3 p-2 bg-muted/30 rounded-md"
                >
                  <Badge variant="outline" className="font-mono">
                    {mapping.sourceField}
                  </Badge>

                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

                  <Badge
                    className={cn(
                      'shrink-0',
                      mapping.targetSection === 'vpc' && 'bg-blue-500',
                      mapping.targetSection === 'bmc' && 'bg-green-500',
                      mapping.targetSection === 'evidence' && 'bg-purple-500',
                      mapping.targetSection === 'project' && 'bg-orange-500'
                    )}
                  >
                    {mapping.targetSection}.{mapping.targetField}
                  </Badge>

                  <Select
                    value={mapping.transform || ''}
                    onValueChange={(value) => handleTransformChange(index, value)}
                  >
                    <SelectTrigger className="w-[140px] h-8 text-xs">
                      <SelectValue placeholder="Transform" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSFORMS.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 ml-auto shrink-0"
                    onClick={() => handleRemoveMapping(index)}
                  >
                    <Unlink className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {mappings.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>Select a source field and a target field, then click the link button to create a mapping.</p>
        </div>
      )}
    </div>
  );
}
