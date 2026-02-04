/**
 * FounderDirectory Component
 *
 * Directory for verified consultants to browse opt-in founders.
 * Shows anonymized founder info with validation evidence badges.
 *
 * @story US-PH01, US-PH02
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Building2, FlaskConical, MessageSquare, Target, Crown, RefreshCw } from 'lucide-react';
import { trackMarketplaceEvent } from '@/lib/analytics';

interface Founder {
  id: string;
  displayName: string;
  company: string;
  industry: string;
  stage: string;
  problemFit: string;
  evidenceBadges: {
    interviewsCompleted: number;
    experimentsPassed: number;
    fitScore: number;
  };
  joinedAt: string;
}

interface FounderDirectoryProps {
  onRequestConnection?: (founderId: string) => void;
}

const INDUSTRIES = [
  { value: '', label: 'All Industries' },
  { value: 'SaaS', label: 'SaaS' },
  { value: 'B2B', label: 'B2B' },
  { value: 'B2C', label: 'B2C' },
  { value: 'FinTech', label: 'FinTech' },
  { value: 'HealthTech', label: 'HealthTech' },
  { value: 'EdTech', label: 'EdTech' },
  { value: 'E-commerce', label: 'E-commerce' },
];

// Validation stages from projects.stage enum
const STAGES = [
  { value: '', label: 'All Stages' },
  { value: 'DESIRABILITY', label: 'Desirability' },
  { value: 'FEASIBILITY', label: 'Feasibility' },
  { value: 'VIABILITY', label: 'Viability' },
  { value: 'SCALE', label: 'Scale' },
];

const FIT_LEVELS = [
  { value: '', label: 'All Fit Levels' },
  { value: 'partial_fit', label: 'Partial Fit' },
  { value: 'strong_fit', label: 'Strong Fit' },
];

export function FounderDirectory({ onRequestConnection }: FounderDirectoryProps) {
  const [founders, setFounders] = useState<Founder[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);

  // Filters
  const [industry, setIndustry] = useState('');
  const [stage, setStage] = useState('');
  const [problemFit, setProblemFit] = useState('');

  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const fetchFounders = async () => {
    setIsLoading(true);
    setError(null);
    setIsUnverified(false);

    try {
      const params = new URLSearchParams();
      if (industry) params.set('industry', industry);
      if (stage) params.set('stage', stage);
      if (problemFit) params.set('problem_fit', problemFit);
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const response = await fetch(`/api/consultant/founders?${params}`);

      if (response.status === 403) {
        const data = await response.json();
        if (data.error === 'unverified') {
          setIsUnverified(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Failed to load founders');
      }

      const data = await response.json();
      setFounders(data.founders);
      setTotal(data.total);

      // TASK-034: Track directory view (per marketplace-analytics.md spec)
      trackMarketplaceEvent.founderDirectoryViewed(data.total, data.viewerVerificationStatus || 'verified');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load founders');
    } finally {
      setIsLoading(false);
    }
  };

  // TASK-026: Fix race condition by combining filter/pagination logic
  useEffect(() => {
    fetchFounders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  // Reset offset and fetch when filters change
  useEffect(() => {
    if (offset === 0) {
      fetchFounders();
    } else {
      setOffset(0); // This will trigger the above effect
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry, stage, problemFit]);

  useEffect(() => {
    if (!industry && !stage && !problemFit) return;
    trackMarketplaceEvent.founderDirectoryFiltered({
      industry: industry || undefined,
      stage: stage || undefined,
      problem_fit: problemFit || undefined,
    });
  }, [industry, stage, problemFit]);

  if (isUnverified) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Verification Required
          </CardTitle>
          <CardDescription>
            Upgrade to Advisor ($199/mo) or Capital ($499/mo) to browse founder requests and access the Founder Directory.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href="/pricing?plan=consultant">Upgrade Now</a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger aria-label="Filter by industry">
                  <SelectValue placeholder="Filter by industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => (
                    <SelectItem key={i.value} value={i.value}>
                      {i.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger aria-label="Filter by stage">
                  <SelectValue placeholder="Filter by stage" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <Select value={problemFit} onValueChange={setProblemFit}>
                <SelectTrigger aria-label="Filter by validation status">
                  <SelectValue placeholder="Filter by validation status" />
                </SelectTrigger>
                <SelectContent>
                  {FIT_LEVELS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" onClick={fetchFounders} aria-label="Refresh founder list">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && founders.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No founders match your filters. Try broadening your search.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Founder Cards */}
      {!isLoading && founders.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {founders.map((founder) => (
            <Card key={founder.id} className="hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{founder.displayName}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Building2 className="h-3 w-3" />
                      {founder.company}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={founder.problemFit === 'strong_fit' ? 'default' : 'secondary'}
                  >
                    {founder.problemFit === 'strong_fit' ? 'Strong Fit' : 'Partial Fit'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {founder.industry && (
                    <Badge variant="outline">{founder.industry}</Badge>
                  )}
                  {founder.stage && (
                    <Badge variant="outline" className="capitalize">
                      {founder.stage.replace('_', ' ')}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {founder.evidenceBadges.interviewsCompleted} interviews
                  </span>
                  <span className="flex items-center gap-1">
                    <FlaskConical className="h-3 w-3" />
                    {founder.evidenceBadges.experimentsPassed} experiments
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Fit: {founder.evidenceBadges.fitScore}%
                  </span>
                </div>

                {onRequestConnection && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      const hasEvidence =
                        founder.evidenceBadges.interviewsCompleted > 0 ||
                        founder.evidenceBadges.experimentsPassed > 0;
                      trackMarketplaceEvent.founderProfileViewed(
                        founder.id,
                        founder.problemFit,
                        hasEvidence
                      );
                      onRequestConnection(founder.id);
                    }}
                  >
                    Request Connection
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} founders
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - limit))}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={offset + limit >= total}
              onClick={() => setOffset(offset + limit)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FounderDirectory;
