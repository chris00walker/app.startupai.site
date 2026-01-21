'use client';

/**
 * Quick Start Form Component (ADR-006)
 *
 * Replaces the 7-stage AI conversation with a 30-second form.
 * Collects business idea and optional hints, then kicks off Phase 1.
 *
 * Usage:
 * ```tsx
 * <QuickStartForm onSuccess={(projectId) => router.push(`/dashboard/projects/${projectId}`)} />
 * ```
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronUp, Loader2, Rocket, Lightbulb } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// =============================================================================
// Types
// =============================================================================

interface QuickStartFormProps {
  clientId?: string;  // For consultant flow
  onSuccess?: (projectId: string, runId: string) => void;
  onError?: (error: Error) => void;
}

interface FormData {
  rawIdea: string;
  industry: string;
  targetUser: string;
  geography: string;
  additionalContext: string;
}

interface FormErrors {
  rawIdea?: string;
  additionalContext?: string;
  submit?: string;
}

// =============================================================================
// Constants
// =============================================================================

const INDUSTRY_OPTIONS = [
  { value: '', label: 'Select industry (optional)' },
  { value: 'saas', label: 'SaaS / Software' },
  { value: 'ecommerce', label: 'E-commerce / Retail' },
  { value: 'fintech', label: 'Fintech / Finance' },
  { value: 'healthtech', label: 'Healthcare / Health Tech' },
  { value: 'edtech', label: 'Education / EdTech' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'media', label: 'Media / Content' },
  { value: 'b2b_services', label: 'B2B Services' },
  { value: 'consumer', label: 'Consumer App' },
  { value: 'hardware', label: 'Hardware / IoT' },
  { value: 'other', label: 'Other' },
];

const TARGET_USER_OPTIONS = [
  { value: '', label: 'Select target user (optional)' },
  { value: 'b2b_enterprise', label: 'Enterprise (1000+ employees)' },
  { value: 'b2b_midmarket', label: 'Mid-Market (100-999 employees)' },
  { value: 'b2b_smb', label: 'Small Business (10-99 employees)' },
  { value: 'b2b_micro', label: 'Micro Business (1-9 employees)' },
  { value: 'b2c_consumers', label: 'Consumers (B2C)' },
  { value: 'prosumers', label: 'Prosumers / Power Users' },
  { value: 'developers', label: 'Developers / Technical' },
  { value: 'creators', label: 'Creators / Freelancers' },
];

const GEOGRAPHY_OPTIONS = [
  { value: '', label: 'Select geography (optional)' },
  { value: 'global', label: 'Global' },
  { value: 'north_america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'apac', label: 'Asia Pacific' },
  { value: 'latam', label: 'Latin America' },
  { value: 'mena', label: 'Middle East & North Africa' },
  { value: 'local', label: 'Local / Single City' },
];

const MIN_IDEA_LENGTH = 10;
const MAX_IDEA_LENGTH = 5000;
const MAX_CONTEXT_LENGTH = 10000;

// =============================================================================
// Component
// =============================================================================

export function QuickStartForm({ clientId, onSuccess, onError }: QuickStartFormProps) {
  const router = useRouter();

  // Form state
  const [formData, setFormData] = React.useState<FormData>({
    rawIdea: '',
    industry: '',
    targetUser: '',
    geography: '',
    additionalContext: '',
  });
  const [errors, setErrors] = React.useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hintsOpen, setHintsOpen] = React.useState(false);

  // Validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.rawIdea.trim()) {
      newErrors.rawIdea = 'Please describe your business idea';
    } else if (formData.rawIdea.trim().length < MIN_IDEA_LENGTH) {
      newErrors.rawIdea = `Please provide at least ${MIN_IDEA_LENGTH} characters`;
    } else if (formData.rawIdea.length > MAX_IDEA_LENGTH) {
      newErrors.rawIdea = `Please keep your idea under ${MAX_IDEA_LENGTH} characters`;
    }

    if (formData.additionalContext.length > MAX_CONTEXT_LENGTH) {
      newErrors.additionalContext = `Please keep additional context under ${MAX_CONTEXT_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Build hints object (only include non-empty values)
      const hints: Record<string, string> = {};
      if (formData.industry) hints.industry = formData.industry;
      if (formData.targetUser) hints.target_user = formData.targetUser;
      if (formData.geography) hints.geography = formData.geography;

      const response = await fetch('/api/projects/quick-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_idea: formData.rawIdea.trim(),
          hints: Object.keys(hints).length > 0 ? hints : undefined,
          additional_context: formData.additionalContext.trim() || undefined,
          client_id: clientId,
          idempotency_key: crypto.randomUUID(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start validation');
      }

      // Success!
      if (onSuccess) {
        onSuccess(data.project_id, data.run_id);
      } else {
        // Default: redirect to dashboard
        router.push(data.redirect_url || `/dashboard/projects/${data.project_id}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      setErrors({ submit: errorMessage });
      if (onError && error instanceof Error) {
        onError(error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Character count display
  const ideaCharCount = formData.rawIdea.length;
  const contextCharCount = formData.additionalContext.length;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Rocket className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">Start Validating Your Idea</CardTitle>
        <CardDescription className="text-base">
          Describe your business idea and our AI will research the market,
          analyze competitors, and generate a structured brief.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Business Idea - Required */}
          <div className="space-y-2">
            <Label htmlFor="rawIdea" className="text-base font-medium">
              Your Business Idea <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="rawIdea"
              placeholder="Describe your business idea in a few sentences. What problem are you solving? Who is it for? What makes your solution unique?"
              value={formData.rawIdea}
              onChange={(e) => setFormData((prev) => ({ ...prev, rawIdea: e.target.value }))}
              className={`min-h-[120px] resize-y ${errors.rawIdea ? 'border-destructive' : ''}`}
              disabled={isSubmitting}
              aria-invalid={!!errors.rawIdea}
              aria-describedby={errors.rawIdea ? 'rawIdea-error' : undefined}
            />
            <div className="flex justify-between text-sm">
              {errors.rawIdea ? (
                <span id="rawIdea-error" className="text-destructive">
                  {errors.rawIdea}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Be specific about the problem and your target customers
                </span>
              )}
              <span className={`text-muted-foreground ${ideaCharCount > MAX_IDEA_LENGTH ? 'text-destructive' : ''}`}>
                {ideaCharCount}/{MAX_IDEA_LENGTH}
              </span>
            </div>
          </div>

          {/* Optional Hints - Collapsible */}
          <Collapsible open={hintsOpen} onOpenChange={setHintsOpen}>
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="w-full justify-between px-0 hover:bg-transparent"
              >
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Lightbulb className="w-4 h-4" />
                  Add optional hints to improve analysis
                </span>
                {hintsOpen ? (
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Industry */}
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={formData.industry}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, industry: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="industry" className="w-full">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value || 'none'}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target User */}
                <div className="space-y-2">
                  <Label htmlFor="targetUser">Target User</Label>
                  <Select
                    value={formData.targetUser}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, targetUser: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="targetUser" className="w-full">
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_USER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value || 'none'}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Geography */}
                <div className="space-y-2">
                  <Label htmlFor="geography">Geography</Label>
                  <Select
                    value={formData.geography}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, geography: value }))}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="geography" className="w-full">
                      <SelectValue placeholder="Select geography" />
                    </SelectTrigger>
                    <SelectContent>
                      {GEOGRAPHY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value || 'none'}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Additional Context */}
              <div className="space-y-2">
                <Label htmlFor="additionalContext">Additional Context</Label>
                <Textarea
                  id="additionalContext"
                  placeholder="Any additional information that might help our analysis (market research, competitor names, existing traction, etc.)"
                  value={formData.additionalContext}
                  onChange={(e) => setFormData((prev) => ({ ...prev, additionalContext: e.target.value }))}
                  className={`min-h-[80px] resize-y ${errors.additionalContext ? 'border-destructive' : ''}`}
                  disabled={isSubmitting}
                />
                <div className="flex justify-between text-sm">
                  {errors.additionalContext ? (
                    <span className="text-destructive">{errors.additionalContext}</span>
                  ) : (
                    <span className="text-muted-foreground">Optional</span>
                  )}
                  <span className={`text-muted-foreground ${contextCharCount > MAX_CONTEXT_LENGTH ? 'text-destructive' : ''}`}>
                    {contextCharCount}/{MAX_CONTEXT_LENGTH}
                  </span>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Submit Error */}
          {errors.submit && (
            <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={isSubmitting || !formData.rawIdea.trim()}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Starting Validation...
              </>
            ) : (
              <>
                <Rocket className="w-4 h-4" />
                Start Validation
              </>
            )}
          </Button>

          {/* Help Text */}
          <p className="text-center text-sm text-muted-foreground">
            Our AI will analyze your idea and present a structured brief for your review.
            You&apos;ll be able to edit before proceeding.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export default QuickStartForm;
