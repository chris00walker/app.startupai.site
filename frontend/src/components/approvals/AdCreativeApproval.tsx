/**
 * AdCreativeApproval Component
 *
 * HITL checkpoint for reviewing and approving ad creatives before
 * they go live on Meta (Facebook/Instagram).
 *
 * Features:
 * - Platform-specific ad previews (Facebook Feed, Instagram Stories, etc.)
 * - Copy variant toggles (enable/disable headlines, primary texts)
 * - Selected images grid with ability to change
 * - Budget and targeting summary
 * - Platform review status tracking
 * - Approve & Launch / Request Changes actions
 *
 * @story US-AP05
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Check,
  X,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Image as ImageIcon,
  FileText,
  DollarSign,
  Target,
  Eye,
  Edit2,
  ExternalLink,
} from 'lucide-react';
import type { AdCampaign, CampaignCreativeData, CampaignTargetingData, SelectedImage } from '@/db/schema/ad-campaigns';
import type { CopyBankHeadlines, CopyBankPrimaryTexts, CopyBankCTAs } from '@/db/schema/copy-banks';

// ============================================================================
// TYPES
// ============================================================================

interface AdCreativeApprovalProps {
  campaignId: string;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: () => Promise<boolean>;
  onRequestChanges: () => void;
}

interface CampaignWithDetails {
  campaign: AdCampaign;
  copyBank: {
    headlines: CopyBankHeadlines;
    primaryTexts: CopyBankPrimaryTexts;
    ctas: CopyBankCTAs;
  } | null;
  platformStatus: {
    status: 'pending' | 'approved' | 'rejected' | 'error';
    lastChecked: string | null;
    issues?: Array<{ summary: string; details?: string }>;
  };
  previews: Array<{
    format: 'facebook_feed' | 'instagram_feed' | 'instagram_stories' | 'facebook_reels';
    previewUrl: string;
  }>;
}

interface CopyVariantState {
  headlines: Record<keyof CopyBankHeadlines, boolean>;
  primaryTexts: Record<keyof CopyBankPrimaryTexts, boolean>;
  ctas: Record<keyof CopyBankCTAs, boolean>;
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function PlatformStatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' | 'error' }) {
  const config = {
    pending: {
      icon: Clock,
      label: 'Pending Review',
      className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    },
    approved: {
      icon: CheckCircle,
      label: 'Approved',
      className: 'bg-green-100 text-green-700 border-green-200',
    },
    rejected: {
      icon: XCircle,
      label: 'Rejected',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
    error: {
      icon: AlertCircle,
      label: 'Error',
      className: 'bg-red-100 text-red-700 border-red-200',
    },
  };

  const { icon: Icon, label, className } = config[status];

  return (
    <Badge variant="outline" className={cn('gap-1', className)}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function PreviewPlaceholder({ format }: { format: string }) {
  return (
    <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
      <div className="text-center text-muted-foreground">
        <Eye className="h-8 w-8 mx-auto mb-2" />
        <p className="text-sm">{format.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}</p>
        <p className="text-xs">Preview</p>
      </div>
    </div>
  );
}

function ImageThumbnail({ image, selected }: { image: SelectedImage; selected: boolean }) {
  return (
    <div
      className={cn(
        'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
        selected ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
      )}
    >
      <img
        src={image.thumbUrl || image.url}
        alt={image.photographer ? `Photo by ${image.photographer}` : 'Selected image'}
        className="w-full h-full object-cover"
      />
      {selected && (
        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-0.5">
          <Check className="h-3 w-3" />
        </div>
      )}
      {image.source === 'generated' && (
        <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs px-1 rounded">
          AI
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function AdCreativeApproval({
  campaignId,
  projectId,
  open,
  onOpenChange,
  onApprove,
  onRequestChanges,
}: AdCreativeApprovalProps) {
  const [data, setData] = useState<CampaignWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [activePreview, setActivePreview] = useState<string>('facebook_feed');

  // Track which copy variants are enabled
  const [copyState, setCopyState] = useState<CopyVariantState>({
    headlines: {
      primary: true,
      benefit: true,
      question: true,
      social: true,
      urgency: true,
    },
    primaryTexts: {
      problem_solution: true,
      benefit_focused: true,
      social_proof: true,
      feature_list: false,
      urgency: false,
    },
    ctas: {
      primary: true,
      secondary: true,
      urgency: false,
      learn: false,
    },
  });

  // Fetch campaign data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/approvals/ad-creative?campaignId=${campaignId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch campaign data');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [campaignId]);

  // Poll for platform status updates
  const pollStatus = useCallback(async () => {
    if (!data?.campaign.id) return;

    try {
      setIsPolling(true);
      const response = await fetch(`/api/ads/campaigns/${data.campaign.id}/poll-status`, {
        method: 'POST',
      });

      if (response.ok) {
        // Refresh the full data to get updated status
        await fetchData();
      }
    } catch (err) {
      console.error('Error polling status:', err);
    } finally {
      setIsPolling(false);
    }
  }, [data?.campaign.id, fetchData]);

  useEffect(() => {
    if (open && campaignId) {
      fetchData();
    }
  }, [open, campaignId, fetchData]);

  const handleApprove = async () => {
    setIsSubmitting(true);
    try {
      // Save copy state changes first
      await fetch(`/api/approvals/ad-creative`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId,
          copyState,
        }),
      });

      const success = await onApprove();
      if (success) {
        onOpenChange(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleCopyVariant = (
    category: 'headlines' | 'primaryTexts' | 'ctas',
    key: string
  ) => {
    setCopyState((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: !prev[category][key as keyof (typeof prev)[typeof category]],
      },
    }));
  };

  const enabledHeadlineCount = Object.values(copyState.headlines).filter(Boolean).length;
  const enabledPrimaryTextCount = Object.values(copyState.primaryTexts).filter(Boolean).length;

  // Loading state
  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Loading Ad Creative...</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
            <DialogDescription>{error || 'Failed to load campaign data'}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={fetchData}>Retry</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const { campaign, copyBank, platformStatus, previews } = data;
  const creative = campaign.creativeData as CampaignCreativeData | null;
  const targeting = campaign.targetingData as CampaignTargetingData | null;
  const selectedImages = creative?.selectedImages || [];
  const isRejected = platformStatus.status === 'rejected';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh]" data-testid="ad-creative-approval">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-xl">Ad Approval - HITL Checkpoint</DialogTitle>
              <DialogDescription>
                Review your ad creative before it goes live on Meta
              </DialogDescription>
            </div>
            <PlatformStatusBadge status={platformStatus.status} />
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-4">
          <div className="space-y-6">
            {/* Campaign Info */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="space-y-1">
                <p>
                  <span className="font-medium text-foreground">Campaign:</span> {campaign.name}
                </p>
                <p>
                  <span className="font-medium text-foreground">Platform:</span> Meta (Facebook +
                  Instagram)
                </p>
              </div>
              {creative?.landingPageUrl && (
                <a
                  href={creative.landingPageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  View Landing Page
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>

            <Separator />

            {/* Platform Status Alert */}
            {isRejected && platformStatus.issues && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-red-800">Ad Rejected by Meta</p>
                    <ul className="text-sm text-red-700 space-y-1">
                      {platformStatus.issues.map((issue, i) => (
                        <li key={i}>
                          <strong>{issue.summary}</strong>
                          {issue.details && <span className="block">{issue.details}</span>}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm text-red-600">
                      Please edit your creative to address these issues before resubmitting.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Previews Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Ad Previews
                </CardTitle>
                <CardDescription>
                  See how your ads will appear across different placements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={activePreview} onValueChange={setActivePreview}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="facebook_feed">Facebook Feed</TabsTrigger>
                    <TabsTrigger value="instagram_feed">Instagram Feed</TabsTrigger>
                    <TabsTrigger value="instagram_stories">Stories</TabsTrigger>
                    <TabsTrigger value="facebook_reels">Reels</TabsTrigger>
                  </TabsList>
                  {['facebook_feed', 'instagram_feed', 'instagram_stories', 'facebook_reels'].map(
                    (format) => (
                      <TabsContent key={format} value={format} className="mt-4">
                        <div className="flex justify-center">
                          <div className="w-80">
                            {previews.find((p) => p.format === format)?.previewUrl ? (
                              <iframe
                                src={previews.find((p) => p.format === format)?.previewUrl}
                                className="w-full aspect-square rounded-lg border"
                                title={`${format} preview`}
                              />
                            ) : (
                              <PreviewPlaceholder format={format} />
                            )}
                          </div>
                        </div>
                      </TabsContent>
                    )
                  )}
                </Tabs>
              </CardContent>
            </Card>

            {/* Copy and Images Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Copy Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Ad Copy
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={onRequestChanges}>
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit Copy
                    </Button>
                  </div>
                  <CardDescription>
                    {enabledHeadlineCount} headlines, {enabledPrimaryTextCount} texts enabled
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Headlines */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Headlines</p>
                    {copyBank &&
                      Object.entries(copyBank.headlines).map(([key, text]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <span
                            className={cn(
                              'text-sm flex-1 pr-4',
                              !copyState.headlines[key as keyof CopyBankHeadlines] &&
                                'text-muted-foreground line-through'
                            )}
                          >
                            {text}
                          </span>
                          <Switch
                            checked={copyState.headlines[key as keyof CopyBankHeadlines]}
                            onCheckedChange={() => toggleCopyVariant('headlines', key)}
                            aria-label={`Toggle ${key} headline`}
                          />
                        </div>
                      ))}
                  </div>

                  {/* Primary Texts */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Primary Texts</p>
                    {copyBank &&
                      Object.entries(copyBank.primaryTexts).map(([key, text]) => (
                        <div
                          key={key}
                          className="flex items-start justify-between py-2 border-b last:border-0"
                        >
                          <span
                            className={cn(
                              'text-sm flex-1 pr-4 line-clamp-2',
                              !copyState.primaryTexts[key as keyof CopyBankPrimaryTexts] &&
                                'text-muted-foreground line-through'
                            )}
                          >
                            {text}
                          </span>
                          <Switch
                            checked={copyState.primaryTexts[key as keyof CopyBankPrimaryTexts]}
                            onCheckedChange={() => toggleCopyVariant('primaryTexts', key)}
                            aria-label={`Toggle ${key} primary text`}
                          />
                        </div>
                      ))}
                  </div>

                  {/* CTAs */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Call to Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {copyBank &&
                        Object.entries(copyBank.ctas).map(([key, text]) => (
                          <Button
                            key={key}
                            variant={
                              copyState.ctas[key as keyof CopyBankCTAs] ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => toggleCopyVariant('ctas', key)}
                            className="text-xs"
                          >
                            {copyState.ctas[key as keyof CopyBankCTAs] ? (
                              <Check className="h-3 w-3 mr-1" />
                            ) : (
                              <X className="h-3 w-3 mr-1" />
                            )}
                            {text}
                          </Button>
                        ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Images Section */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ImageIcon className="h-4 w-4" />
                      Selected Images
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={onRequestChanges}>
                      <Edit2 className="h-3 w-3 mr-1" />
                      Change Images
                    </Button>
                  </div>
                  <CardDescription>
                    {selectedImages.length} images selected for flexible ad testing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedImages.map((image) => (
                      <ImageThumbnail key={image.id} image={image} selected />
                    ))}
                    {selectedImages.length === 0 && (
                      <div className="col-span-3 text-center py-8 text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No images selected</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Budget & Targeting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Budget */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Budget
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={onRequestChanges}>
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Daily Budget</span>
                    <span className="font-medium">
                      ${campaign.dailyBudget?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Allocated</span>
                    <span className="font-medium">${campaign.budgetAllocated.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">
                      {campaign.scheduledStartAt && campaign.scheduledEndAt
                        ? `${Math.ceil(
                            (new Date(campaign.scheduledEndAt).getTime() -
                              new Date(campaign.scheduledStartAt).getTime()) /
                              (1000 * 60 * 60 * 24)
                          )} days`
                        : 'Not set'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Targeting */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Targeting
                    </CardTitle>
                    <Button variant="outline" size="sm" onClick={onRequestChanges}>
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {targeting?.segment && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Segment</span>
                      <span className="font-medium">{targeting.segment}</span>
                    </div>
                  )}
                  {targeting?.demographics && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Age</span>
                      <span className="font-medium">
                        {targeting.demographics.ageMin || 18}-{targeting.demographics.ageMax || 65}
                      </span>
                    </div>
                  )}
                  {targeting?.locations && targeting.locations.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">
                        {targeting.locations.map((l) => l.country).join(', ')}
                      </span>
                    </div>
                  )}
                  {targeting?.interests && targeting.interests.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interests</span>
                      <span className="font-medium text-right">
                        {targeting.interests.slice(0, 3).join(', ')}
                        {targeting.interests.length > 3 && ` +${targeting.interests.length - 3}`}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Platform Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Platform Review Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <PlatformStatusBadge status={platformStatus.status} />
                      {platformStatus.lastChecked && (
                        <span className="text-xs text-muted-foreground">
                          Last checked:{' '}
                          {new Date(platformStatus.lastChecked).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                    {platformStatus.status === 'pending' && (
                      <p className="text-sm text-muted-foreground">
                        Meta typically reviews ads within 2-24 hours. You can approve now and your
                        ads will go live automatically when Meta completes their review.
                      </p>
                    )}
                    {platformStatus.status === 'approved' && (
                      <p className="text-sm text-green-700">
                        Meta has approved your ad. It will go live immediately after you approve.
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={pollStatus}
                    disabled={isPolling}
                    className="gap-2"
                  >
                    <RefreshCw className={cn('h-4 w-4', isPolling && 'animate-spin')} />
                    {isPolling ? 'Checking...' : 'Refresh Status'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={onRequestChanges} disabled={isSubmitting}>
              <Edit2 className="h-4 w-4 mr-2" />
              Request Changes
            </Button>
            <Button
              onClick={handleApprove}
              disabled={isSubmitting || isRejected || enabledHeadlineCount < 1}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {platformStatus.status === 'approved' ? 'Approve & Launch' : 'Approve'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AdCreativeApproval;
