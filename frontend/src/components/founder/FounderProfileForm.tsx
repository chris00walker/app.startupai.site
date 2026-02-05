/**
 * Founder Profile Form
 *
 * Form for editing professional background, domain expertise, and other
 * founder details that populate the Team slide.
 *
 * @story US-NL01
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Save, X, Plus } from 'lucide-react';

interface FounderProfileFormProps {
  profile: {
    professional_summary: string | null;
    domain_expertise: string[];
    previous_ventures: unknown[];
    linkedin_url: string | null;
    company_website: string | null;
    years_experience: number | null;
  } | null;
  onSave: (data: Record<string, unknown>) => Promise<void>;
  onCancel?: () => void;
}

export function FounderProfileForm({ profile, onSave, onCancel }: FounderProfileFormProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [summary, setSummary] = useState(profile?.professional_summary || '');
  const [expertise, setExpertise] = useState<string[]>(profile?.domain_expertise || []);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || '');
  const [website, setWebsite] = useState(profile?.company_website || '');
  const [yearsExperience, setYearsExperience] = useState(
    profile?.years_experience?.toString() || ''
  );

  const handleAddExpertise = () => {
    const trimmed = expertiseInput.trim();
    if (trimmed && !expertise.includes(trimmed)) {
      setExpertise([...expertise, trimmed]);
      setExpertiseInput('');
    }
  };

  const handleRemoveExpertise = (item: string) => {
    setExpertise(expertise.filter(e => e !== item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await onSave({
        professional_summary: summary || null,
        domain_expertise: expertise,
        linkedin_url: linkedinUrl || null,
        company_website: website || null,
        years_experience: yearsExperience ? parseInt(yearsExperience, 10) : null,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Founder Profile</CardTitle>
        <CardDescription>
          Your professional background populates the Team slide in your pitch narrative.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Professional Summary */}
          <div className="space-y-2">
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea
              id="summary"
              value={summary}
              onChange={e => setSummary(e.target.value)}
              placeholder="Brief overview of your professional background and what drives you..."
              maxLength={500}
              rows={3}
            />
            <p className="text-xs text-muted-foreground text-right">
              {summary.length}/500
            </p>
          </div>

          {/* Domain Expertise */}
          <div className="space-y-2">
            <Label>Domain Expertise</Label>
            <div className="flex gap-2">
              <Input
                value={expertiseInput}
                onChange={e => setExpertiseInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddExpertise();
                  }
                }}
                placeholder="e.g., SaaS, healthcare, machine learning"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddExpertise}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {expertise.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {expertise.map(item => (
                  <Badge key={item} variant="secondary" className="text-xs gap-1">
                    {item}
                    <button
                      type="button"
                      onClick={() => handleRemoveExpertise(item)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* LinkedIn & Website */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn URL</Label>
              <Input
                id="linkedin"
                type="url"
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Company Website</Label>
              <Input
                id="website"
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>

          {/* Years of Experience */}
          <div className="space-y-2">
            <Label htmlFor="years">Years of Industry Experience</Label>
            <Input
              id="years"
              type="number"
              min={0}
              max={50}
              value={yearsExperience}
              onChange={e => setYearsExperience(e.target.value)}
              placeholder="e.g., 8"
              className="w-32"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Profile
                </>
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
