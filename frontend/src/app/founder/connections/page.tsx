/**
 * Founder Connections Page
 *
 * @story US-FM04, US-FM05, US-FM06
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, XCircle, Clock, Users, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Connection {
  id: string;
  consultantId: string;
  consultantName: string;
  consultantEmail: string | null;
  consultantOrganization: string | null;
  verificationBadge: string;
  relationshipType: string;
  status: string;
  initiatedBy: string;
  message: string | null;
  acceptedAt: string | null;
  declinedAt: string | null;
  createdAt: string;
}

const RELATIONSHIP_TYPES: Record<string, string> = {
  advisory: 'Advisory',
  capital: 'Capital',
  program: 'Program',
  service: 'Service',
  ecosystem: 'Ecosystem',
};

export default function FounderConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [showDeclineDialog, setShowDeclineDialog] = useState(false);

  const fetchConnections = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/founder/connections');
      if (!response.ok) {
        throw new Error('Failed to load connections');
      }
      const data = await response.json();
      setConnections(data.connections || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleAccept = async (connection: Connection) => {
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/founder/connections/${connection.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to accept connection');
      }

      await fetchConnections();
      setSelectedConnection(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept connection');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!selectedConnection) return;

    setIsProcessing(true);
    try {
      const response = await fetch(`/api/founder/connections/${selectedConnection.id}/decline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: declineReason || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to decline connection');
      }

      await fetchConnections();
      setSelectedConnection(null);
      setShowDeclineDialog(false);
      setDeclineReason('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to decline connection');
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingConnections = connections.filter(
    (c) => c.status === 'requested' && c.initiatedBy === 'consultant'
  );
  const activeConnections = connections.filter((c) => c.status === 'active');
  const pastConnections = connections.filter(
    (c) => c.status === 'declined' || c.status === 'archived'
  );

  const renderConnection = (connection: Connection, showActions: boolean = false) => (
    <Card key={connection.id} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              {connection.consultantName}
              {connection.verificationBadge === 'verified' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              {connection.verificationBadge === 'grace' && (
                <Clock className="h-4 w-4 text-amber-500" />
              )}
            </CardTitle>
            {connection.consultantOrganization && (
              <CardDescription className="flex items-center gap-1 mt-1">
                <Building2 className="h-3 w-3" />
                {connection.consultantOrganization}
              </CardDescription>
            )}
          </div>
          <Badge variant="outline">{RELATIONSHIP_TYPES[connection.relationshipType]}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {connection.message && (
          <p className="text-sm text-muted-foreground mb-3 italic">"{connection.message}"</p>
        )}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{formatDistanceToNow(new Date(connection.createdAt))} ago</span>
          {connection.acceptedAt && (
            <span className="text-green-600">
              Connected {formatDistanceToNow(new Date(connection.acceptedAt))} ago
            </span>
          )}
        </div>
        {showActions && (
          <div className="flex gap-2 mt-4">
            <Button onClick={() => handleAccept(connection)} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Accept
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedConnection(connection);
                setShowDeclineDialog(true);
              }}
              disabled={isProcessing}
            >
              Decline
            </Button>
          </div>
        )}
        {connection.status === 'active' && connection.consultantEmail && (
          <div className="mt-4">
            <a
              href={`mailto:${connection.consultantEmail}`}
              className="text-sm text-primary hover:underline"
            >
              {connection.consultantEmail}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Connections</h1>
        <p className="text-muted-foreground mt-2">
          Manage your connections with consultants.
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pending
              {pendingConnections.length > 0 && (
                <Badge variant="secondary">{pendingConnections.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active">Active ({activeConnections.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastConnections.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-6">
            {pendingConnections.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No pending connection requests.</p>
                </CardContent>
              </Card>
            ) : (
              pendingConnections.map((c) => renderConnection(c, true))
            )}
          </TabsContent>

          <TabsContent value="active" className="mt-6">
            {activeConnections.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No active connections yet.</p>
                </CardContent>
              </Card>
            ) : (
              activeConnections.map((c) => renderConnection(c))
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {pastConnections.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No past connections.</p>
                </CardContent>
              </Card>
            ) : (
              pastConnections.map((c) => renderConnection(c))
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Decline Dialog */}
      <Dialog open={showDeclineDialog} onOpenChange={setShowDeclineDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline Connection Request</DialogTitle>
            <DialogDescription>
              {selectedConnection?.consultantName} won't be able to request a connection again for 30 days.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Help them understand why..."
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeclineDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDecline} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Decline
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
