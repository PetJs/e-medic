import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Payment, Subscription } from "@/types/api";

function formatAmount(amountKobo: number, currency: string) {
  const amount = amountKobo / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "NGN",
  }).format(amount);
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ payments: Payment[] }>("/payments").catch(() => null),
      api<Subscription[]>("/subscriptions").catch(() => [] as Subscription[]),
    ])
      .then(([pays, subs]) => {
        setPayments(pays?.payments ?? []);
        setSubscription(subs?.find((s) => s.status === "active") ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your subscription and payment history.
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center justify-between">
          <div>
            <p className="font-semibold">
              {subscription ? "Monthly Access — Active" : "No active subscription"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {subscription
                ? `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                : "Subscribe to unlock all modules."}
            </p>
          </div>
          {!subscription && (
            <Button asChild>
              <Link to="/subscribe">Subscribe</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : payments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <CreditCard className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">No payments yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-xl border bg-background">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Provider</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatAmount(p.amount, p.currency)}
                    </td>
                    <td className="px-4 py-3 capitalize">{p.provider}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          p.status === "completed"
                            ? "success"
                            : p.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
