import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBilling } from '../hooks/use-billing.js';

/**
 * Landing page Stripe Checkout redirects back to (both success and cancel).
 * Refreshes billing status — the webhook may take a couple of seconds to
 * land, so we retry a few times before giving up. Either way, bounces the
 * user back to `?to=...` (the path they were on when the paywall fired).
 */
export function BillingReturnPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useBilling();
  const status = params.get('status');
  const to = params.get('to') || '/';

  useEffect(() => {
    let cancelled = false;
    let attempt = 0;

    async function tryRefresh() {
      if (cancelled) return;
      await refresh();
      // Cancel is instant — no need to wait for a webhook.
      if (status === 'cancel' || attempt >= 4) {
        if (!cancelled) navigate(to, { replace: true });
        return;
      }
      attempt += 1;
      window.setTimeout(tryRefresh, 1_000);
    }

    void tryRefresh();
    return () => {
      cancelled = true;
    };
  }, [refresh, navigate, status, to]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-sm text-center">
        <div className="mb-4 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
          {status === 'success' ? 'Payment received' : 'Payment cancelled'}
        </div>
        <h1 className="mb-2 font-display text-2xl font-bold tracking-tight">
          {status === 'success' ? 'Crediting your account…' : 'Returning to Counsel'}
        </h1>
        <p className="text-sm text-muted-foreground">
          {status === 'success'
            ? 'One moment while we sync your balance — Stripe is sending the confirmation.'
            : 'No charge was made. You can add credits any time from Billing.'}
        </p>
      </div>
    </div>
  );
}
