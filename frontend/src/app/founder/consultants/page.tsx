/**
 * Founder Consultant Directory Page
 *
 * @story US-FM01, US-FM02, US-FM03
 */

'use client';

import { useState } from 'react';
import { ConsultantDirectory } from '@/components/founder/ConsultantDirectory';
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

export default function ConsultantDirectoryPage() {
  const [selectedConsultantId, setSelectedConsultantId] = useState<string | null>(null);
  const [relationshipType, setRelationshipType] = useState('advisory');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleRequestConnection = (consultantId: string) => {
    setSelectedConsultantId(consultantId);
    setRelationshipType('advisory');
    setMessage('');
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    if (!selectedConsultantId || !relationshipType) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/founder/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consultantId: selectedConsultantId,
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
        setSelectedConsultantId(null);
        setSuccess(false);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send connection request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedConsultantId(null);
    setError(null);
    setSuccess(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Find Consultants</h1>
        <p className="text-muted-foreground mt-2">
          Browse verified consultants who can help with advisory, funding, programs, services, and more.
        </p>
      </div>

      <ConsultantDirectory onRequestConnection={handleRequestConnection} />

      {/* Connection Request Modal */}
      <Dialog open={!!selectedConsultantId} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          {success ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Request Sent
                </DialogTitle>
                <DialogDescription>
                  Your connection request has been sent. The consultant will be notified.
                </DialogDescription>
              </DialogHeader>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>Request Connection</DialogTitle>
                <DialogDescription>
                  Send a connection request to this consultant. Choose the type of help you&apos;re looking for and optionally add a message.
                </DialogDescription>
              </DialogHeader>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type of help</label>
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
                    placeholder="Introduce yourself and explain what you're looking for..."
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
