import { useEffect, useState } from 'react';
import { Button, Card, Badge } from '@teamsuzie/ui';
import { useBilling, type BillingTransaction } from '../hooks/use-billing.js';

export function BillingPage() {
  const { billing, loading, refresh, startSetup, startTopup, setAutoRecharge } = useBilling();
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch('/api/billing/transactions?limit=20', { credentials: 'include' });
        if (!res.ok) return;
        const data = (await res.json()) as { transactions: BillingTransaction[] };
        if (!cancelled) setTransactions(data.transactions);
      } catch {
        // Best-effort — the rest of the page works without history.
      } finally {
        if (!cancelled) setTxLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [billing?.credit_balance]);

  const handleAddCredits = () => {
    void startSetup('/billing');
  };

  const handleTopUp = () => {
    void startTopup('/billing');
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <div className="mb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-foreground/55">
          Account · Billing
        </div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Credits & billing</h1>
      </div>

      <Card className="mb-6 p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Current balance
            </div>
            <div className="mt-1 font-display text-4xl font-bold tracking-tight">
              {billing ? `$${billing.credit_balance.toFixed(2)}` : loading ? '…' : '—'}
            </div>
            {billing && (
              <div className="mt-2 flex items-center gap-2">
                <Badge variant={billing.billing_status === 'active' ? 'default' : 'outline'}>
                  {billing.billing_status}
                </Badge>
                {billing.has_payment_method && (
                  <Badge variant="outline">card on file</Badge>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => void refresh()} disabled={loading}>
              Refresh
            </Button>
            {billing?.has_payment_method ? (
              <Button onClick={handleTopUp}>Top up</Button>
            ) : (
              <Button onClick={handleAddCredits}>Add credits</Button>
            )}
          </div>
        </div>

        {billing && billing.has_payment_method && (
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <div>
              <div className="text-sm font-medium">Auto-recharge</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                When enabled, your card is charged automatically when the balance drops below
                the threshold.
              </div>
            </div>
            <Button
              variant={billing.auto_recharge ? 'default' : 'outline'}
              size="sm"
              onClick={() => void setAutoRecharge(!billing.auto_recharge)}
            >
              {billing.auto_recharge ? 'On' : 'Off'}
            </Button>
          </div>
        )}
      </Card>

      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        Recent activity
      </div>
      <Card className="overflow-hidden">
        {txLoading ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : transactions.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No transactions yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/40 text-left font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">Amount</th>
                <th className="px-4 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-border/60 last:border-0">
                  <td className="px-4 py-2 font-mono text-xs">
                    {new Date(tx.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">
                    <Badge variant="outline">{tx.type}</Badge>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-muted-foreground">
                    ${tx.balance_after.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
