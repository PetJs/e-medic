import type { DailyMetric } from "@/types/api";

/** Direction of a period-over-period change, plus the percentage when it is
 * computable (previous period had zero activity, so there is no base). */
export interface Delta {
  direction: "up" | "down" | "flat" | "new" | "none";
  pct: number | null;
}

export function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Local `YYYY-MM-DD` key for a date. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Parse an API date key as a local date (avoids the UTC-midnight shift that
 * `new Date("2026-10-20")` causes in negative-offset timezones). */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function formatShortDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function formatLongDate(key: string): string {
  return parseDateKey(key).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function sumMetrics(metrics: DailyMetric[]): number {
  return metrics.reduce((total, metric) => total + metric.value, 0);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined).format(value);
}

export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatMoney(
  amountKobo: number,
  currency: string,
  options: { compact?: boolean } = {}
): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currency || "NGN",
    notation: options.compact ? "compact" : "standard",
    maximumFractionDigits: options.compact ? 1 : 0,
  }).format(amountKobo / 100);
}

export function compareTotals(current: number, previous: number): Delta {
  if (previous > 0) {
    const pct = ((current - previous) / previous) * 100;
    if (Math.abs(pct) < 0.05) return { direction: "flat", pct: 0 };
    return { direction: pct > 0 ? "up" : "down", pct };
  }
  if (current > 0) return { direction: "new", pct: null };
  return { direction: "none", pct: null };
}

/** Expand a sparse `{date, value}` trend into one point per calendar day, so
 * charts show quiet days as zero instead of compressing them away. */
export function fillDailySeries(
  metrics: DailyMetric[],
  startKey: string,
  endKey: string
): DailyMetric[] {
  const byDate = new Map(metrics.map((metric) => [metric.date, metric.value]));
  const series: DailyMetric[] = [];

  let cursor = parseDateKey(startKey);
  while (toDateKey(cursor) <= endKey) {
    const key = toDateKey(cursor);
    series.push({ date: key, value: byDate.get(key) ?? 0 });
    cursor = addDays(cursor, 1);
  }

  return series;
}

export interface SplitPeriod {
  startKey: string;
  endKey: string;
  days: number;
  /** Current window, zero-filled, for charting. */
  current: DailyMetric[];
  currentRaw: DailyMetric[];
  previousRaw: DailyMetric[];
  currentTotal: number;
  previousTotal: number;
}

/**
 * Split a `days * 2` trend response into the current window and the
 * immediately preceding window of equal length, so headline numbers can show
 * a real period-over-period delta.
 */
export function splitPeriod(
  trend: DailyMetric[],
  days: number,
  today = new Date()
): SplitPeriod {
  const end = startOfDay(today);
  const currentStart = addDays(end, -(days - 1));
  const previousStart = addDays(currentStart, -days);

  const startKey = toDateKey(currentStart);
  const endKey = toDateKey(end);
  const previousStartKey = toDateKey(previousStart);

  const currentRaw = trend.filter(
    (metric) => metric.date >= startKey && metric.date <= endKey
  );
  const previousRaw = trend.filter(
    (metric) => metric.date >= previousStartKey && metric.date < startKey
  );

  return {
    startKey,
    endKey,
    days,
    current: fillDailySeries(currentRaw, startKey, endKey),
    currentRaw,
    previousRaw,
    currentTotal: sumMetrics(currentRaw),
    previousTotal: sumMetrics(previousRaw),
  };
}

/** Highest-value day in a series, or null when every day is quiet. */
export function peakDay(series: DailyMetric[]): DailyMetric | null {
  let peak: DailyMetric | null = null;
  for (const metric of series) {
    if (!peak || metric.value > peak.value) peak = metric;
  }
  return peak && peak.value > 0 ? peak : null;
}
