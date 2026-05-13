import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@teamsuzie/ui';
import { useBilling } from '../hooks/use-billing.js';

interface PaywallDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Path the browser returns to after Stripe Checkout. Defaults to the
   * current pathname so the user lands back where they were when the
   * paywall fired (e.g. mid-chat).
   */
  returnTo?: string;
  /**
   * Tweak the copy depending on why the paywall opened. `no_billing` =
   * org has no OrgBilling row yet → trigger setup. `insufficient_credits`
   * = balance hit zero → trigger top-up.
   */
  reason?: 'no_billing' | 'insufficient_credits' | 'no_org' | 'generic';
}

export function PaywallDialog({
  open,
  onOpenChange,
  returnTo,
  reason = 'generic',
}: PaywallDialogProps) {
  const { billing, startSetup, startTopup } = useBilling();
  const [submitting, setSubmitting] = useState(false);

  const isTopUp = reason === 'insufficient_credits' && billing?.has_payment_method;
  const headline = isTopUp ? 'Out of credits' : 'Add credits to continue';
  const body = isTopUp
    ? 'Your credit balance has run out. Top up to keep using Counsel.'
    : 'Counsel runs on a pay-as-you-go credit balance. Add an initial credit to start using research and drafting features.';

  const handleClick = async () => {
    setSubmitting(true);
    const path = returnTo ?? window.location.pathname + window.location.search;
    const url = isTopUp ? await startTopup(path) : await startSetup(path);
    // If we get here without a redirect, startSetup/startTopup failed —
    // surface the in-hook error via re-enabling the button.
    if (!url) setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{headline}</DialogTitle>
          <DialogDescription>{body}</DialogDescription>
        </DialogHeader>
        {billing && (
          <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">
            <div className="flex justify-between font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <span>Current balance</span>
              <span>${billing.credit_balance.toFixed(2)}</span>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleClick} disabled={submitting}>
            {submitting ? 'Redirecting…' : isTopUp ? 'Top up' : 'Add credits'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
