/**
 * Founder RFQ Responses Page
 *
 * View and manage responses to an RFQ.
 *
 * @story US-FM08, US-FM09, US-FM11
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, ArrowLeft, CheckCircle, XCircle, Clock, User, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RFQResponse {
  id: string;
  consultantId: string;
  consultantName: string;
  consultantOrganization: string | null;
  verificationBadge: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  respondedAt: string;
}

interface RFQ {
  id: string;
  title: string;
  status: string;
}

export default function FounderRFQResponsesPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const rfqId = resolvedParams.id;

  const [rfq, setRfq] = useState<RFQ | null>(null);
  const [responses, setResponses] = useState<RFQResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action modal state
  const [selectedResponse, setSelectedResponse] = useState<RFQResponse | null>(null);
  const [actionType, setActionType] = useState<'accept' | 'decline' | null>(null);
  const [isActioning, setIsActioning] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchResponses = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/founder/rfq/${rfqId}/responses`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to load responses');
      }
      const data = await response.json();
      setRfq(data.rfq);
      setResponses(data.responses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load responses');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfqId]);

  const handleAction = async () => {
    if (!selectedResponse || !actionType) return;

    setIsActioning(true);
    setActionError(null);

    try {
      const endpoint =
        actionType === 'accept'
          ? `/api/founder/rfq/${rfqId}/responses/${selectedResponse.id}/accept`
          : `/api/founder/rfq/${rfqId}/responses/${selectedResponse.id}/decline`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || `Failed to ${actionType} response`);
      }

      // Update local state
      setResponses((prev) =>
        prev.map((r) =>
          r.id === selectedResponse.id
            ? { ...r, status: actionType === 'accept' ? 'accepted' : 'declined' }
            : r
        )
      );

      // Close modal
      setSelectedResponse(null);
      setActionType(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : `Failed to ${actionType} response`);
    } finally {
      setIsActioning(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        );
      case 'accepted':
        return (
          <Badge variant="default" className="flex items-center gap-1 bg-green-500">
            <CheckCircle className="h-3 w-3" />
            Accepted
          </Badge>
        );
      case 'declined':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Declined
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getVerificationBadge = (status: string) => {
    if (status === 'verified') {
      return <Badge variant="default" className="bg-green-500">Verified</Badge>;
    }
    if (status === 'grace') {
      return <Badge variant="secondary" className="bg-amber-500 text-white">Grace Period</Badge>;
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/founder/rfq">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Requests
          </Link>
        </Button>

        {rfq && (
          <div>
            <h1 className="text-3xl font-bold">Responses to: {rfq.title}</h1>
            <p className="text-muted-foreground mt-2">
              Review and respond to consultants who are interested in your request.
            </p>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && responses.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No responses yet</h3>
            <p className="text-muted-foreground">
              Verified consultants can see your request. Check back later for responses.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && responses.length > 0 && (
        <div className="space-y-4">
          {responses.map((response) => (
            <Card key={response.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {response.consultantName}
                      {getVerificationBadge(response.verificationBadge)}
                    </CardTitle>
                    {response.consultantOrganization && (
                      <CardDescription className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {response.consultantOrganization}
                      </CardDescription>
                    )}
                  </div>
                  {getStatusBadge(response.status)}
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm whitespace-pre-wrap">{response.message}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  Responded {formatDistanceToNow(new Date(response.respondedAt))} ago
                </p>
              </CardContent>
              {response.status === 'pending' && (
                <CardFooter className="gap-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      setSelectedResponse(response);
                      setActionType('accept');
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedResponse(response);
                      setActionType('decline');
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Action Confirmation Dialog */}
      <Dialog
        open={!!selectedResponse && !!actionType}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedResponse(null);
            setActionType(null);
            setActionError(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'accept' ? 'Accept Response' : 'Decline Response'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'accept'
                ? `Accept ${selectedResponse?.consultantName}'s response? This will create a connection with them.`
                : `Decline ${selectedResponse?.consultantName}'s response? They will be notified.`}
            </DialogDescription>
          </DialogHeader>

          {actionError && (
            <Alert variant="destructive">
              <AlertDescription>{actionError}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedResponse(null);
                setActionType(null);
              }}
              disabled={isActioning}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === 'accept' ? 'default' : 'destructive'}
              onClick={handleAction}
              disabled={isActioning}
            >
              {isActioning ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : actionType === 'accept' ? (
                'Accept'
              ) : (
                'Decline'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
