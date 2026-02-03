/**
 * RFQBoard Component
 *
 * Board for verified consultants to browse and respond to founder RFQs.
 *
 * @story US-PH05, US-PH06
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Search, Clock, MessageSquare, Crown, RefreshCw, Send, Info, CheckCircle } from 'lucide-react';
import { RELATIONSHIP_TYPES } from '@/components/consultant/InviteClientModal';
import { formatDistanceToNow } from 'date-fns';

interface RFQ {
  id: string;
  title: string;
  descriptionPreview: string;
  relationshipType: string;
  industries: string[] | null;
  stagePreference: string | null;
  timeline: string | null;
  budgetRange: string | null;
  responseCount: number;
  createdAt: string;
  expiresAt: string;
  hasResponded: boolean;
}

const TIMELINES: Record<string, string> = {
  '1_month': '1 month',
  '3_months': '3 months',
  '6_months': '6 months',
  flexible: 'Flexible',
};

const BUDGETS: Record<string, string> = {
  equity_only: 'Equity only',
  under_5k: 'Under $5K',
  '5k_25k': '$5K - $25K',
  '25k_100k': '$25K - $100K',
  over_100k: 'Over $100K',
};

export function RFQBoard() {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);

  // Filters
  const [relationshipType, setRelationshipType] = useState('');
  const [timeline, setTimeline] = useState('');
  const [budgetRange, setBudgetRange] = useState('');

  // Pagination
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Response modal
  const [selectedRfq, setSelectedRfq] = useState<RFQ | null>(null);
  const [responseMessage, setResponseMessage] = useState('');
  const [isResponding, setIsResponding] = useState(false);
  const [responseSuccess, setResponseSuccess] = useState(false);
  const [responseError, setResponseError] = useState<string | null>(null); // TASK-027

  const fetchRFQs = async () => {
    setIsLoading(true);
    setError(null);
    setIsUnverified(false);

    try {
      const params = new URLSearchParams();
      if (relationshipType) params.set('relationship_type', relationshipType);
      if (timeline) params.set('timeline', timeline);
      if (budgetRange) params.set('budget_range', budgetRange);
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const response = await fetch(`/api/consultant/rfq?${params}`);

      if (response.status === 403) {
        const data = await response.json();
        if (data.error === 'unverified') {
          setIsUnverified(true);
          return;
        }
      }

      if (!response.ok) {
        throw new Error('Failed to load RFQs');
      }

      const data = await response.json();
      setRfqs(data.rfqs);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load RFQs');
    } finally {
      setIsLoading(false);
    }
  };

  // TASK-026: Fix race condition by combining filter/pagination logic
  useEffect(() => {
    fetchRFQs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  // Reset offset and fetch when filters change
  useEffect(() => {
    if (offset === 0) {
      fetchRFQs();
    } else {
      setOffset(0); // This will trigger the above effect
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [relationshipType, timeline, budgetRange]);

  const handleRespond = async () => {
    if (!selectedRfq || responseMessage.length < 50) return;

    setIsResponding(true);
    setResponseError(null); // TASK-027: Clear previous error

    try {
      const response = await fetch(`/api/consultant/rfq/${selectedRfq.id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: responseMessage }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to submit response');
      }

      setResponseSuccess(true);

      // Update local state
      setRfqs((prev) =>
        prev.map((rfq) =>
          rfq.id === selectedRfq.id
            ? { ...rfq, hasResponded: true, responseCount: rfq.responseCount + 1 }
            : rfq
        )
      );

      // Close modal after delay
      setTimeout(() => {
        setSelectedRfq(null);
        setResponseMessage('');
        setResponseSuccess(false);
      }, 2000);
    } catch (err) {
      // TASK-027: Set modal-specific error, not global error
      setResponseError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setIsResponding(false);
    }
  };

  const getTypeLabel = (type: string) => {
    const found = RELATIONSHIP_TYPES.find((t) => t.value === type);
    return found?.label || type;
  };

  const getExpiresInDays = (expiresAt: string) => {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  if (isUnverified) {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Verification Required
          </CardTitle>
          <CardDescription>
            Upgrade to Advisor ($199/mo) or Capital ($499/mo) to browse founder requests and respond to RFQs.
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
              <Select value={relationshipType} onValueChange={setRelationshipType}>
                <SelectTrigger aria-label="Filter by relationship type">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {RELATIONSHIP_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <Select value={timeline} onValueChange={setTimeline}>
                <SelectTrigger aria-label="Filter by timeline">
                  <SelectValue placeholder="Timeline" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Timelines</SelectItem>
                  {Object.entries(TIMELINES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <Select value={budgetRange} onValueChange={setBudgetRange}>
                <SelectTrigger aria-label="Filter by budget range">
                  <SelectValue placeholder="Budget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Budgets</SelectItem>
                  {Object.entries(BUDGETS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="icon" onClick={fetchRFQs} aria-label="Refresh RFQ list">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!isLoading && rfqs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No requests match your filters. Try broadening your search or check back later.
            </p>
          </CardContent>
        </Card>
      )}

      {/* RFQ Cards */}
      {!isLoading && rfqs.length > 0 && (
        <div className="space-y-4">
          {rfqs.map((rfq) => (
            <Card key={rfq.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{rfq.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {rfq.descriptionPreview}
                    </CardDescription>
                  </div>
                  <Badge>{getTypeLabel(rfq.relationshipType)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-2 mb-3">
                  {rfq.stagePreference && (
                    <Badge variant="outline" className="capitalize">
                      {rfq.stagePreference.replace('_', ' ')}
                    </Badge>
                  )}
                  {rfq.timeline && (
                    <Badge variant="outline">{TIMELINES[rfq.timeline]}</Badge>
                  )}
                  {rfq.budgetRange && (
                    <Badge variant="outline">{BUDGETS[rfq.budgetRange]}</Badge>
                  )}
                  {rfq.industries?.map((ind) => (
                    <Badge key={ind} variant="secondary">
                      {ind}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Posted {formatDistanceToNow(new Date(rfq.createdAt))} ago</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {rfq.responseCount} responses
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Expires in {getExpiresInDays(rfq.expiresAt)} days
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                {rfq.hasResponded ? (
                  <Button variant="outline" disabled className="w-full sm:w-auto">
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Response Sent
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="w-full sm:w-auto"
                    onClick={() => setSelectedRfq(rfq)}
                  >
                    Respond
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && total > limit && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {offset + 1}-{Math.min(offset + limit, total)} of {total} requests
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

      {/* Response Modal */}
      <Dialog open={!!selectedRfq} onOpenChange={(open) => {
        if (!open) {
          setSelectedRfq(null);
          setResponseError(null); // Clear error when closing
        }
      }}>
        <DialogContent className="max-w-lg">
          {responseSuccess ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Response Sent
                </DialogTitle>
                <DialogDescription>
                  The founder will be notified of your response.
                </DialogDescription>
              </DialogHeader>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Respond to Request</DialogTitle>
                <DialogDescription>
                  Introduce yourself and explain why you&apos;re a good fit for this request.
                </DialogDescription>
              </DialogHeader>

              {/* TASK-027: Display modal-specific error */}
              {responseError && (
                <div role="alert" aria-live="polite">
                  <Alert variant="destructive">
                    <AlertDescription>{responseError}</AlertDescription>
                  </Alert>
                </div>
              )}

              <div className="space-y-4">
                <Textarea
                  aria-label="Response message"
                  placeholder="Introduce yourself and explain why you're a good fit for this request..."
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  rows={6}
                  maxLength={1000}
                  disabled={isResponding}
                />
                <p className="text-xs text-muted-foreground">
                  {responseMessage.length}/1000 characters (minimum 50)
                </p>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Your response will include your profile information. Make sure your profile is complete and up to date.
                  </AlertDescription>
                </Alert>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedRfq(null)}
                  disabled={isResponding}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRespond}
                  disabled={isResponding || responseMessage.length < 50}
                >
                  {isResponding ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Response
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RFQBoard;
