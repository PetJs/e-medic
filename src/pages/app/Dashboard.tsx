import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, BarChart3, BadgeCheck, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import type { Module, Progress, Subscription } from "@/types/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);

  useEffect(() => {
    api<Subscription[]>("/subscriptions")
      .then((subs) => setSubscription(subs?.find((s) => s.status === "active") ?? null))
      .catch(() => {});
    api<Module[]>("/modules")
      .then((mods) => setModules(mods ?? []))
      .catch(() => {});
    api<Progress[]>("/progress")
      .then((p) => setProgress(p ?? []))
      .catch(() => {});
  }, []);

  const completedLessons = progress.filter((p) => p.is_completed).length;
  const inProgressLessons = progress.filter((p) => !p.is_completed).length;

  const hasActiveSub = subscription?.status === "active";

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome back, {user?.first_name}!</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let's continue your learning journey.
          </p>
        </div>
        <Button asChild disabled={!hasActiveSub}>
          <Link to="/modules">
            Continue Learning <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {/* Overview */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Overview</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BadgeCheck className="size-4" />
                </span>
                Subscription Status
              </div>
              {hasActiveSub ? (
                <>
                  <p className="text-lg font-bold">Monthly Access</p>
                  <p className="text-sm text-muted-foreground">
                    Your subscription is active and renews on{" "}
                    {new Date(subscription!.current_period_end).toLocaleDateString(
                      undefined,
                      { month: "short", day: "numeric", year: "numeric" }
                    )}
                    .
                  </p>
                </>
              ) : (
                <>
                  <p className="text-lg font-bold">No Active Plan</p>
                  <p className="text-sm text-muted-foreground">
                    Subscribe to unlock all modules and stream every lesson.
                  </p>
                  <Button size="sm" className="mt-2" asChild>
                    <Link to="/subscribe">Subscribe Now</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BarChart3 className="size-4" />
                </span>
                Learning Progress
              </div>
              <div className="flex items-end gap-8 pt-1">
                <div>
                  <p className="text-2xl font-bold">{completedLessons}</p>
                  <p className="text-xs text-muted-foreground">Lessons Completed</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{inProgressLessons}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{modules.length}</p>
                  <p className="text-xs text-muted-foreground">Modules Available</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Upcoming modules */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Explore Modules</h2>
        {modules.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <BookOpen className="size-8 text-muted-foreground" />
              <p className="font-medium">No modules published yet</p>
              <p className="text-sm text-muted-foreground">
                Check back soon — new content is on the way.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {modules.slice(0, 3).map((m) => (
              <Card key={m.id} className="gap-3 py-4">
                <CardContent className="space-y-3 px-4">
                  <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-teal-100 dark:to-teal-950">
                    <BookOpen className="size-8 text-primary/60" />
                  </div>
                  <div>
                    <p className="font-semibold">{m.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {m.description}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link to={`/modules/${m.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
