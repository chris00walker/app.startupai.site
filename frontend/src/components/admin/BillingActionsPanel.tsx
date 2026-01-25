'use client';

/**
 * Billing Actions Panel Component
 *
 * Admin component to view and manage user billing.
 *
 * @story US-A12
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Loader2,
  AlertCircle,
  RefreshCw,
  DollarSign,
  Gift,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BillingInfo {
  subscriptionTier: string;
  subscriptionStatus: string;
  planStatus: string;
  trialExpiresAt: string | null;
  stripeCustomerId: string | null;
  actions: {
    canRetryPayment: boolean;
    canRefund: boolean;
    canApplyCredit: boolean;
    stripeIntegrationPending: boolean;
  };
}

interface BillingActionsPanelProps {
  userId: string;
  userEmail: string;
}

type CreditType = 'trial_extension' | 'compensation' | 'promotional' | 'other';

export function BillingActionsPanel({ userId, userEmail }: BillingActionsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState<BillingInfo | null>(null);
  const [creditDialogOpen, setCreditDialogOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditType, setCreditType] = useState<CreditType>('trial_extension');
  const [creditReason, setCreditReason] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    fetchBillingInfo();
  }, [userId]);

  const fetchBillingInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/billing`);
      const data = await response.json();

      if (data.success) {
        setBillingInfo(data.data);
      } else {
        console.error('Failed to fetch billing info:', data.error);
      }
    } catch (error) {
      console.error('Billing fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCredit = async () => {
    if (!creditAmount || !creditReason.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setApplying(true);

    try {
      const response = await fetch(`/api/admin/users/${userId}/billing/credit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(creditAmount),
          type: creditType,
          reason: creditReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.data.message);
        setCreditDialogOpen(false);
        setCreditAmount('');
        setCreditReason('');
        fetchBillingInfo(); // Refresh
      } else {
        toast.error(data.error?.message || 'Failed to apply credit');
      }
    } catch (error) {
      console.error('Credit error:', error);
      toast.error('Failed to apply credit');
    } finally {
      setApplying(false);
    }
  };

  const handleRetryPayment = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/billing/retry`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Payment retry initiated');
      } else {
        toast.error(data.error?.message || 'Failed to retry payment');
      }
    } catch (error) {
      console.error('Retry error:', error);
      toast.error('Failed to retry payment');
    }
  };

  if (loading) {
    return (
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-muted rounded animate-pulse" />
            <div className="h-3 w-48 bg-muted rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (!billingInfo) {
    return (
      <div className="border rounded-lg p-4">
        <div className="flex items-center gap-3 text-muted-foreground">
          <AlertCircle className="h-5 w-5" />
          <span>Unable to load billing information</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="border rounded-lg">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <CreditCard className="h-5 w-5 mt-0.5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">Billing & Subscription</h4>
                <p className="text-sm text-muted-foreground">
                  Manage billing for {userEmail}
                </p>
              </div>
            </div>

            {billingInfo.actions.stripeIntegrationPending && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                <AlertCircle className="h-3 w-3 mr-1" />
                Stripe Pending
              </Badge>
            )}
          </div>

          {/* Current Status */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label className="text-muted-foreground">Tier</label>
              <p className="font-medium capitalize">{billingInfo.subscriptionTier}</p>
            </div>
            <div>
              <label className="text-muted-foreground">Status</label>
              <p className="font-medium capitalize">{billingInfo.subscriptionStatus || 'None'}</p>
            </div>
            <div>
              <label className="text-muted-foreground">Plan Status</label>
              <p className="font-medium capitalize">{billingInfo.planStatus}</p>
            </div>
            {billingInfo.trialExpiresAt && (
              <div>
                <label className="text-muted-foreground">Trial Expires</label>
                <p className="font-medium flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(billingInfo.trialExpiresAt), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t p-4 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetryPayment}
            disabled={!billingInfo.actions.canRetryPayment}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry Payment
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!billingInfo.actions.canRefund}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Process Refund
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreditDialogOpen(true)}
            disabled={!billingInfo.actions.canApplyCredit}
          >
            <Gift className="h-4 w-4 mr-2" />
            Apply Credit
          </Button>
        </div>
      </div>

      {/* Credit Dialog */}
      <Dialog open={creditDialogOpen} onOpenChange={setCreditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Credit</DialogTitle>
            <DialogDescription>
              Apply a credit to {userEmail}'s account
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Credit Type</label>
              <Select
                value={creditType}
                onValueChange={(v) => setCreditType(v as CreditType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial_extension">Trial Extension (days)</SelectItem>
                  <SelectItem value="compensation">Compensation ($)</SelectItem>
                  <SelectItem value="promotional">Promotional ($)</SelectItem>
                  <SelectItem value="other">Other ($)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                {creditType === 'trial_extension' ? 'Days to Extend' : 'Amount ($)'}
              </label>
              <Input
                type="number"
                min="0"
                step={creditType === 'trial_extension' ? '1' : '0.01'}
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder={creditType === 'trial_extension' ? '7' : '10.00'}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Reason <span className="text-red-500">*</span>
              </label>
              <Textarea
                value={creditReason}
                onChange={(e) => setCreditReason(e.target.value)}
                placeholder="Explain why you're applying this credit..."
                rows={3}
              />
            </div>

            {creditType !== 'trial_extension' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                <AlertCircle className="h-4 w-4 inline mr-2" />
                Monetary credits require Stripe integration (coming soon).
                This action will be logged for manual processing.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreditDialogOpen(false)}
              disabled={applying}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApplyCredit}
              disabled={applying || !creditAmount || !creditReason.trim()}
            >
              {applying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Gift className="h-4 w-4 mr-2" />
              )}
              Apply Credit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
