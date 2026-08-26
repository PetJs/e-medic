import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { CreditCard, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { api, ApiError } from "@/lib/api";
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
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [canceling, setCanceling] = useState(false);

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

  async function confirmCancelSubscription() {
    if (!subscription) return;
    setCanceling(true);
    try {
      await api(`/subscriptions/${subscription.id}`, { method: "DELETE" });
      setSubscription({ ...subscription, canceled_at: new Date().toISOString() });
      toast.success("Subscription canceled. You'll keep access until it expires.");
      setConfirmCancel(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to cancel subscription.");
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Your subscription and payment history." />

      <Card>
        <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold">
              {subscription
                ? subscription.canceled_at
                  ? "Monthly Access — Canceled"
                  : "Monthly Access — Active"
                : "No active subscription"}
            </p>
            <p className="mt-1 font-body text-sm text-muted-foreground">
              {subscription
                ? subscription.canceled_at
                  ? `Access ends ${new Date(subscription.current_period_end).toLocaleDateString()} — won't renew`
                  : `Renews on ${new Date(subscription.current_period_end).toLocaleDateString()}`
                : "Subscribe to unlock all modules."}
            </p>
          </div>
          {subscription ? (
            !subscription.canceled_at && (
              <Button variant="outline" onClick={() => setConfirmCancel(true)}>
                Cancel Subscription
              </Button>
            )
          ) : (
            <Button asChild>
              <Link to="/subscribe">Subscribe</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState icon={CreditCard} title="No payments yet." />
        ) : (
          <Card className="overflow-hidden py-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatAmount(p.amount, p.currency)}
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {p.provider}
                    </TableCell>
                    <TableCell>
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
                    </TableCell>
                    <TableCell className="text-right">
                      {p.status !== "completed" && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to="/subscribe">
                            <RefreshCw className="size-3.5" /> Retry
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll keep access to premium modules until{" "}
              {subscription && new Date(subscription.current_period_end).toLocaleDateString()},
              then it won't renew.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={canceling}>Keep Subscription</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                confirmCancelSubscription();
              }}
              disabled={canceling}
            >
              {canceling ? "Canceling…" : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
