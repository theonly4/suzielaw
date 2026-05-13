import { useCallback, useEffect, useState } from 'react';

export interface BillingStatus {
  credit_balance: number;
  auto_recharge: boolean;
  billing_status: 'active' | 'suspended' | 'pending' | 'exempt';
  has_payment_method: boolean;
}

export interface BillingTransaction {
  id: string;
  org_id: string;
  type: 'topup' | 'deduction' | 'refund' | 'adjustment' | 'initial';
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

interface BillingApi {
  billing: BillingStatus | null;
  orgId: string | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  /**
   * Kick off the Stripe Checkout flow for the org's initial credit purchase.
   * `returnTo` is where the browser comes back to after success/cancel —
   * typically the current pathname so the user lands where they left off.
   * Returns the checkout URL it redirected to (or null on failure).
   */
  startSetup: (returnTo: string) => Promise<string | null>;
  /** Same as startSetup but for ongoing top-ups (org must already have billing). */
  startTopup: (returnTo: string) => Promise<string | null>;
  setAutoRecharge: (enabled: boolean) => Promise<void>;
}

function buildReturnUrls(returnTo: string): { success_url: string; cancel_url: string } {
  const origin = window.location.origin;
  // The /billing/return route refreshes billing state and bounces to returnTo.
  // We pass returnTo through the query string so both success and cancel land
  // back where the user originally was.
  const params = new URLSearchParams({ to: returnTo });
  return {
    success_url: `${origin}/billing/return?${new URLSearchParams({ ...Object.fromEntries(params), status: 'success' }).toString()}`,
    cancel_url: `${origin}/billing/return?${new URLSearchParams({ ...Object.fromEntries(params), status: 'cancel' }).toString()}`,
  };
}

export function useBilling(): BillingApi {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/billing/status', { credentials: 'include' });
      if (!res.ok) {
        throw new Error(`Billing status request failed (${res.status})`);
      }
      const data = (await res.json()) as {
        billing: BillingStatus | null;
        org_id: string | null;
      };
      setBilling(data.billing);
      setOrgId(data.org_id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing');
      setBilling(null);
      setOrgId(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const startSetup = useCallback(async (returnTo: string): Promise<string | null> => {
    const urls = buildReturnUrls(returnTo);
    try {
      const res = await fetch('/api/billing/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(urls),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        throw new Error(data.message || data.error || `Setup failed (${res.status})`);
      }
      const data = (await res.json()) as { checkout_url: string };
      window.location.href = data.checkout_url;
      return data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      return null;
    }
  }, []);

  const startTopup = useCallback(async (returnTo: string): Promise<string | null> => {
    const urls = buildReturnUrls(returnTo);
    try {
      const res = await fetch('/api/billing/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(urls),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
        throw new Error(data.message || data.error || `Top-up failed (${res.status})`);
      }
      const data = (await res.json()) as { checkout_url: string };
      window.location.href = data.checkout_url;
      return data.checkout_url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start top-up');
      return null;
    }
  }, []);

  const setAutoRecharge = useCallback(async (enabled: boolean) => {
    try {
      const res = await fetch('/api/billing/auto-recharge', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        throw new Error(`Update failed (${res.status})`);
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update auto-recharge');
    }
  }, [refresh]);

  return { billing, orgId, loading, error, refresh, startSetup, startTopup, setAutoRecharge };
}
