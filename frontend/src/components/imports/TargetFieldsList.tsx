/**
 * Target Fields List Component
 *
 * Displays the StartupAI schema fields that source fields can be mapped to.
 * Organized by section: VPC, BMC, Evidence, Project.
 *
 * @story US-BI03
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { Target, Check } from 'lucide-react';

export type TargetSection = 'vpc' | 'bmc' | 'evidence' | 'project';

export interface TargetField {
  section: TargetSection;
  field: string;
  label: string;
  description?: string;
  mapped?: boolean;
  mappedFrom?: string;
}

interface TargetFieldsListProps {
  fields: TargetField[];
  selectedField: { section: TargetSection; field: string } | null;
  onFieldSelect: (section: TargetSection, field: string) => void;
  maxHeight?: string;
}

const SECTION_CONFIG: Record<
  TargetSection,
  { label: string; color: string; description: string }
> = {
  vpc: {
    label: 'Value Proposition Canvas',
    color: 'bg-blue-500',
    description: 'Customer jobs, pains, gains, and value proposition elements',
  },
  bmc: {
    label: 'Business Model Canvas',
    color: 'bg-green-500',
    description: 'Business model building blocks',
  },
  evidence: {
    label: 'Evidence',
    color: 'bg-purple-500',
    description: 'Validation evidence and insights',
  },
  project: {
    label: 'Project',
    color: 'bg-orange-500',
    description: 'Basic project information',
  },
};

/**
 * Default target fields for StartupAI schema
 */
export const DEFAULT_TARGET_FIELDS: TargetField[] = [
  // VPC Fields
  { section: 'vpc', field: 'jobs', label: 'Customer Jobs', description: 'Tasks customers are trying to accomplish' },
  { section: 'vpc', field: 'pains', label: 'Pains', description: 'Customer frustrations and obstacles' },
  { section: 'vpc', field: 'gains', label: 'Gains', description: 'Outcomes customers want to achieve' },
  { section: 'vpc', field: 'productsAndServices', label: 'Products & Services', description: 'What you offer' },
  { section: 'vpc', field: 'painRelievers', label: 'Pain Relievers', description: 'How you alleviate pains' },
  { section: 'vpc', field: 'gainCreators', label: 'Gain Creators', description: 'How you create gains' },

  // BMC Fields
  { section: 'bmc', field: 'customerSegments', label: 'Customer Segments', description: 'Who you serve' },
  { section: 'bmc', field: 'valuePropositions', label: 'Value Propositions', description: 'What value you deliver' },
  { section: 'bmc', field: 'channels', label: 'Channels', description: 'How you reach customers' },
  { section: 'bmc', field: 'customerRelationships', label: 'Customer Relationships', description: 'How you interact' },
  { section: 'bmc', field: 'revenueStreams', label: 'Revenue Streams', description: 'How you earn money' },
  { section: 'bmc', field: 'keyResources', label: 'Key Resources', description: 'What you need' },
  { section: 'bmc', field: 'keyActivities', label: 'Key Activities', description: 'What you do' },
  { section: 'bmc', field: 'keyPartnerships', label: 'Key Partnerships', description: 'Who helps you' },
  { section: 'bmc', field: 'costStructure', label: 'Cost Structure', description: 'What you spend' },

  // Evidence Fields
  { section: 'evidence', field: 'category', label: 'Category', description: 'Evidence type category' },
  { section: 'evidence', field: 'summary', label: 'Summary', description: 'Evidence summary' },
  { section: 'evidence', field: 'strength', label: 'Strength', description: 'Evidence strength level' },
  { section: 'evidence', field: 'fit_type', label: 'Fit Type', description: 'Problem-solution or product-market fit' },

  // Project Fields
  { section: 'project', field: 'name', label: 'Project Name', description: 'Name of the project' },
  { section: 'project', field: 'description', label: 'Description', description: 'Project description' },
  { section: 'project', field: 'rawIdea', label: 'Raw Idea', description: 'Original business idea' },
  { section: 'project', field: 'hints', label: 'Hints', description: 'Additional context and hints' },
];

export function TargetFieldsList({
  fields,
  selectedField,
  onFieldSelect,
  maxHeight = '400px',
}: TargetFieldsListProps) {
  // Group fields by section
  const fieldsBySection = fields.reduce(
    (acc, field) => {
      if (!acc[field.section]) {
        acc[field.section] = [];
      }
      acc[field.section].push(field);
      return acc;
    },
    {} as Record<TargetSection, TargetField[]>
  );

  const sections: TargetSection[] = ['vpc', 'bmc', 'evidence', 'project'];

  const getMappedCount = (section: TargetSection) => {
    return fieldsBySection[section]?.filter((f) => f.mapped).length || 0;
  };

  const getTotalCount = (section: TargetSection) => {
    return fieldsBySection[section]?.length || 0;
  };

  if (fields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Target className="h-12 w-12 mb-2 opacity-50" />
        <p className="text-sm">No target fields configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Target Fields</h4>
        <Badge variant="outline">
          {fields.filter((f) => f.mapped).length} mapped / {fields.length} total
        </Badge>
      </div>

      <ScrollArea style={{ maxHeight }} className="pr-2">
        <Accordion type="multiple" defaultValue={sections} className="space-y-2">
          {sections.map((section) => {
            const config = SECTION_CONFIG[section];
            const sectionFields = fieldsBySection[section] || [];
            const mappedCount = getMappedCount(section);
            const totalCount = getTotalCount(section);

            if (sectionFields.length === 0) return null;

            return (
              <AccordionItem
                key={section}
                value={section}
                className="border rounded-lg overflow-hidden"
              >
                <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50">
                  <div className="flex items-center gap-2 flex-1">
                    <div className={cn('w-2 h-2 rounded-full', config.color)} />
                    <span className="font-medium text-sm">{config.label}</span>
                    <Badge variant="outline" className="ml-auto mr-2 text-xs">
                      {mappedCount}/{totalCount}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-1 pb-1">
                  <div className="space-y-1">
                    {sectionFields.map((field) => (
                      <TargetFieldItem
                        key={`${field.section}-${field.field}`}
                        field={field}
                        isSelected={
                          selectedField?.section === field.section &&
                          selectedField?.field === field.field
                        }
                        onClick={() => onFieldSelect(field.section, field.field)}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </ScrollArea>
    </div>
  );
}

function TargetFieldItem({
  field,
  isSelected,
  onClick,
}: {
  field: TargetField;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors',
        isSelected
          ? 'bg-primary/10 border border-primary/30'
          : 'hover:bg-muted/50',
        field.mapped && 'bg-muted/30'
      )}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{field.label}</p>
          {field.mapped && (
            <Check className="h-3 w-3 text-green-500" />
          )}
        </div>
        {field.description && (
          <p className="text-xs text-muted-foreground">{field.description}</p>
        )}
        {field.mappedFrom && (
          <p className="text-xs text-primary mt-0.5">
            Mapped from: {field.mappedFrom}
          </p>
        )}
      </div>
    </div>
  );
}
