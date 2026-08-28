import { useEffect, useState } from "react";
import { CreditCard, TrendingUp, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { TrendStatCard } from "@/components/TrendStatCard";
import { ModuleCompletionChart } from "@/components/ModuleCompletionChart";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { AdminAnalytics } from "@/types/api";

const RANGE_PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

function formatAmount(amountKobo: number, currency: string) {
  const amount = amountKobo / 100;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

function sum(values: { value: number }[]) {
  return values.reduce((total, v) => total + v.value, 0);
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<AdminAnalytics>(`/admin/stats/analytics?days=${days}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Trends and per-module completion rates." />

      <div className="flex gap-2">
        {RANGE_PRESETS.map((preset) => (
          <Button
            key={preset.days}
            size="sm"
            variant={days === preset.days ? "default" : "outline"}
            onClick={() => setDays(preset.days)}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {loading || !data ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className={cn("grid gap-4 sm:grid-cols-3")}>
          <TrendStatCard
            label={`Revenue (${days}d)`}
            value={formatAmount(sum(data.revenue_trend), data.currency)}
            icon={CreditCard}
            trend={data.revenue_trend}
            tone="amber"
            formatValue={(v) => formatAmount(v, data.currency)}
          />
          <TrendStatCard
            label={`New Students (${days}d)`}
            value={sum(data.signup_trend).toLocaleString()}
            icon={Users}
            trend={data.signup_trend}
            tone="primary"
            delay={0.05}
          />
          <TrendStatCard
            label={`New Subscriptions (${days}d)`}
            value={sum(data.subscription_trend).toLocaleString()}
            icon={TrendingUp}
            trend={data.subscription_trend}
            tone="success"
            delay={0.1}
          />
        </div>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Module Completion Rates</h2>
        {loading || !data ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : (
          <ModuleCompletionChart data={data.module_completion_rates} />
        )}
      </div>
    </div>
  );
}
