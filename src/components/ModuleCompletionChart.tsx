import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import type { ModuleCompletionRate } from "@/types/api";

function CompletionTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: ModuleCompletionRate }[];
}) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-sm">
      <p className="font-medium text-popover-foreground">{row.module_title}</p>
      <p className="text-muted-foreground">{row.completion_pct.toFixed(0)}% completion rate</p>
    </div>
  );
}

export function ModuleCompletionChart({ data }: { data: ModuleCompletionRate[] }) {
  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Not enough student activity yet to compute completion rates.
        </CardContent>
      </Card>
    );
  }

  // Sorted high-to-low so the strongest-performing modules read first.
  const sorted = [...data].sort((a, b) => b.completion_pct - a.completion_pct);
  const rowHeight = 40;

  return (
    <Card>
      <CardContent className="px-5 py-4">
        <div style={{ height: Math.max(160, sorted.length * rowHeight) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={sorted}
              layout="vertical"
              margin={{ top: 4, right: 32, bottom: 4, left: 4 }}
              barCategoryGap="30%"
            >
              <CartesianGrid horizontal={false} stroke="var(--border)" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="module_title"
                width={140}
                tick={{ fill: "var(--foreground)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CompletionTooltip />} cursor={{ fill: "var(--muted)" }} />
              <Bar dataKey="completion_pct" radius={[0, 4, 4, 0]} maxBarSize={24}>
                {sorted.map((row) => (
                  <Cell key={row.module_id} fill="var(--chart-1)" />
                ))}
                <LabelList
                  dataKey="completion_pct"
                  position="right"
                  formatter={(v: unknown) => `${Number(v).toFixed(0)}%`}
                  fill="var(--muted-foreground)"
                  fontSize={12}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
