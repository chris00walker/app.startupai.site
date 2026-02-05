/**
 * Founder Profile Card
 *
 * Dashboard card showing founder profile completeness and quick edit.
 *
 * @story US-NL01
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { User, Pencil } from 'lucide-react';

interface FounderProfileCardProps {
  completeness: number;
  missingFields: string[];
  hasProfile: boolean;
  onEdit?: () => void;
}

const FIELD_LABELS: Record<string, string> = {
  professional_summary: 'Professional summary',
  domain_expertise: 'Domain expertise',
  previous_ventures: 'Previous ventures',
  linkedin_url: 'LinkedIn URL',
  company_website: 'Company website',
  years_experience: 'Years of experience',
};

export function FounderProfileCard({
  completeness,
  missingFields,
  hasProfile,
  onEdit,
}: FounderProfileCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Founder Profile</CardTitle>
          </div>
          <Badge variant={completeness === 100 ? 'default' : 'secondary'} className="text-xs">
            {completeness}% complete
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={completeness} className="h-2" />

        {!hasProfile ? (
          <p className="text-sm text-muted-foreground">
            Add your professional background to strengthen your Team slide.
          </p>
        ) : missingFields.length > 0 ? (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Missing:</p>
            <div className="flex flex-wrap gap-1">
              {missingFields.map(field => (
                <Badge key={field} variant="outline" className="text-xs">
                  {FIELD_LABELS[field] || field}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-green-600 dark:text-green-400">
            Profile complete. Your Team slide will be richly populated.
          </p>
        )}

        <Button variant="outline" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          {hasProfile ? 'Edit Profile' : 'Complete Profile'}
        </Button>
      </CardContent>
    </Card>
  );
}
