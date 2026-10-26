import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { DeltaBadge } from "@/components/analytics/DeltaBadge";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion";
import { formatShortDate, type Delta } from "@/lib/analytics";
import type { DailyMetric } from "@/types/api";

const TONE = {
  primary: {
    accent: "var(--chart-1)",
    icon: "bg-primary/10 text-primary",
  },
  amber: {
    accent: "var(--chart-2)",
    icon: "bg-brand-amber/15 text-brand-amber-foreground",
  },
  success: {
    accent: "var(--chart-3)",
    icon: "bg-success/15 text-success",
  },
} as const;

function SparkTooltip({
  active,
  payload,
  formatValue,
}: {
  active?: boolean;
  payload?: { payload: DailyMetric }[];
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-2 py-1 text-xs shadow-sm">
      <span className="font-semibold text-popover-foreground">
        {formatValue(point.value)}
      </span>
      <span className="ml-1.5 text-muted-foreground">{formatShortDate(point.date)}</span>
    </div>
  );
}

function Sparkline({
  trend,
  accent,
  formatValue,
}: {
  trend: DailyMetric[];
  accent: string;
  formatValue: (value: number) => string;
}) {
  const lastIndex = trend.length - 1;

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={trend} margin={{ top: 4, right: 5, bottom: 4, left: 0 }}>
        <Tooltip
          content={<SparkTooltip formatValue={formatValue} />}
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="var(--muted-foreground)"
          strokeWidth={1.5}
          strokeOpacity={0.55}
          isAnimationActive={false}
          dot={(props: { cx?: number; cy?: number; index?: number }) => {
            const { cx, cy, index } = props;
            if (index !== lastIndex || cx == null || cy == null) {
              return <g key={`dot-${index}`} />;
            }
            return (
              <circle
                key={`dot-${index}`}
                cx={cx}
                cy={cy}
                r={3.5}
                fill={accent}
                stroke="var(--card)"
                strokeWidth={2}
              />
            );
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Compact KPI tile: label, value, optional period delta and sparkline, or a
 * meter for a snapshot ratio.
 */
export function MetricTile({
  label,
  value,
  icon: Icon,
  tone = "primary",
  trend,
  delta,
  deltaLabel,
  meter,
  formatValue = (v) => v.toLocaleString(),
  delay = 0,
  className,
}: {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  tone?: keyof typeof TONE;
  trend?: DailyMetric[];
  delta?: Delta;
  deltaLabel?: string;
  meter?: { value: number; label: string };
  formatValue?: (value: number) => string;
  delay?: number;
  className?: string;
}) {
  const palette = TONE[tone];
  const meterValue = Math.min(100, Math.max(0, meter?.value ?? 0));

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeInUp(delay)}
      className={cn("flex h-full", className)}
    >
      <Card className="h-full w-full gap-0 py-4">
        <CardContent className="flex h-full flex-col px-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="mt-1 text-3xl font-semibold leading-none tracking-tight text-foreground">
                {value}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                palette.icon
              )}
            >
              <Icon className="size-4.5" strokeWidth={2} aria-hidden />
            </span>
          </div>

          {meter ? (
            <div className="mt-auto space-y-2 pt-3">
              <div className="h-2 overflow-hidden rounded-full bg-primary/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${meterValue}%` }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <p className="truncate text-[11px] text-muted-foreground">{meter.label}</p>
            </div>
          ) : trend && trend.length > 1 ? (
            <div className="mt-auto flex items-end justify-between gap-3 pt-3">
              <div className="min-w-0">
                {delta && <DeltaBadge delta={delta} />}
                {deltaLabel && (
                  <p className="mt-1 truncate text-[11px] text-muted-foreground">
                    {deltaLabel}
                  </p>
                )}
              </div>
              <div className="h-9 w-24 shrink-0" aria-hidden>
                <Sparkline
                  trend={trend}
                  accent={palette.accent}
                  formatValue={formatValue}
                />
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </motion.div>
  );
}
