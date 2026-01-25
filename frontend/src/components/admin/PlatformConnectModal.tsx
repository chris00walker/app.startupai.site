'use client';

/**
 * Platform Connect Modal
 *
 * Admin modal for connecting StartupAI's business accounts to ad platforms.
 * Handles OAuth flow and credential storage for platform connections.
 *
 * @story US-AM01, US-AM02, US-AM03
 */

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertTriangle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { AdPlatform } from '@/db/schema';

interface PlatformConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  editingPlatform?: {
    id: string;
    platform: AdPlatform;
    accountId: string;
    accountName?: string | null;
    businessManagerId?: string | null;
  } | null;
}

const PLATFORM_CONFIG: Record<
  AdPlatform,
  {
    name: string;
    color: string;
    docUrl: string;
    fields: {
      key: string;
      label: string;
      placeholder: string;
      required: boolean;
      type?: 'text' | 'password' | 'textarea';
    }[];
  }
> = {
  meta: {
    name: 'Meta (Facebook/Instagram)',
    color: '#1877F2',
    docUrl: 'https://developers.facebook.com/docs/marketing-apis/',
    fields: [
      { key: 'accountId', label: 'Ad Account ID', placeholder: 'act_123456789', required: true },
      { key: 'accountName', label: 'Account Name', placeholder: 'My Business Account', required: false },
      { key: 'accessToken', label: 'Access Token', placeholder: 'EAA...', required: true, type: 'password' },
      { key: 'businessManagerId', label: 'Business Manager ID', placeholder: '123456789', required: false },
    ],
  },
  google: {
    name: 'Google Ads',
    color: '#4285F4',
    docUrl: 'https://developers.google.com/google-ads/api/docs/start',
    fields: [
      { key: 'accountId', label: 'Customer ID', placeholder: '123-456-7890', required: true },
      { key: 'accountName', label: 'Account Name', placeholder: 'My Google Ads Account', required: false },
      { key: 'developerToken', label: 'Developer Token', placeholder: 'xxx...', required: true, type: 'password' },
      { key: 'clientId', label: 'OAuth Client ID', placeholder: '123...apps.googleusercontent.com', required: true },
      { key: 'clientSecret', label: 'OAuth Client Secret', placeholder: '...', required: true, type: 'password' },
      { key: 'refreshToken', label: 'Refresh Token', placeholder: '1//...', required: true, type: 'password' },
    ],
  },
  tiktok: {
    name: 'TikTok Ads',
    color: '#000000',
    docUrl: 'https://ads.tiktok.com/marketing_api/docs',
    fields: [
      { key: 'accountId', label: 'Advertiser ID', placeholder: '123456789', required: true },
      { key: 'accountName', label: 'Account Name', placeholder: 'My TikTok Ads Account', required: false },
      { key: 'accessToken', label: 'Access Token', placeholder: '...', required: true, type: 'password' },
      { key: 'appId', label: 'App ID', placeholder: '123456', required: true },
      { key: 'appSecret', label: 'App Secret', placeholder: '...', required: true, type: 'password' },
    ],
  },
  linkedin: {
    name: 'LinkedIn Ads',
    color: '#0A66C2',
    docUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/',
    fields: [
      { key: 'accountId', label: 'Ad Account ID', placeholder: '123456789', required: true },
      { key: 'accountName', label: 'Account Name', placeholder: 'My LinkedIn Ads Account', required: false },
      { key: 'accessToken', label: 'Access Token', placeholder: 'AQV...', required: true, type: 'password' },
      { key: 'organizationId', label: 'Organization URN', placeholder: 'urn:li:organization:123456', required: false },
    ],
  },
  x: {
    name: 'X (Twitter) Ads',
    color: '#000000',
    docUrl: 'https://developer.x.com/en/docs/twitter-ads-api',
    fields: [
      { key: 'accountId', label: 'Ad Account ID', placeholder: '18ce54d4x5t', required: true },
      { key: 'accountName', label: 'Account Name', placeholder: 'My X Ads Account', required: false },
      { key: 'consumerKey', label: 'API Key', placeholder: '...', required: true, type: 'password' },
      { key: 'consumerSecret', label: 'API Secret', placeholder: '...', required: true, type: 'password' },
      { key: 'accessToken', label: 'Access Token', placeholder: '...', required: true, type: 'password' },
      { key: 'accessTokenSecret', label: 'Access Token Secret', placeholder: '...', required: true, type: 'password' },
    ],
  },
  pinterest: {
    name: 'Pinterest Ads',
    color: '#E60023',
    docUrl: 'https://developers.pinterest.com/docs/api/v5/',
    fields: [
      { key: 'accountId', label: 'Ad Account ID', placeholder: '123456789', required: true },
      { key: 'accountName', label: 'Account Name', placeholder: 'My Pinterest Ads Account', required: false },
      { key: 'accessToken', label: 'Access Token', placeholder: 'pina_...', required: true, type: 'password' },
    ],
  },
};

export function PlatformConnectModal({
  open,
  onOpenChange,
  onSuccess,
  editingPlatform,
}: PlatformConnectModalProps) {
  const [selectedPlatform, setSelectedPlatform] = useState<AdPlatform | ''>(
    editingPlatform?.platform || ''
  );
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const platformConfig = selectedPlatform ? PLATFORM_CONFIG[selectedPlatform] : null;

  const handlePlatformChange = (value: string) => {
    setSelectedPlatform(value as AdPlatform);
    setFormData({});
    setError(null);
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!selectedPlatform || !platformConfig) return;

    // Validate required fields
    const missingFields = platformConfig.fields
      .filter((f) => f.required && !formData[f.key]?.trim())
      .map((f) => f.label);

    if (missingFields.length > 0) {
      setError(`Missing required fields: ${missingFields.join(', ')}`);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/ad-platforms/connect', {
        method: editingPlatform ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlatform?.id,
          platform: selectedPlatform,
          ...formData,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to connect platform');
      }

      toast.success(
        editingPlatform
          ? `Updated ${platformConfig.name} connection`
          : `Connected to ${platformConfig.name}`
      );

      onOpenChange(false);
      onSuccess?.();

      // Reset form
      setSelectedPlatform('');
      setFormData({});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingPlatform ? 'Edit Platform Connection' : 'Connect Ad Platform'}
          </DialogTitle>
          <DialogDescription>
            {editingPlatform
              ? 'Update the credentials for this ad platform connection.'
              : 'Connect StartupAI to an ad platform to enable automated campaign management.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Platform Selection */}
          <div className="space-y-2">
            <Label htmlFor="platform">Platform</Label>
            <Select
              value={selectedPlatform}
              onValueChange={handlePlatformChange}
              disabled={!!editingPlatform}
            >
              <SelectTrigger id="platform">
                <SelectValue placeholder="Select a platform" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PLATFORM_CONFIG).map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: config.color }}
                      />
                      {config.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Platform-specific fields */}
          {platformConfig && (
            <>
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="font-medium"
                  style={{
                    borderColor: platformConfig.color,
                    color: platformConfig.color,
                  }}
                >
                  {platformConfig.name}
                </Badge>
                <a
                  href={platformConfig.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  API Documentation
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {platformConfig.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.key}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                      rows={3}
                    />
                  ) : (
                    <Input
                      id={field.key}
                      type={field.type || 'text'}
                      placeholder={field.placeholder}
                      value={formData[field.key] || ''}
                      onChange={(e) => handleInputChange(field.key, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!selectedPlatform || isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {editingPlatform ? 'Update Connection' : 'Connect Platform'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
