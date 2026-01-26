/**
 * InviteClientModal Component
 *
 * Modal for inviting new clients to work with a consultant.
 *
 * @story US-C02
 */

'use client';

import { useState } from 'react';
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
import { Loader2, Mail, User, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// Types
// ============================================================================

export interface InviteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (params: { email: string; name?: string }) => Promise<{
    success: boolean;
    invite?: {
      id: string;
      email: string;
      name: string | null;
      inviteToken: string;
      inviteUrl: string;
      expiresAt: string;
    };
    error?: string;
  }>;
}

type ModalState = 'form' | 'success';

// ============================================================================
// Helper Functions
// ============================================================================

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ============================================================================
// Invite Client Modal Component
// ============================================================================

export function InviteClientModal({
  isOpen,
  onClose,
  onInvite,
}: InviteClientModalProps) {
  const [state, setState] = useState<ModalState>('form');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    // Reset state when closing
    setState('form');
    setEmail('');
    setName('');
    setError(null);
    setInviteUrl(null);
    setCopied(false);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!isValidEmail(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onInvite({
        email: email.trim().toLowerCase(),
        name: name.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error || 'Failed to send invite');
        return;
      }

      // Success!
      setInviteUrl(result.invite?.inviteUrl || null);
      setState('success');
    } catch (err) {
      console.error('[InviteClientModal] Error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!inviteUrl) return;

    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('[InviteClientModal] Failed to copy:', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="max-w-md">
        {state === 'form' ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Invite a Client
              </DialogTitle>
              <DialogDescription>
                Send an invitation to a founder to join StartupAI. They&apos;ll create their own
                account and be linked to you as their consultant.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label htmlFor="invite-email">
                  Email address <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="founder@company.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-9"
                    autoFocus
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-name">
                  Client name <span className="text-muted-foreground text-xs">(optional)</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="invite-name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    disabled={isSubmitting}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Personalizes the invite. They can change their name during signup.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                  {error}
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invite
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Invitation Sent
              </DialogTitle>
              <DialogDescription>
                An invitation has been created for{' '}
                <span className="font-medium text-foreground">{email}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">Invitation Link</span>
                  <span className="text-xs text-muted-foreground">Expires in 30 days</span>
                </div>

                <div className="flex gap-2">
                  <Input
                    value={inviteUrl || ''}
                    readOnly
                    className="text-xs font-mono bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyUrl}
                    className={cn(copied && 'text-green-600 border-green-300')}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Share this link with your client. They&apos;ll use it to create their account.
                </p>
              </div>

              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">Note:</strong> Email delivery is coming soon.
                  For now, please share the invite link directly with your client.
                </p>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
              >
                Close
              </Button>
              {inviteUrl && (
                <Button
                  type="button"
                  asChild
                >
                  <a href={inviteUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Preview Link
                  </a>
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default InviteClientModal;
