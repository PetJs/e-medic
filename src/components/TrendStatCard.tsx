import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Line, LineChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { fadeInUp } from "@/lib/motion"
import type { DailyMetric } from "@/types/api"

const TONE_VAR: Record<"primary" | "amber" | "success", string> = {
  primary: "var(--chart-1)",
  amber: "var(--chart-2)",
  success: "var(--chart-3)",
}

function formatSparkDate(date: string) {
  return new Date(date).toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function SparkTooltip({
  active,
  payload,
  formatValue,
}: {
  active?: boolean
  payload?: { payload: DailyMetric }[]
  formatValue: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload
  return (
    <div className="rounded-md border bg-popover px-2 py-1 text-xs shadow-sm">
      <span className="font-semibold text-popover-foreground">{formatValue(point.value)}</span>
      <span className="ml-1.5 text-muted-foreground">{formatSparkDate(point.date)}</span>
    </div>
  )
}

/** A stat tile with a 12-point sparkline: muted/gray line, with only the
 * latest point accented in the metric's tone — per the dataviz sparkline spec. */
export function TrendStatCard({
  label,
  value,
  icon: Icon,
  trend,
  tone = "primary",
  delay = 0,
  formatValue = (v) => v.toLocaleString(),
  className,
}: {
  label: string
  value: ReactNode
  icon: LucideIcon
  trend: DailyMetric[]
  tone?: "primary" | "amber" | "success"
  delay?: number
  formatValue?: (v: number) => string
  className?: string
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-brand-amber/15 text-brand-amber-foreground",
    success: "bg-success/15 text-success",
  }[tone]
  const accentColor = TONE_VAR[tone]
  const lastIndex = trend.length - 1

  return (
    <motion.div initial="hidden" animate="show" variants={fadeInUp(delay)} className={className}>
      <Card className="gap-3 py-5">
        <CardContent className="space-y-3 px-5">
          <div className="flex items-center gap-4">
            <span
              className={cn(
                "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
                toneClasses
              )}
            >
              <Icon className="size-5" strokeWidth={2} />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-bold tracking-tight text-foreground">{value}</p>
              <p className="truncate text-sm text-muted-foreground">{label}</p>
            </div>
          </div>
          {trend.length > 1 && (
            <div className="h-10 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <Tooltip
                    content={<SparkTooltip formatValue={formatValue} />}
                    cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="var(--muted-foreground)"
                    strokeWidth={2}
                    isAnimationActive={false}
                    dot={(props: { cx?: number; cy?: number; index?: number }) => {
                      const { cx, cy, index } = props
                      if (index !== lastIndex || cx == null || cy == null) {
                        return <g key={`dot-${index}`} />
                      }
                      return (
                        <circle
                          key={`dot-${index}`}
                          cx={cx}
                          cy={cy}
                          r={4}
                          fill={accentColor}
                          stroke="var(--card)"
                          strokeWidth={2}
                        />
                      )
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
