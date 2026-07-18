import { useEffect, useState } from "react";
import { Link } from "react-router";
import { TrendingUp, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { ListUsersResponse, User } from "@/types/api";

interface AdminStats {
  total_students: number;
  active_subscriptions: number;
  monthly_revenue: number;
  currency: string;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [students, setStudents] = useState<User[]>([]);

  useEffect(() => {
    api<AdminStats>("/admin/stats").then(setStats).catch(() => {});
    api<ListUsersResponse>("/admin/users?limit=5")
      .then((res) => setStudents(res.users ?? []))
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Total Enrolled Students</p>
            <p className="mt-1 text-3xl font-bold">
              {stats ? stats.total_students.toLocaleString() : "—"}
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs text-emerald-600">
              <TrendingUp className="size-3" /> Active subscriptions:{" "}
              {stats?.active_subscriptions ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Monthly Revenue</p>
            <p className="mt-1 text-3xl font-bold">
              {stats
                ? new Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: stats.currency || "NGN",
                    maximumFractionDigits: 0,
                  }).format(stats.monthly_revenue / 100)
                : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Upload CTA */}
      <div className="rounded-xl border-2 border-dashed bg-background p-10 text-center">
        <Upload className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">Upload New Module</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add videos, PDFs, or images to your lessons.
        </p>
        <Button className="mt-4" asChild>
          <Link to="/admin/uploads">Select Files</Link>
        </Button>
      </div>

      {/* Recent students */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Enrolled Students</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/students">View all</Link>
          </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border bg-background">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50 text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Student Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Enrollment Date</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground">
                    No students yet.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">
                      {s.first_name} {s.last_name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
