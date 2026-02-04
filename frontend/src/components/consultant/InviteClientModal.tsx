/**
 * InviteClientModal Component
 *
 * Modal for inviting new clients to work with a consultant.
 * Shows upgrade prompt for trial users attempting to invite real clients.
 *
 * @story US-C02, US-CT03
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Mail, User, CheckCircle2, Copy, ExternalLink, Crown, Lock, Sparkles, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

export type RelationshipType = 'advisory' | 'capital' | 'program' | 'service' | 'ecosystem';

export const RELATIONSHIP_TYPES: { value: RelationshipType; label: string; description: string }[] = [
  { value: 'advisory', label: 'Advisory', description: 'Strategic guidance. Mentors, coaches, fractional executives.' },
  { value: 'capital', label: 'Capital', description: 'Funding support. Angels, VCs, family offices.' },
  { value: 'program', label: 'Program', description: 'Cohort-based support. Accelerators, incubators.' },
  { value: 'service', label: 'Service', description: 'Professional support. Lawyers, accountants, agencies.' },
  { value: 'ecosystem', label: 'Ecosystem', description: 'Community and networking. Coworking, startup communities.' },
];

export interface InviteClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (params: { email: string; name?: string; relationshipType: RelationshipType }) => Promise<{
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
  /** If true, show upgrade prompt instead of sending invite (US-CT03) */
  isTrial?: boolean;
  /** Default relationship type for the consultant */
  defaultRelationshipType?: RelationshipType;
}

type ModalState = 'form' | 'success' | 'upgrade';

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
  isTrial = false,
  defaultRelationshipType,
}: InviteClientModalProps) {
  const [state, setState] = useState<ModalState>('form');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  // No default - must be explicitly selected (per plan) unless consultant has a profile default
  const [relationshipType, setRelationshipType] = useState<RelationshipType | ''>(defaultRelationshipType || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClose = () => {
    // Reset state when closing
    setState('form');
    setEmail('');
    setName('');
    setRelationshipType(defaultRelationshipType || '');
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

    if (!relationshipType) {
      setError('Please select a relationship type');
      return;
    }

    // US-CT03: Trial users see upgrade prompt instead of sending invite
    if (isTrial) {
      setState('upgrade');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await onInvite({
        email: email.trim().toLowerCase(),
        name: name.trim() || undefined,
        relationshipType: relationshipType as RelationshipType,  // Validated above
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

              <div className="space-y-2">
                <Label htmlFor="relationship-type">
                  Relationship Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={relationshipType || undefined}
                  onValueChange={(value) => setRelationshipType(value as RelationshipType)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="relationship-type" className="pl-9">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <SelectValue placeholder="Select relationship type" />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Describes your relationship with this client.
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
        ) : state === 'success' ? (
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
        ) : state === 'upgrade' ? (
          /* US-CT03: Upgrade prompt for trial users */
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Upgrade to Invite Real Clients
              </DialogTitle>
              <DialogDescription>
                Your trial includes 2 mock clients to explore the platform.
                Upgrade to invite and work with real clients.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Feature comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-muted/30">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-muted-foreground" />
                    Trial
                  </h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="text-amber-500">●</span>
                      2 mock clients
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✕</span>
                      Real client invites
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✕</span>
                      White-label
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-red-500">✕</span>
                      Priority processing
                    </li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Consultant
                  </h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Unlimited clients
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Real client invites
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      White-label
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-green-500">✓</span>
                      Priority processing
                    </li>
                  </ul>
                </div>
              </div>

              {/* Pricing */}
              <div className="text-center p-4 rounded-lg bg-gradient-to-r from-primary/10 to-purple-500/10 border">
                <p className="text-2xl font-bold">$149<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <p className="text-sm text-muted-foreground mt-1">Cancel anytime</p>
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setState('form')}
              >
                Back
              </Button>
              <Button asChild>
                <Link href="/pricing?plan=consultant">
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade Now
                </Link>
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export default InviteClientModal;
