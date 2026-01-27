'use client';

/**
 * Quick Start Form Component (ADR-006)
 *
 * A distinctive, atmospheric onboarding form that replaces the 7-stage AI conversation.
 * Collects business idea and optional hints in 30 seconds, then kicks off Phase 1.
 *
 * Design: Uses orchestrated reveals, atmospheric backgrounds, and bold typography
 * per /frontend-design standards.
 *
 * UX Review Improvements (2026-01-21):
 * - Enhanced button visual state when form has content
 * - Persistent helper text above textarea
 * - Optional labels visible in dropdown triggers
 * - Improved expand/collapse affordance
 * - Added example business idea toggle
 *
 * @story US-F01, US-F07, US-FT01, US-E01, US-E03
 */

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Loader2, Rocket, Lightbulb, Sparkles, ArrowRight, HelpCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
  clientId?: string;
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
  { value: '', label: 'Select industry' },
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
  { value: '', label: 'Select target user' },
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
  { value: '', label: 'Select geography' },
  { value: 'global', label: 'Global' },
  { value: 'north_america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'apac', label: 'Asia Pacific' },
  { value: 'latam', label: 'Latin America' },
  { value: 'mena', label: 'Middle East & North Africa' },
  { value: 'local', label: 'Local / Single City' },
];

const EXAMPLE_IDEA = `A mobile app that helps busy professionals meal plan and grocery shop more efficiently. The problem is that people waste time deciding what to cook, buy duplicate ingredients, and end up throwing away food. My solution uses AI to suggest personalized weekly meal plans based on dietary preferences, generates consolidated shopping lists, and integrates with local grocery delivery services. Target users are working parents and health-conscious millennials who want to eat better but lack time to plan.`;

const MIN_IDEA_LENGTH = 10;
const MAX_IDEA_LENGTH = 5000;
const MAX_CONTEXT_LENGTH = 10000;
const DRAFT_STORAGE_KEY = 'startupai:quickstart_draft';
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
const DRAFT_SAVE_DEBOUNCE_MS = 600;
const DRAFT_PREVIEW_CHARS = 140;

type QuickStartDraft = FormData & { updatedAt: string };

function hasDraftContent(draft: FormData): boolean {
  return Boolean(
    draft.rawIdea.trim() ||
    draft.additionalContext.trim() ||
    draft.industry ||
    draft.targetUser ||
    draft.geography
  );
}

function readDraftFromStorage(): QuickStartDraft | null {
  if (typeof window === 'undefined') return null;

  const stored = localStorage.getItem(DRAFT_STORAGE_KEY);
  if (!stored) return null;

  try {
    const draft = JSON.parse(stored) as QuickStartDraft;
    if (!draft?.updatedAt || !hasDraftContent(draft)) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }

    const ageMs = Date.now() - new Date(draft.updatedAt).getTime();
    if (Number.isNaN(ageMs) || ageMs > DRAFT_EXPIRY_MS) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      return null;
    }

    return draft;
  } catch {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    return null;
  }
}

function writeDraftToStorage(draft: QuickStartDraft): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function clearDraftFromStorage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(DRAFT_STORAGE_KEY);
}

function getDraftPreview(rawIdea: string): string {
  const trimmed = rawIdea.trim();
  if (!trimmed) return 'Draft includes saved quick start details.';
  if (trimmed.length <= DRAFT_PREVIEW_CHARS) return trimmed;
  return `${trimmed.slice(0, DRAFT_PREVIEW_CHARS)}...`;
}

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
  const [showExample, setShowExample] = React.useState(false);
  const [draft, setDraft] = React.useState<QuickStartDraft | null>(null);
  const [showDraftPrompt, setShowDraftPrompt] = React.useState(false);
  const draftLoadedRef = React.useRef(false);

  React.useEffect(() => {
    const storedDraft = readDraftFromStorage();
    if (storedDraft) {
      setDraft(storedDraft);
      setShowDraftPrompt(true);
    }
    draftLoadedRef.current = true;
  }, []);

  React.useEffect(() => {
    if (!draftLoadedRef.current || showDraftPrompt) return;

    const shouldPersist = hasDraftContent(formData);
    const timer = window.setTimeout(() => {
      if (!shouldPersist) {
        clearDraftFromStorage();
        return;
      }

      writeDraftToStorage({
        ...formData,
        updatedAt: new Date().toISOString(),
      });
    }, DRAFT_SAVE_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [formData, showDraftPrompt]);

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

      clearDraftFromStorage();
      setDraft(null);
      setShowDraftPrompt(false);

      if (onSuccess) {
        onSuccess(data.project_id, data.run_id);
      } else {
        router.push(data.redirect_url || `/project/${data.project_id}/analysis`);
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

  // Use example idea
  const handleUseExample = () => {
    setFormData((prev) => ({ ...prev, rawIdea: EXAMPLE_IDEA }));
    setShowExample(false);
  };

  const handleResumeDraft = () => {
    if (!draft) return;
    const { updatedAt, ...draftData } = draft;
    setFormData(draftData);
    setShowDraftPrompt(false);
  };

  const handleStartFresh = () => {
    clearDraftFromStorage();
    setDraft(null);
    setShowDraftPrompt(false);
    setFormData({
      rawIdea: '',
      industry: '',
      targetUser: '',
      geography: '',
      additionalContext: '',
    });
  };

  const ideaCharCount = formData.rawIdea.length;
  const contextCharCount = formData.additionalContext.length;
  const isValidIdea = formData.rawIdea.trim().length >= MIN_IDEA_LENGTH;
  const draftPreview = draft ? getDraftPreview(draft.rawIdea) : '';

  return (
    <div className="w-full max-w-2xl mx-auto">
      {showDraftPrompt && draft && (
        <Alert className="mb-6 border-primary/40 bg-primary/5">
          <AlertTitle>Resume your draft?</AlertTitle>
          <AlertDescription>
            We saved your Quick Start details from the last 24 hours.
            <div className="mt-2 text-xs text-muted-foreground">
              {draftPreview}
            </div>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
              <Button size="sm" onClick={handleResumeDraft}>
                Resume draft
              </Button>
              <Button size="sm" variant="outline" onClick={handleStartFresh}>
                Start fresh
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      {/* Atmospheric Card Container - with visible border and shadow for WCAG 1.4.11 compliance */}
      <Card className="relative overflow-hidden border border-border/60 shadow-xl shadow-black/[0.08] bg-gradient-to-br from-card via-card to-primary/[0.02]">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />

        {/* Gradient Orbs - Atmospheric depth */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl" />

        <CardHeader className="relative z-10 text-center pb-2 pt-8">
          {/* Animated Hero Icon */}
          <div className="reveal-1">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-lg shadow-primary/30 rotate-3 hover:rotate-0 transition-transform duration-300">
              <Rocket className="w-8 h-8 text-primary-foreground" />
            </div>
          </div>

          {/* Title with distinctive typography */}
          <div className="reveal-2">
            <CardTitle className="font-display text-3xl md:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
              Start Validating Your Idea
            </CardTitle>
          </div>

          {/* Subtitle */}
          <div className="reveal-3">
            <CardDescription className="text-base md:text-lg text-muted-foreground mt-3 max-w-md mx-auto leading-relaxed">
              Describe your business idea and our AI will research the market,
              analyze competitors, and generate a structured brief.
            </CardDescription>
          </div>

          {/* Trust indicators */}
          <div className="reveal-4 flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-accent" />
              <span>AI-Powered</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span>30 seconds</span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="relative z-10 pt-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Idea - Required */}
            <div className="reveal-4 space-y-3">
              {/* Label with required indicator */}
              <div className="flex items-center justify-between">
                <Label htmlFor="rawIdea" className="text-base font-semibold flex items-center gap-2">
                  Your Business Idea
                  <span className="text-destructive" aria-hidden="true">*</span>
                  <span className="sr-only">(required)</span>
                </Label>
              </div>

              {/* Persistent helper text - doesn't disappear when typing */}
              <p className="text-sm text-muted-foreground">
                What problem are you solving? Who is it for? What makes your solution unique?
              </p>

              {/* Textarea with enhanced focus state */}
              <div className="onboarding-input-container">
                <Textarea
                  id="rawIdea"
                  placeholder="Describe your business idea here..."
                  value={formData.rawIdea}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rawIdea: e.target.value }))}
                  className={`onboarding-input min-h-[140px] p-4 border-2 focus:border-primary ${errors.rawIdea ? 'border-destructive border-2 bg-destructive/5' : 'border-input/80'}`}
                  disabled={isSubmitting}
                  aria-invalid={!!errors.rawIdea}
                  aria-describedby={errors.rawIdea ? 'rawIdea-error' : 'rawIdea-hint'}
                  aria-required="true"
                />
              </div>

              {/* Inline example prompt - shown when textarea is empty or nearly empty */}
              {/* Example prompt - prominent when empty, subtle when typing */}
              {!showExample && (
                formData.rawIdea.length < 20 ? (
                  <button
                    type="button"
                    onClick={() => setShowExample(true)}
                    className="w-full p-3 rounded-lg border border-dashed border-primary/20 bg-primary/[0.02] hover:bg-primary/5 hover:border-primary/30 transition-all duration-200 text-left group"
                  >
                    <span className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                      <Lightbulb className="w-4 h-4 text-primary/60 group-hover:text-primary" />
                      <span>Not sure where to start?</span>
                      <span className="text-primary font-medium">See an example idea →</span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowExample(true)}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    Need inspiration? See an example
                  </button>
                )
              )}

              {/* Expanded example with use button */}
              {showExample && (
                <div className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/15 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 mt-0.5">
                      <Lightbulb className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-xs font-semibold text-foreground/70 uppercase tracking-wide">Example Idea</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {EXAMPLE_IDEA}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleUseExample}
                      className="text-xs bg-primary/90 hover:bg-primary"
                    >
                      Use this example
                    </Button>
                    <button
                      type="button"
                      onClick={() => setShowExample(false)}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              )}

              {/* Error/validation message and character count */}
              <div className="flex justify-between items-center text-sm">
                {errors.rawIdea ? (
                  <span id="rawIdea-error" className="text-destructive font-semibold flex items-center gap-1.5" role="alert">
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-xs">!</span>
                    {errors.rawIdea}
                  </span>
                ) : (
                  <span id="rawIdea-hint" className="text-muted-foreground">
                    {isValidIdea ? (
                      <span className="text-accent font-medium">✓ Looking good!</span>
                    ) : ideaCharCount > 0 ? (
                      <span className="text-amber-600 dark:text-amber-500 font-medium">
                        {MIN_IDEA_LENGTH - ideaCharCount} more characters needed
                      </span>
                    ) : null}
                  </span>
                )}
                <span className={`tabular-nums font-medium ${
                  ideaCharCount > MAX_IDEA_LENGTH
                    ? 'text-destructive'
                    : ideaCharCount > MAX_IDEA_LENGTH * 0.95
                    ? 'text-destructive'
                    : ideaCharCount > MAX_IDEA_LENGTH * 0.8
                    ? 'text-amber-600 dark:text-amber-500'
                    : 'text-muted-foreground font-normal'
                }`}>
                  {ideaCharCount.toLocaleString()}/{MAX_IDEA_LENGTH.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Optional Hints - Collapsible with improved affordance */}
            <Collapsible open={hintsOpen} onOpenChange={setHintsOpen} className="reveal-4">
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="w-full flex items-center justify-between py-3.5 px-4 rounded-xl border-2 border-dashed border-border hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-200 group"
                >
                  <span className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    <div className="p-1.5 rounded-lg bg-accent/10 group-hover:bg-accent/20 transition-colors">
                      <Lightbulb className="w-4 h-4 text-accent" />
                    </div>
                    Add optional hints to improve analysis
                    <span className="text-xs text-muted-foreground/60">(optional)</span>
                  </span>
                  <div className={`p-1.5 rounded-lg bg-secondary transition-all duration-200 ${hintsOpen ? 'rotate-180 bg-primary/10' : ''}`}>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </div>
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="pt-4 space-y-6">
                {/* Quick Hints - Dropdown Group */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Hints</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Industry - with (optional) visible */}
                  <div className="space-y-2">
                    <Label htmlFor="industry" className="text-sm font-medium flex items-center gap-1.5">
                      Industry
                      <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, industry: value === 'none' ? '' : value }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        id="industry"
                        className={`w-full h-11 bg-background border-2 border-input/80 focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                          formData.industry ? 'text-foreground' : 'text-muted-foreground/60'
                        }`}
                      >
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRY_OPTIONS.map((option) => (
                          <SelectItem key={option.value || 'none'} value={option.value || 'none'}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Target User - with (optional) visible */}
                  <div className="space-y-2">
                    <Label htmlFor="targetUser" className="text-sm font-medium flex items-center gap-1.5">
                      Target User
                      <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Select
                      value={formData.targetUser}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, targetUser: value === 'none' ? '' : value }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        id="targetUser"
                        className={`w-full h-11 bg-background border-2 border-input/80 focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                          formData.targetUser ? 'text-foreground' : 'text-muted-foreground/60'
                        }`}
                      >
                        <SelectValue placeholder="Select target" />
                      </SelectTrigger>
                      <SelectContent>
                        {TARGET_USER_OPTIONS.map((option) => (
                          <SelectItem key={option.value || 'none'} value={option.value || 'none'}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Geography - with (optional) visible */}
                  <div className="space-y-2">
                    <Label htmlFor="geography" className="text-sm font-medium flex items-center gap-1.5">
                      Geography
                      <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Select
                      value={formData.geography}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, geography: value === 'none' ? '' : value }))}
                      disabled={isSubmitting}
                    >
                      <SelectTrigger
                        id="geography"
                        className={`w-full h-11 bg-background border-2 border-input/80 focus:ring-2 focus:ring-primary focus:ring-offset-1 ${
                          formData.geography ? 'text-foreground' : 'text-muted-foreground/60'
                        }`}
                      >
                        <SelectValue placeholder="Select geography" />
                      </SelectTrigger>
                      <SelectContent>
                        {GEOGRAPHY_OPTIONS.map((option) => (
                          <SelectItem key={option.value || 'none'} value={option.value || 'none'}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  </div>
                </div>

                {/* Visual separator */}
                <div className="border-t border-border/50" />

                {/* Additional Context */}
                <div className="space-y-2">
                  <Label htmlFor="additionalContext" className="text-sm font-medium flex items-center gap-1.5">
                    Additional Context
                    <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Market research, competitor names, existing traction, or any other helpful details.
                  </p>
                  <div className="onboarding-input-container">
                    <Textarea
                      id="additionalContext"
                      placeholder="Add any additional context here..."
                      value={formData.additionalContext}
                      onChange={(e) => setFormData((prev) => ({ ...prev, additionalContext: e.target.value }))}
                      className={`onboarding-input min-h-[80px] p-4 border-2 border-input/80 focus:border-primary ${errors.additionalContext ? 'border-destructive' : ''}`}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex justify-end text-sm">
                    <span className={`tabular-nums ${contextCharCount > MAX_CONTEXT_LENGTH ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                      {contextCharCount.toLocaleString()}/{MAX_CONTEXT_LENGTH.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-start gap-3" role="alert">
                <div className="w-5 h-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs">!</span>
                </div>
                {errors.submit}
              </div>
            )}

            {/* Submit Button - Enhanced visual states */}
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || !isValidIdea}
              aria-disabled={isSubmitting || !isValidIdea}
              aria-describedby={!isValidIdea ? 'button-hint' : undefined}
              className={`
                w-full h-14 text-base font-display font-semibold tracking-wide
                transition-all duration-300 relative overflow-hidden
                focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                ${isValidIdea && !isSubmitting
                  ? 'bg-gradient-to-r from-primary via-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-muted text-muted-foreground cursor-not-allowed opacity-60'
                }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Starting Validation...</span>
                  <span className="text-primary-foreground/70 text-sm">(~30 seconds)</span>
                </span>
              ) : (
                <span className="flex items-center justify-center gap-3">
                  {isValidIdea ? (
                    <>
                      <Rocket className="w-5 h-5" />
                      Validate My Idea
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                    </>
                  ) : (
                    <>
                      <span className="opacity-70">Describe your idea to get started</span>
                    </>
                  )}
                </span>
              )}
            </Button>

            {/* Screen reader hint for disabled button */}
            {!isValidIdea && (
              <span id="button-hint" className="sr-only">
                Enter at least {MIN_IDEA_LENGTH} characters in your business idea to enable submission
              </span>
            )}

            {/* Help Text */}
            <p className="text-center text-sm text-muted-foreground leading-relaxed">
              Our AI will analyze your idea and present a structured brief for your review.
              <br />
              <span className="text-foreground/70">You&apos;ll be able to edit before proceeding.</span>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuickStartForm;
