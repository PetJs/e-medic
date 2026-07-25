import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { scaleIn } from "@/lib/motion";

type Status = "verifying" | "success" | "failed";

export default function PaymentCallback() {
  const [params] = useSearchParams();
  const [status, setStatus] = useState<Status>("verifying");

  const reference = params.get("reference") ?? params.get("trxref");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }
    let cancelled = false;
    let attempts = 0;
    const verify = () => {
      api<{ status: string }>("/payments/verify", {
        method: "POST",
        body: { reference },
      })
        .then((res) => {
          if (cancelled) return;
          if (res.status === "success") {
            setStatus("success");
          } else if (res.status === "pending" && attempts < 5) {
            // Paystack may still be settling the charge — retry briefly
            attempts += 1;
            setTimeout(verify, 3000);
          } else {
            setStatus("failed");
          }
        })
        .catch(() => {
          if (!cancelled) setStatus("failed");
        });
    };
    verify();
    return () => {
      cancelled = true;
    };
  }, [reference]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={status}
          initial="hidden"
          animate="show"
          variants={scaleIn()}
          className="w-full max-w-md rounded-2xl border bg-card p-10 text-center shadow-xl"
        >
          {status === "verifying" && (
            <>
              <Loader2 className="mx-auto size-10 animate-spin text-primary" />
              <h1 className="mt-4 text-xl font-bold">Verifying your payment…</h1>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                Hold on while we confirm your transaction with Paystack.
              </p>
            </>
          )}
          {status === "success" && (
            <>
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-8" />
              </span>
              <h1 className="mt-4 text-xl font-bold">Payment successful!</h1>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                Your subscription is now active. Every module is unlocked — happy
                learning!
              </p>
              <Button className="mt-6 w-full" asChild>
                <Link to="/modules">Start Learning</Link>
              </Button>
            </>
          )}
          {status === "failed" && (
            <>
              <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <XCircle className="size-8" />
              </span>
              <h1 className="mt-4 text-xl font-bold">Payment not confirmed</h1>
              <p className="mt-2 font-body text-sm text-muted-foreground">
                We couldn't verify this payment. If you were charged, it will be
                reconciled automatically — or contact support.
              </p>
              <div className="mt-6 flex gap-3">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/dashboard">Go to Dashboard</Link>
                </Button>
                <Button className="flex-1" asChild>
                  <Link to="/subscribe">Try Again</Link>
                </Button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
