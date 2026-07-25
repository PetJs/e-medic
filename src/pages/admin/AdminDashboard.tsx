import { useEffect, useState } from "react";
import { Link } from "react-router";
import { CreditCard, Upload, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
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
    <div className="space-y-8">
      <PageHeader title="Dashboard" description="Overview of Jerome E-Platform." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Enrolled Students"
          value={stats ? stats.total_students.toLocaleString() : "—"}
          icon={Users}
        />
        <StatCard
          label="Active Subscriptions"
          value={stats ? stats.active_subscriptions.toLocaleString() : "—"}
          icon={CreditCard}
          tone="success"
          delay={0.05}
        />
        <StatCard
          label="Monthly Revenue"
          value={
            stats
              ? new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: stats.currency || "NGN",
                  maximumFractionDigits: 0,
                }).format(stats.monthly_revenue / 100)
              : "—"
          }
          icon={CreditCard}
          tone="amber"
          delay={0.1}
        />
      </div>

      <div className="rounded-xl border-2 border-dashed bg-background p-10 text-center">
        <Upload className="mx-auto size-8 text-muted-foreground" />
        <p className="mt-3 font-semibold">Upload New Module</p>
        <p className="mt-1 font-body text-sm text-muted-foreground">
          Add videos, PDFs, or images to your lessons.
        </p>
        <Button className="mt-4" asChild>
          <Link to="/admin/uploads">Select Files</Link>
        </Button>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Enrolled Students</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/students">View all</Link>
          </Button>
        </div>
        <Card className="overflow-hidden py-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Student Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Enrollment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No students yet.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">
                      {s.first_name} {s.last_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}
