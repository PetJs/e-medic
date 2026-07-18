import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

interface Plan {
  id: string;
  name: string;
  amount: number; // minor units (kobo)
  currency: string;
  interval: string;
  features: string[];
}

interface InitiatePaymentResponse {
  authorization_url: string;
  reference: string;
}

function formatAmount(amountMinor: number, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(amountMinor / 100);
}

export default function Subscribe() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    api<Plan[]>("/plans")
      .then((plans) => setPlan(plans?.[0] ?? null))
      .catch(() => setError("Could not load subscription plan."));
  }, []);

  async function handlePay() {
    if (!plan) return;
    setError(null);
    setPaying(true);
    try {
      const res = await api<InitiatePaymentResponse>("/payments", {
        method: "POST",
        body: { plan_id: plan.id },
      });
      // Hand off to Paystack's hosted checkout
      window.location.href = res.authorization_url;
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to start payment.");
      setPaying(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <span className="text-sm font-bold">Jerome's Medical E-Learning</span>
          <Link
            to="/dashboard"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" /> Back
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-extrabold tracking-tight">Unlock Full Access</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Join Jerome's Monthly Access to get all video tutorials, study modules,
          and community access.
        </p>

        <div className="mt-8 grid gap-8 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-4">
              <p className="font-semibold">Jerome's Monthly Access</p>
              {plan ? (
                <p>
                  <span className="text-3xl font-extrabold">
                    {formatAmount(plan.amount, plan.currency)}
                  </span>
                  <span className="text-sm text-muted-foreground"> / {plan.interval}</span>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Loading plan…</p>
              )}
              <hr />
              <ul className="space-y-2 text-sm">
                {(plan?.features?.length
                  ? plan.features
                  : [
                      "All Video Tutorials",
                      "All Study Modules",
                      "Community Access",
                      "Expert Q&A Sessions",
                    ]
                ).map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle2 className="size-4 text-emerald-500" /> {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="font-semibold">Secure Payment</h2>
            {error && (
              <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}
            <Card>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  You'll be securely redirected to Paystack to complete your
                  payment with card, bank transfer, or USSD.
                </p>
                <p className="text-sm">
                  Paying as{" "}
                  <span className="font-medium">{user?.email}</span>
                </p>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePay}
                  disabled={!plan || paying}
                >
                  {paying
                    ? "Redirecting to Paystack…"
                    : plan
                      ? `Pay ${formatAmount(plan.amount, plan.currency)} Now`
                      : "Loading…"}
                </Button>
                <p className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="size-3.5" /> Secure payments by Paystack
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
