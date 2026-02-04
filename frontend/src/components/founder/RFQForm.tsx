/**
 * RFQForm Component
 *
 * Form for founders to create Request for Quote posts.
 *
 * @story US-FM07
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Send, Info } from 'lucide-react';
import { RELATIONSHIP_TYPES, type RelationshipType } from '@/components/consultant/InviteClientModal';
import { trackMarketplaceEvent } from '@/lib/analytics';

const TIMELINES = [
  { value: '1_month', label: '1 month' },
  { value: '3_months', label: '3 months' },
  { value: '6_months', label: '6 months' },
  { value: 'flexible', label: 'Flexible' },
];

const BUDGETS = [
  { value: 'equity_only', label: 'Equity only' },
  { value: 'under_5k', label: 'Under $5K' },
  { value: '5k_25k', label: '$5K - $25K' },
  { value: '25k_100k', label: '$25K - $100K' },
  { value: 'over_100k', label: 'Over $100K' },
];

const STAGES = [
  { value: 'seed', label: 'Seed' },
  { value: 'series_a', label: 'Series A' },
  { value: 'series_b', label: 'Series B' },
  { value: 'growth', label: 'Growth' },
];

export function RFQForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('advisory');
  const [industries, setIndustries] = useState<string[]>([]);
  const [stagePreference, setStagePreference] = useState('');
  const [timeline, setTimeline] = useState('');
  const [budgetRange, setBudgetRange] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    if (title.length < 10) {
      setError('Title must be at least 10 characters');
      return;
    }
    if (description.length < 50) {
      setError('Description must be at least 50 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/founder/rfq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          relationshipType,
          industries: industries.length > 0 ? industries : undefined,
          stagePreference: stagePreference || undefined,
          timeline: timeline || undefined,
          budgetRange: budgetRange || undefined,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || 'Failed to create RFQ');
      }

      // TASK-034: Track marketplace event (per marketplace-analytics.md spec)
      trackMarketplaceEvent.rfqCreated(
        responseData.id,
        relationshipType,
        industries.length > 0 ? industries : undefined,
        timeline || undefined,
        budgetRange || undefined
      );

      // Success - redirect to RFQ list
      router.push('/founder/rfq?success=created');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create RFQ');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Request for Quote</CardTitle>
        <CardDescription>
          Describe what you&apos;re looking for. Your request will be visible to verified consultants for 30 days.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Seeking seed funding advisor"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">{title.length}/100 characters</p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Describe what you're looking for and any relevant context about your startup..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={2000}
              rows={5}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">{description.length}/2000 characters</p>
          </div>

          {/* Type of Help */}
          <div className="space-y-2">
            <Label htmlFor="relationship-type">
              Type of Help Needed <span className="text-destructive">*</span>
            </Label>
            <Select
              value={relationshipType}
              onValueChange={(value: RelationshipType) => setRelationshipType(value)}
              disabled={isSubmitting}
            >
              <SelectTrigger id="relationship-type">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div>
                      <div className="font-medium">{type.label}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stage Preference */}
            <div className="space-y-2">
              <Label htmlFor="stage">Stage Preference (optional)</Label>
              <Select value={stagePreference} onValueChange={setStagePreference} disabled={isSubmitting}>
                <SelectTrigger id="stage">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No preference</SelectItem>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Timeline */}
            <div className="space-y-2">
              <Label htmlFor="timeline">Timeline (optional)</Label>
              <Select value={timeline} onValueChange={setTimeline} disabled={isSubmitting}>
                <SelectTrigger id="timeline">
                  <SelectValue placeholder="Select timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No preference</SelectItem>
                  {TIMELINES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Budget */}
            <div className="space-y-2">
              <Label htmlFor="budget">Budget Range (optional)</Label>
              <Select value={budgetRange} onValueChange={setBudgetRange} disabled={isSubmitting}>
                <SelectTrigger id="budget">
                  <SelectValue placeholder="Select budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No preference</SelectItem>
                  {BUDGETS.map((b) => (
                    <SelectItem key={b.value} value={b.value}>
                      {b.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Visibility Notice */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your RFQ will be visible to verified consultants for 30 days. Only consultants matching your criteria will see it.
            </AlertDescription>
          </Alert>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post RFQ
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default RFQForm;
