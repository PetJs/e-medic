import { Layers } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { fadeInUp } from "@/lib/motion";
import type { ModuleCompletionRate } from "@/types/api";

/**
 * Ranked completion meters. Values are always written beside each bar, so the
 * chart is readable without hover and needs no tooltip or table twin.
 */
export function ModuleCompletionCard({
  data,
  className,
  delay = 0,
}: {
  data: ModuleCompletionRate[];
  className?: string;
  delay?: number;
}) {
  if (data.length === 0) {
    return (
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeInUp(delay)}
        className={className}
      >
        <Card>
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <span className="inline-flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="size-6" aria-hidden />
            </span>
            <p className="mt-4 font-semibold text-foreground">No module activity yet</p>
            <p className="mt-1 max-w-sm font-body text-sm text-muted-foreground">
              Completion rates appear once students start working through
              lessons.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const sorted = [...data].sort((a, b) => b.completion_pct - a.completion_pct);
  const average =
    sorted.reduce((total, row) => total + row.completion_pct, 0) / sorted.length;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeInUp(delay)}
      className={className}
    >
      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b px-6 py-5">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Layers className="size-5" aria-hidden />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Module completion
              </h2>
              <p className="mt-0.5 font-body text-sm text-muted-foreground">
                Students who started each of the {sorted.length} modules and
                finished every lesson.
              </p>
            </div>
          </div>
          <div className="pl-13 sm:pl-0 sm:text-right">
            <p className="text-xs text-muted-foreground">Average completion</p>
            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
              {average.toFixed(0)}%
            </p>
          </div>
        </div>

        <div className="space-y-1 px-3 py-3">
          {sorted.map((row, index) => {
            const pct = Math.min(100, Math.max(0, row.completion_pct));
            return (
              <div
                key={row.module_id}
                className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/40"
              >
                <span
                  className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold tabular-nums",
                    index < 3
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                  aria-hidden
                >
                  {index + 1}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="truncate text-sm font-medium text-foreground">
                      {row.module_title}
                    </p>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                      {row.completion_pct.toFixed(0)}%
                    </p>
                  </div>
                  <div
                    role="progressbar"
                    aria-valuenow={Math.round(pct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${row.module_title} completion`}
                    className="mt-2 h-2 overflow-hidden rounded-full bg-primary/10"
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{
                        duration: 0.7,
                        ease: [0.16, 1, 0.3, 1],
                        delay: Math.min(0.1 + index * 0.04, 0.5),
                      }}
                      className="h-full rounded-full bg-primary/85 transition-colors group-hover:bg-primary"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </motion.div>
  );
}
