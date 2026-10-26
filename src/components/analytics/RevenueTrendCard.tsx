import { useState } from "react";
import { BarChart3, CircleDollarSign, CreditCard, Table2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { DeltaBadge } from "@/components/analytics/DeltaBadge";
import { fadeInUp } from "@/lib/motion";
import {
  formatLongDate,
  formatMoney,
  formatShortDate,
  peakDay,
  type Delta,
} from "@/lib/analytics";
import type { DailyMetric } from "@/types/api";

function RevenueTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean;
  payload?: { payload: DailyMetric }[];
  currency: string;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="text-sm font-semibold text-popover-foreground">
        {formatMoney(point.value, currency)}
      </p>
      <p className="mt-0.5 text-muted-foreground">{formatLongDate(point.date)}</p>
    </div>
  );
}

/**
 * The dashboard's hero figure: total revenue for the selected period, with a
 * single-series daily area chart and a table-view twin.
 */
export function RevenueTrendCard({
  series,
  total,
  delta,
  days,
  currency,
  className,
  delay = 0,
}: {
  series: DailyMetric[];
  total: number;
  delta: Delta;
  days: number;
  currency: string;
  className?: string;
  delay?: number;
}) {
  const [showTable, setShowTable] = useState(false);
  const best = peakDay(series);
  const average = days > 0 ? total / days : 0;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeInUp(delay)}
      className={className}
    >
      <Card className="relative h-full gap-0 overflow-hidden py-0">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-primary/[0.07] via-primary/[0.025] to-transparent"
        />
        <CardContent className="relative flex h-full flex-col px-6 pb-4 pt-6">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <CreditCard className="size-4" aria-hidden />
                </span>
                Revenue
              </div>
              <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-2">
                <p className="text-4xl font-semibold leading-none tracking-tight text-foreground sm:text-5xl">
                  {formatMoney(total, currency)}
                </p>
                <DeltaBadge delta={delta} className="mb-1" />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Completed payments · last {days} days · compared with the previous{" "}
                {days} days
              </p>
            </div>

            <div className="flex items-start gap-6">
              <div>
                <p className="text-xs text-muted-foreground">Daily average</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                  {formatMoney(average, currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best day</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
                  {best ? formatMoney(best.value, currency) : "—"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {best ? formatShortDate(best.date) : "No activity"}
                </p>
              </div>
              {total > 0 && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowTable((value) => !value)}
                  aria-label={showTable ? "Show revenue chart" : "Show revenue table"}
                  aria-pressed={showTable}
                  title={showTable ? "Show chart" : "Show table"}
                  className="text-muted-foreground"
                >
                  {showTable ? (
                    <BarChart3 className="size-4" aria-hidden />
                  ) : (
                    <Table2 className="size-4" aria-hidden />
                  )}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 h-[250px]">
            {total === 0 ? (
              <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 px-6 text-center">
                <CircleDollarSign
                  className="size-7 text-muted-foreground"
                  aria-hidden
                />
                <p className="mt-2 text-sm font-medium text-foreground">
                  No completed payments yet
                </p>
                <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                  Revenue appears here as soon as a payment completes in this
                  period.
                </p>
              </div>
            ) : showTable ? (
              <div className="h-full overflow-y-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-3">Date</TableHead>
                      <TableHead className="pr-3 text-right">Revenue</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...series].reverse().map((row) => (
                      <TableRow key={row.date}>
                        <TableCell className="pl-3 text-muted-foreground">
                          {formatLongDate(row.date)}
                        </TableCell>
                        <TableCell className="pr-3 text-right tabular-nums">
                          {formatMoney(row.value, currency)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div
                role="img"
                aria-label={`Daily revenue over the last ${days} days`}
                className="h-full w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={series}
                    margin={{ top: 8, right: 4, bottom: 0, left: 0 }}
                  >
                    <defs>
                      <linearGradient id="revenue-wash" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="0%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.16}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--chart-1)"
                          stopOpacity={0.01}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      vertical={false}
                      stroke="var(--border)"
                      strokeWidth={1}
                    />
                    <XAxis
                      dataKey="date"
                      tickFormatter={formatShortDate}
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                      minTickGap={28}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tickFormatter={(value: number) =>
                        formatMoney(value, currency, { compact: true })
                      }
                      tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      width={70}
                      tickCount={5}
                    />
                    <Tooltip
                      content={<RevenueTooltip currency={currency} />}
                      cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--chart-1)"
                      strokeWidth={2}
                      fill="url(#revenue-wash)"
                      dot={false}
                      isAnimationActive={false}
                      activeDot={{
                        r: 4.5,
                        fill: "var(--chart-1)",
                        stroke: "var(--card)",
                        strokeWidth: 2,
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
