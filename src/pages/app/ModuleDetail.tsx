import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { CheckCircle2, Clock, Lock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { api, ApiError } from "@/lib/api";
import type { Lesson, Module, Progress, Subscription } from "@/types/api";

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export default function ModuleDetail() {
  const { id } = useParams<{ id: string }>();
  const [module, setModule] = useState<Module | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api<Module>(`/modules/${id}`),
      api<Lesson[]>(`/modules/${id}/lessons`).catch((err) => {
        if (err instanceof ApiError && err.status === 402) return null;
        throw err;
      }),
      api<Subscription[]>("/subscriptions").catch(() => [] as Subscription[]),
      api<Progress[]>("/progress").catch(() => [] as Progress[]),
    ])
      .then(([mod, lessonList, subs, prog]) => {
        setModule(mod);
        const active = subs?.some((s) => s.status === "active") ?? false;
        setHasAccess(!mod.is_premium || active);
        setLessons(lessonList ?? []);
        setProgress(prog ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const progressByLesson = new Map(progress.map((p) => [p.lesson_id, p]));
  const completedCount = lessons.filter(
    (l) => progressByLesson.get(l.id)?.is_completed
  ).length;

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading module…</p>;
  }
  if (!module) {
    return <p className="text-sm text-muted-foreground">Module not found.</p>;
  }

  const locked = module.is_premium && !hasAccess;

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">{module.title}</h1>
        {locked && (
          <p className="mt-2 text-sm text-muted-foreground">
            You've found a locked module. Subscribe to get access to this and
            hundreds more from Jerome.
          </p>
        )}
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div className="flex aspect-[2/1] items-center justify-center bg-gradient-to-br from-primary/10 via-teal-50 to-emerald-50 dark:via-background dark:to-background">
          <span className="flex size-16 items-center justify-center rounded-full bg-background/70">
            {locked ? (
              <Lock className="size-6 text-muted-foreground" />
            ) : (
              <Play className="size-6 text-primary" />
            )}
          </span>
        </div>
        <CardContent className="space-y-2 py-5">
          <p className="text-lg font-semibold">{module.title}</p>
          {module.total_duration ? (
            <p className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="size-3.5" /> {formatDuration(module.total_duration)}
            </p>
          ) : null}
          <p className="text-sm text-muted-foreground">{module.description}</p>
        </CardContent>
      </Card>

      {locked ? (
        <div className="flex justify-center">
          <Button size="lg" asChild>
            <Link to="/subscribe">Subscribe to Unlock Full Access</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Lessons</h2>
            {lessons.length > 0 && (
              <span className="text-sm text-muted-foreground">
                {completedCount} of {lessons.length} completed
              </span>
            )}
          </div>
          {lessons.length > 0 && (
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${lessons.length ? (completedCount / lessons.length) * 100 : 0}%`,
                }}
              />
            </div>
          )}
          {lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lessons yet.</p>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson, i) => {
                const p = progressByLesson.get(lesson.id);
                return (
                  <Link
                    key={lesson.id}
                    to={`/lessons/${lesson.id}`}
                    className="flex items-center gap-4 rounded-xl border bg-background p-4 transition-colors hover:bg-accent"
                  >
                    <span
                      className={
                        p?.is_completed
                          ? "flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400"
                          : "flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary"
                      }
                    >
                      {p?.is_completed ? (
                        <CheckCircle2 className="size-4" />
                      ) : (
                        <Play className="size-4" />
                      )}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {i + 1}. {lesson.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {lesson.duration > 0 && (
                          <span>{formatDuration(lesson.duration)}</span>
                        )}
                        {!p?.is_completed && (p?.progress_pct ?? 0) > 0 && (
                          <span>
                            {lesson.duration > 0 && " · "}
                            {p!.progress_pct}% watched
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
