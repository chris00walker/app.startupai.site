/**
 * Consultant Founder Directory Page
 *
 * @story US-PH01, US-PH02, US-PH03
 */

'use client';

import { useState } from 'react';
import { FounderDirectory } from '@/components/consultant/FounderDirectory';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, CheckCircle, Send } from 'lucide-react';
import { RELATIONSHIP_TYPES } from '@/components/consultant/InviteClientModal';

export default function FounderDirectoryPage() {
  const [selectedFounderId, setSelectedFounderId] = useState<string | null>(null);
  const [relationshipType, setRelationshipType] = useState('advisory');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRequestConnection = (founderId: string) => {
    setSelectedFounderId(founderId);
    setRelationshipType('advisory');
    setMessage('');
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!selectedFounderId || !relationshipType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/consultant/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          founderId: selectedFounderId,
          relationshipType,
          message: message || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send connection request');
      }

      setSuccess(true);
      setTimeout(() => {
        setSelectedFounderId(null);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send connection request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFounderId(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Founder Directory</h1>
        <p className="text-muted-foreground mt-2">
          Browse founders who have opted in to the marketplace. View their validation progress and request connections.
        </p>
      </div>

      <FounderDirectory onRequestConnection={handleRequestConnection} />

      {/* Connection Request Modal */}
      <Dialog open={!!selectedFounderId} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          {success ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Request Sent
                </DialogTitle>
                <DialogDescription>
                  Your connection request has been sent. The founder will be notified.
                </DialogDescription>
              </DialogHeader>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Request Connection</DialogTitle>
                <DialogDescription>
                  Send a connection request to this founder. Choose the type of relationship you&apos;re offering and optionally add a message.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Relationship type</label>
                  <Select value={relationshipType} onValueChange={setRelationshipType}>
                    <SelectTrigger aria-label="Select relationship type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RELATIONSHIP_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Message <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Textarea
                    placeholder="Introduce yourself and explain how you can help..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground">{message.length}/500 characters</p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isSubmitting || !relationshipType}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Request
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
