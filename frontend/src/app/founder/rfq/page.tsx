/**
 * Founder RFQ List Page
 *
 * @story US-FM07, US-FM08
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Plus, MessageSquare, CheckCircle, Clock, Archive } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RFQ {
  id: string;
  title: string;
  description: string;
  relationshipType: string;
  status: 'open' | 'filled' | 'cancelled';
  responseCount: number;
  pendingResponses: number;
  createdAt: string;
  expiresAt: string;
}

const RELATIONSHIP_TYPES: Record<string, string> = {
  advisory: 'Advisory',
  capital: 'Capital',
  program: 'Program',
  service: 'Service',
  ecosystem: 'Ecosystem',
};

export default function FounderRFQPage() {
  const searchParams = useSearchParams();
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams?.get('success') === 'created') {
      setSuccessMessage('Your request has been posted and is now visible to verified consultants.');
      // Clear the success param from URL
      window.history.replaceState({}, '', '/founder/rfq');
    }
  }, [searchParams]);

  const fetchRFQs = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/founder/rfq');
      if (!response.ok) {
        throw new Error('Failed to load your requests');
      }
      const data = await response.json();
      setRfqs(data.rfqs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRFQs();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="default">Open</Badge>;
      case 'filled':
        return <Badge variant="secondary">Filled</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Requests</h1>
          <p className="text-muted-foreground mt-2">
            Post requests to find the right consultants for your needs.
          </p>
        </div>
        <Button asChild>
          <Link href="/founder/rfq/create">
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </Link>
        </Button>
      </div>

      {successMessage && (
        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

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

      {!isLoading && rfqs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Archive className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No requests yet</h3>
            <p className="text-muted-foreground mb-4">
              Post your first request to connect with verified consultants.
            </p>
            <Button asChild>
              <Link href="/founder/rfq/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Request
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && rfqs.length > 0 && (
        <div className="space-y-4">
          {rfqs.map((rfq) => (
            <Card key={rfq.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{rfq.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {rfq.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{RELATIONSHIP_TYPES[rfq.relationshipType]}</Badge>
                    {getStatusBadge(rfq.status)}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Posted {formatDistanceToNow(new Date(rfq.createdAt))} ago</span>
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {rfq.responseCount} responses
                    {rfq.pendingResponses > 0 && (
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {rfq.pendingResponses} new
                      </Badge>
                    )}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Expires {formatDistanceToNow(new Date(rfq.expiresAt))}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" asChild>
                  <Link href={`/founder/rfq/${rfq.id}/responses`}>
                    View Responses
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
