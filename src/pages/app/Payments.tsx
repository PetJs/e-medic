import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CalendarClock,
  CreditCard,
  Receipt,
  RefreshCw,
  Wallet,
} from "lucide-react";
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
import { StatCard } from "@/components/StatCard";
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
import {
  accessEndsAt,
  findActiveSubscription,
  isInGrace,
} from "@/lib/subscription";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion";
import type { Payment, Subscription } from "@/types/api";

function formatAmount(amountKobo: number, currency: string) {
  const amount = amountKobo / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "NGN",
  }).format(amount);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusBadgeVariant(status: Payment["status"]) {
  return status === "completed" ? "success" : status === "failed" ? "destructive" : "secondary";
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
        setSubscription(findActiveSubscription(subs));
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

  const isCanceling = !!subscription?.canceled_at;
  const inGrace = isInGrace(subscription);
  const accessEnd = subscription ? accessEndsAt(subscription) : null;
  const currency = payments[0]?.currency || "NGN";
  const totalPaid = payments
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const statusIcon =
    subscription && (isCanceling || inGrace) ? CalendarClock : CreditCard;
  const statusTone = subscription
    ? isCanceling || inGrace
      ? "amber"
      : "success"
    : "primary";
  const StatusIcon = statusIcon;

  return (
    <div className="space-y-6">
      <PageHeader title="Payments" description="Your subscription and payment history." />

      {!loading && payments.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <StatCard
            label="Total Paid"
            value={formatAmount(totalPaid, currency)}
            icon={Wallet}
            tone="success"
          />
          <StatCard
            label="Payments Made"
            value={payments.length}
            icon={Receipt}
            delay={0.05}
          />
        </div>
      )}

      <motion.div initial="hidden" animate="show" variants={fadeInUp()}>
        <Card className={cn(isCanceling && "border-brand-amber/30")}>
          <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <span
                className={cn(
                  "inline-flex size-12 shrink-0 items-center justify-center rounded-xl",
                  statusTone === "success" && "bg-success/15 text-success",
                  statusTone === "amber" && "bg-brand-amber/15 text-brand-amber-foreground",
                  statusTone === "primary" && "bg-primary/10 text-primary"
                )}
              >
                <StatusIcon className="size-5" strokeWidth={2} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">Monthly Access</p>
                  {subscription && (
                    <Badge variant={isCanceling || inGrace ? "premium" : "success"}>
                      {inGrace ? "Payment due" : isCanceling ? "Ending soon" : "Active"}
                    </Badge>
                  )}
                </div>
                <p className="mt-1 font-body text-sm text-muted-foreground">
                  {subscription
                    ? inGrace
                      ? `Grace period — renew by ${formatDate(
                          accessEnd!.toISOString()
                        )} to keep access`
                      : isCanceling
                        ? `Access ends ${formatDate(subscription.current_period_end)} — won't renew`
                        : `Renews on ${formatDate(subscription.current_period_end)}`
                    : "Subscribe to unlock all modules."}
                </p>
              </div>
            </div>
            {inGrace ? (
              <Button asChild>
                <Link to="/subscribe">Pay Now</Link>
              </Button>
            ) : subscription ? (
              isCanceling ? (
                <Button variant="outline" asChild>
                  <Link to="/subscribe">
                    <RefreshCw className="size-4" /> Renew Now
                  </Link>
                </Button>
              ) : (
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
      </motion.div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">History</h2>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="No payments yet."
            description="Your subscription payments will show up here once you subscribe."
          />
        ) : (
          <motion.div initial="hidden" animate="show" variants={fadeInUp(0.05)} className="space-y-2">
            {/* Mobile: stacked cards — a 5-column table doesn't fit a phone width */}
            <div className="space-y-2 sm:hidden">
              {payments.map((p) => (
                <div key={p.id} className="rounded-xl border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(p.created_at)}
                    </span>
                    <Badge variant={statusBadgeVariant(p.status)}>{p.status}</Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-medium tabular-nums">
                      {formatAmount(p.amount, p.currency)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CreditCard className="size-3.5" />
                      <span className="capitalize">{p.provider}</span>
                    </span>
                  </div>
                  {p.status !== "completed" && (
                    <Button variant="outline" size="sm" className="mt-3 w-full" asChild>
                      <Link to="/subscribe">
                        <RefreshCw className="size-3.5" /> Retry
                      </Link>
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop/tablet: table */}
            <Card className="hidden overflow-hidden py-0 sm:block">
              <div className="overflow-x-auto">
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
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(p.created_at)}
                        </TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {formatAmount(p.amount, p.currency)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <CreditCard className="size-3.5" />
                            <span className="capitalize">{p.provider}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant(p.status)}>{p.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.status !== "completed" && (
                            <Button variant="outline" size="sm" asChild>
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
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll keep access to premium modules until{" "}
              {subscription && formatDate(subscription.current_period_end)}, then it won't
              renew.
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
