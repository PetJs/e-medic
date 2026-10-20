import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Delta } from "@/lib/analytics";

function formatPct(pct: number): string {
  const absolute = Math.abs(pct);
  return `${absolute >= 100 ? absolute.toFixed(0) : absolute.toFixed(1)}%`;
}

/** Period-over-period change chip. Direction is carried by an arrow and a
 * signed label, never by color alone. */
export function DeltaBadge({
  delta,
  className,
}: {
  delta: Delta;
  className?: string;
}) {
  if (delta.direction === "none") {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>No prior data</span>
    );
  }

  if (delta.direction === "new") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success",
          className
        )}
      >
        <ArrowUpRight className="size-3.5" aria-hidden />
        New
      </span>
    );
  }

  const Icon = delta.direction === "up" ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        delta.direction === "up" && "bg-success/10 text-success",
        delta.direction === "down" && "bg-destructive/10 text-destructive",
        delta.direction === "flat" && "bg-muted text-muted-foreground",
        className
      )}
    >
      {delta.direction === "flat" ? (
        <Minus className="size-3.5" aria-hidden />
      ) : (
        <Icon className="size-3.5" aria-hidden />
      )}
      {delta.pct === null ? "—" : formatPct(delta.pct)}
    </span>
  );
}
