/**
 * Image Selection Flow Component
 *
 * 4-tier progressive image selection for ad creatives:
 * - Tier 1: Unsplash search with Copy Bank keywords (free)
 * - Tier 2: Structured feedback refinement (free)
 * - Tier 3: Reference image upload (coming soon)
 * - Tier 4: AI generation with DALL-E 3 (~$0.12)
 *
 * @story US-AP02
 */

'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Check, RefreshCw, Upload, Sparkles, ChevronLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface UnsplashImage {
  id: string;
  url: string;
  thumbUrl: string;
  altDescription: string;
  photographer: string;
  photographerUrl: string;
}

interface GeneratedImage {
  id: string;
  url: string;
  revisedPrompt: string;
  style: string;
}

type Tier = 1 | 2 | 3 | 4;

interface Tier2Feedback {
  whatsWrong?: 'too_corporate' | 'too_casual' | 'wrong_demographic' | 'wrong_setting' | 'wrong_mood';
  demographicPreference?: 'young' | 'middle' | 'senior';
  settingPreference?: 'office' | 'outdoor' | 'home' | 'abstract';
  moodPreference?: 'energetic' | 'calm' | 'serious' | 'friendly';
  stylePreference?: 'modern' | 'classic' | 'bold' | 'playful';
  peoplePreference?: 'yes' | 'no' | 'abstract_only';
}

interface ImageSelectionFlowProps {
  projectId: string;
  onSelect: (images: Array<UnsplashImage | GeneratedImage>) => void;
  onCancel: () => void;
  minImages?: number;
  maxImages?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ImageSelectionFlow({
  projectId,
  onSelect,
  onCancel,
  minImages = 3,
  maxImages = 5,
}: ImageSelectionFlowProps) {
  // State
  const [tier, setTier] = useState<Tier>(1);
  const [images, setImages] = useState<UnsplashImage[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);

  // Tier 2 feedback state
  const [feedback, setFeedback] = useState<Tier2Feedback>({});

  // Tier 4 state
  const [showCostDialog, setShowCostDialog] = useState(false);
  const [aiDescription, setAiDescription] = useState('');
  const [aiStyle, setAiStyle] = useState<'modern' | 'minimal' | 'bold' | 'playful'>('modern');
  const [aiIncludePeople, setAiIncludePeople] = useState(true);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  // ============================================================================
  // API CALLS
  // ============================================================================

  const fetchTier1Images = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ads/images?projectId=${projectId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch images');
      }

      setImages(data.data.images);
      setKeywords(data.data.keywords || []);
      setTier(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch images');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const fetchTier2Images = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ads/images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          originalKeywords: keywords,
          feedback,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to refine search');
      }

      setImages(data.data.images);
      setSelectedIds(new Set());
      setTier(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refine search');
    } finally {
      setLoading(false);
    }
  }, [projectId, keywords, feedback]);

  const generateAiImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    setShowCostDialog(false);

    try {
      const response = await fetch('/api/ads/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          description: aiDescription,
          style: aiStyle,
          includePeople: aiIncludePeople,
          aspectRatio: '1:1',
          costApproved: true,
          count: 3,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images');
      }

      setGeneratedImages(data.data.images);
      setTier(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setLoading(false);
    }
  }, [projectId, aiDescription, aiStyle, aiIncludePeople]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const toggleImageSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < maxImages) {
        next.add(id);
      }
      return next;
    });
  };

  const handleUseSelected = () => {
    const selected = images.filter((img) => selectedIds.has(img.id));
    onSelect(selected);
  };

  const handleUseGenerated = () => {
    onSelect(generatedImages);
  };

  const handleNoneOfThese = () => {
    setSelectedIds(new Set());
    if (tier === 1) {
      setTier(2);
    } else if (tier === 2) {
      setTier(4);
    }
  };

  const handleBack = () => {
    if (tier === 2) {
      setTier(1);
      setFeedback({});
      fetchTier1Images();
    } else if (tier === 4) {
      setTier(2);
    }
  };

  // Load images on mount
  useState(() => {
    fetchTier1Images();
  });

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const renderImageGrid = (imagesToRender: Array<UnsplashImage | GeneratedImage>) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {imagesToRender.map((img) => (
        <button
          key={img.id}
          type="button"
          onClick={() => toggleImageSelection(img.id)}
          className={cn(
            'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
            selectedIds.has(img.id)
              ? 'border-primary ring-2 ring-primary/50'
              : 'border-transparent hover:border-muted-foreground/50'
          )}
        >
          <Image
            src={'thumbUrl' in img ? img.thumbUrl : img.url}
            alt={'altDescription' in img ? img.altDescription : 'Generated image'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
          />
          {selectedIds.has(img.id) && (
            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
              <Check className="h-8 w-8 text-primary-foreground bg-primary rounded-full p-1" />
            </div>
          )}
        </button>
      ))}
    </div>
  );

  const renderTier2Feedback = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">What&apos;s wrong with the images?</Label>
        <RadioGroup
          value={feedback.whatsWrong || ''}
          onValueChange={(v) => setFeedback((f) => ({ ...f, whatsWrong: v as Tier2Feedback['whatsWrong'] }))}
          className="mt-2 grid grid-cols-2 gap-2"
        >
          {[
            { value: 'too_corporate', label: 'Too corporate/formal' },
            { value: 'too_casual', label: 'Too casual/informal' },
            { value: 'wrong_demographic', label: 'Wrong people/demographic' },
            { value: 'wrong_setting', label: 'Wrong setting/environment' },
            { value: 'wrong_mood', label: 'Wrong mood/feeling' },
          ].map((option) => (
            <div key={option.value} className="flex items-center space-x-2">
              <RadioGroupItem value={option.value} id={option.value} />
              <Label htmlFor={option.value} className="font-normal cursor-pointer">
                {option.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {feedback.whatsWrong === 'wrong_demographic' && (
        <div>
          <Label className="text-base font-medium">Preferred age group</Label>
          <Select
            value={feedback.demographicPreference}
            onValueChange={(v) => setFeedback((f) => ({ ...f, demographicPreference: v as Tier2Feedback['demographicPreference'] }))}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select age group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="young">Young (18-35)</SelectItem>
              <SelectItem value="middle">Middle-aged (35-55)</SelectItem>
              <SelectItem value="senior">Senior (55+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {feedback.whatsWrong === 'wrong_setting' && (
        <div>
          <Label className="text-base font-medium">Preferred setting</Label>
          <Select
            value={feedback.settingPreference}
            onValueChange={(v) => setFeedback((f) => ({ ...f, settingPreference: v as Tier2Feedback['settingPreference'] }))}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select setting" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="office">Office/Workplace</SelectItem>
              <SelectItem value="outdoor">Outdoor/Nature</SelectItem>
              <SelectItem value="home">Home/Cozy</SelectItem>
              <SelectItem value="abstract">Abstract/Minimal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {feedback.whatsWrong === 'wrong_mood' && (
        <div>
          <Label className="text-base font-medium">Preferred mood</Label>
          <Select
            value={feedback.moodPreference}
            onValueChange={(v) => setFeedback((f) => ({ ...f, moodPreference: v as Tier2Feedback['moodPreference'] }))}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Select mood" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="energetic">Energetic/Dynamic</SelectItem>
              <SelectItem value="calm">Calm/Peaceful</SelectItem>
              <SelectItem value="serious">Serious/Professional</SelectItem>
              <SelectItem value="friendly">Friendly/Welcoming</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <Label className="text-base font-medium">Style preference</Label>
        <Select
          value={feedback.stylePreference}
          onValueChange={(v) => setFeedback((f) => ({ ...f, stylePreference: v as Tier2Feedback['stylePreference'] }))}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Select style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="modern">Modern</SelectItem>
            <SelectItem value="classic">Classic</SelectItem>
            <SelectItem value="bold">Bold</SelectItem>
            <SelectItem value="playful">Playful</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-base font-medium">People in images</Label>
        <RadioGroup
          value={feedback.peoplePreference || ''}
          onValueChange={(v) => setFeedback((f) => ({ ...f, peoplePreference: v as Tier2Feedback['peoplePreference'] }))}
          className="mt-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="people-yes" />
            <Label htmlFor="people-yes" className="font-normal cursor-pointer">
              Yes, include people
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="people-no" />
            <Label htmlFor="people-no" className="font-normal cursor-pointer">
              No people, just objects/scenes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="abstract_only" id="people-abstract" />
            <Label htmlFor="people-abstract" className="font-normal cursor-pointer">
              Abstract/patterns only
            </Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );

  const renderTier4Form = () => (
    <div className="space-y-6">
      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-800 dark:text-amber-200">
          <Sparkles className="inline h-4 w-4 mr-1" />
          AI-generated images cost approximately <strong>$0.12</strong> for 3 images.
          Stock photo options have been exhausted.
        </p>
      </div>

      <div>
        <Label htmlFor="ai-description" className="text-base font-medium">
          Describe the image you want
        </Label>
        <Textarea
          id="ai-description"
          value={aiDescription}
          onChange={(e) => setAiDescription(e.target.value)}
          placeholder="A modern office space with natural light, showing a diverse team collaborating around a laptop..."
          className="mt-2 min-h-[100px]"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-base font-medium">Style</Label>
          <Select value={aiStyle} onValueChange={(v) => setAiStyle(v as typeof aiStyle)}>
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="modern">Modern</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="bold">Bold</SelectItem>
              <SelectItem value="playful">Playful</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-end">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="include-people"
              checked={aiIncludePeople}
              onCheckedChange={(checked) => setAiIncludePeople(checked as boolean)}
            />
            <Label htmlFor="include-people" className="font-normal cursor-pointer">
              Include people
            </Label>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Select Images for Your Ad</CardTitle>
            <CardDescription>
              {tier === 1 && 'Choose 3-5 images from our curated selection'}
              {tier === 2 && 'Refine your search with feedback'}
              {tier === 4 && 'Generate custom images with AI'}
            </CardDescription>
          </div>
          {tier > 1 && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Tier 1 & 2: Image Grid */}
            {(tier === 1 || tier === 2) && (
              <>
                {images.length > 0 ? (
                  renderImageGrid(images)
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No images found. Try refining your search.
                  </div>
                )}

                {tier === 2 && (
                  <div className="border-t pt-6">
                    {renderTier2Feedback()}
                    <Button onClick={fetchTier2Images} className="mt-4" disabled={!feedback.whatsWrong}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Search with Feedback
                    </Button>
                  </div>
                )}
              </>
            )}

            {/* Tier 4: AI Generation Form */}
            {tier === 4 && !generatedImages.length && renderTier4Form()}

            {/* Tier 4: Generated Images */}
            {tier === 4 && generatedImages.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Generated images (click to select):
                </p>
                {renderImageGrid(generatedImages)}
              </div>
            )}
          </>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Selected: {selectedIds.size}/{maxImages}
            {selectedIds.size < minImages && ` (min ${minImages})`}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>

            {(tier === 1 || tier === 2) && images.length > 0 && (
              <Button variant="outline" onClick={handleNoneOfThese}>
                None of these work
              </Button>
            )}

            {tier === 4 && !generatedImages.length && (
              <Button
                onClick={() => setShowCostDialog(true)}
                disabled={!aiDescription || aiDescription.length < 10}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Generate (~$0.12)
              </Button>
            )}

            {(tier === 1 || tier === 2) && (
              <Button onClick={handleUseSelected} disabled={selectedIds.size < minImages}>
                <Check className="h-4 w-4 mr-2" />
                Use Selected ({selectedIds.size})
              </Button>
            )}

            {tier === 4 && generatedImages.length > 0 && (
              <Button onClick={handleUseGenerated}>
                <Check className="h-4 w-4 mr-2" />
                Use Generated Images
              </Button>
            )}
          </div>
        </div>
      </CardContent>

      {/* Cost Approval Dialog */}
      <AlertDialog open={showCostDialog} onOpenChange={setShowCostDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm AI Image Generation</AlertDialogTitle>
            <AlertDialogDescription>
              Generating 3 custom images with DALL-E 3 will cost approximately{' '}
              <strong>$0.12</strong>. This amount will be charged to your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={generateAiImages}>
              Generate Images
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

export default ImageSelectionFlow;
