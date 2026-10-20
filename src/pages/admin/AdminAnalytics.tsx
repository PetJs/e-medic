import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Target, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricTile } from "@/components/analytics/MetricTile";
import { ModuleCompletionCard } from "@/components/analytics/ModuleCompletionCard";
import { RevenueTrendCard } from "@/components/analytics/RevenueTrendCard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { compareTotals, formatNumber, splitPeriod } from "@/lib/analytics";
import type { AdminAnalytics } from "@/types/api";

const RANGE_PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

function RangePicker({
  days,
  onChange,
}: {
  days: number;
  onChange: (days: number) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Date range"
      className="inline-flex items-center rounded-full border bg-card p-1 shadow-xs"
    >
      {RANGE_PRESETS.map((preset) => {
        const active = preset.days === days;
        return (
          <button
            key={preset.days}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(preset.days)}
            className={cn(
              "relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              active
                ? "text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {active && (
              <motion.span
                layoutId="analytics-range-pill"
                className="absolute inset-0 rounded-full bg-primary shadow-sm"
                transition={{ type: "spring", bounce: 0.15, duration: 0.45 }}
              />
            )}
            <span className="relative">{preset.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function AnalyticsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <div className="grid gap-4 lg:grid-cols-12">
        <Skeleton className="h-[410px] rounded-xl lg:col-span-8" />
        <div className="grid gap-4 sm:grid-cols-3 lg:col-span-4 lg:grid-rows-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl lg:h-full" />
          ))}
        </div>
      </div>
      <Skeleton className="h-80 rounded-xl" />
    </div>
  );
}

function AnalyticsError({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center px-6 py-14 text-center">
        <span className="inline-flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" aria-hidden />
        </span>
        <p className="mt-4 font-semibold text-foreground">
          We couldn't load your analytics
        </p>
        <p className="mt-1 max-w-sm font-body text-sm text-muted-foreground">
          Check your connection and try again. Your data is safe.
        </p>
        <Button size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      </CardContent>
    </Card>
  );
}

function RefreshError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm">
      <span className="font-body text-destructive">
        Couldn't refresh these numbers. Showing the last successful load.
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive"
        onClick={onRetry}
      >
        Retry
      </Button>
    </div>
  );
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const hasLoaded = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // Fetch two periods so the headline numbers can compare against the
    // immediately preceding window. The extra query scope is cheap and needs
    // no extra endpoint.
    api<AdminAnalytics>(`/admin/stats/analytics?days=${days * 2}`)
      .then((response) => {
        if (cancelled) return;
        setData(response);
        hasLoaded.current = true;
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [days, reloadToken]);

  const periods = useMemo(() => {
    if (!data) return null;
    return {
      revenue: splitPeriod(data.revenue_trend, days),
      signups: splitPeriod(data.signup_trend, days),
      subscriptions: splitPeriod(data.subscription_trend, days),
    };
  }, [data, days]);

  const completion = data?.module_completion_rates ?? [];
  const averageCompletion =
    completion.length > 0
      ? completion.reduce((total, row) => total + row.completion_pct, 0) /
        completion.length
      : 0;

  function selectRange(next: number) {
    if (next === days) return;
    setError(false);
    if (hasLoaded.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setDays(next);
  }

  function reload() {
    setError(false);
    if (hasLoaded.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setReloadToken((token) => token + 1);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Revenue, growth, and course completion across your academy."
        actions={<RangePicker days={days} onChange={selectRange} />}
      />

      {error && data && <RefreshError onRetry={reload} />}

      {loading && !data ? (
        <AnalyticsSkeleton />
      ) : error && !data ? (
        <AnalyticsError onRetry={reload} />
      ) : data && periods ? (
        <div
          className={cn(
            "space-y-6 transition-opacity duration-200",
            refreshing && "opacity-60"
          )}
          aria-busy={refreshing}
        >
          <div className="grid gap-4 lg:grid-cols-12">
            <RevenueTrendCard
              className="lg:col-span-8"
              series={periods.revenue.current}
              total={periods.revenue.currentTotal}
              delta={compareTotals(
                periods.revenue.currentTotal,
                periods.revenue.previousTotal
              )}
              days={days}
              currency={data.currency}
            />

            <div className="grid gap-4 sm:grid-cols-3 lg:col-span-4 lg:grid-cols-1 lg:grid-rows-3">
              <MetricTile
                label="New students"
                value={formatNumber(periods.signups.currentTotal)}
                icon={Users}
                tone="amber"
                trend={periods.signups.current}
                delta={compareTotals(
                  periods.signups.currentTotal,
                  periods.signups.previousTotal
                )}
                deltaLabel={`vs previous ${days} days`}
                delay={0.05}
              />
              <MetricTile
                label="New subscriptions"
                value={formatNumber(periods.subscriptions.currentTotal)}
                icon={TrendingUp}
                tone="success"
                trend={periods.subscriptions.current}
                delta={compareTotals(
                  periods.subscriptions.currentTotal,
                  periods.subscriptions.previousTotal
                )}
                deltaLabel={`vs previous ${days} days`}
                delay={0.1}
              />
              <MetricTile
                label="Avg. completion"
                value={`${averageCompletion.toFixed(0)}%`}
                icon={Target}
                tone="primary"
                meter={{
                  value: averageCompletion,
                  label:
                    completion.length > 0
                      ? `Across ${completion.length} module${
                          completion.length === 1 ? "" : "s"
                        }`
                      : "No module activity yet",
                }}
                delay={0.15}
              />
            </div>
          </div>

          <ModuleCompletionCard data={completion} delay={0.1} />
        </div>
      ) : null}
    </div>
  );
}
