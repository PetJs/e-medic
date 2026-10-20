import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, Clock, Lock, MessageSquare, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { api, ApiError } from "@/lib/api";
import { findActiveSubscription } from "@/lib/subscription";
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
        const active = findActiveSubscription(subs) !== null;
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
  const hasCover = module.cover_image_status === "ready" && module.cover_image_url;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <Link
        to={`/courses/${module.course_id}`}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to course
      </Link>

      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">{module.title}</h1>
        {locked && (
          <p className="mt-2 font-body text-sm text-muted-foreground">
            You've found a locked module. Subscribe to get access to this and
            hundreds more from Jerome.
          </p>
        )}
      </div>

      <Card className="gap-0 overflow-hidden py-0">
        <div
          className={
            hasCover
              ? "relative flex aspect-2/1 items-center justify-center bg-cover bg-center"
              : "flex aspect-2/1 items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-brand-amber/10"
          }
          style={hasCover ? { backgroundImage: `url(${module.cover_image_url})` } : undefined}
        >
          {hasCover && <div className="absolute inset-0 bg-black/25" />}
          <span className="relative flex size-16 items-center justify-center rounded-full bg-background/70">
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
          <p className="font-body text-sm text-muted-foreground">
            {module.description}
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="outline" asChild>
          <Link to={`/modules/${module.id}/discussion`}>
            <MessageSquare className="size-4" /> Discussion
          </Link>
        </Button>
      </div>

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
            <ProgressBar
              value={lessons.length ? (completedCount / lessons.length) * 100 : 0}
              className="h-2"
            />
          )}
          {lessons.length === 0 ? (
            <p className="text-sm text-muted-foreground">No lessons yet.</p>
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerContainer}
              className="space-y-2"
            >
              {lessons.map((lesson, i) => {
                const p = progressByLesson.get(lesson.id);
                return (
                  <motion.div key={lesson.id} variants={fadeInUp()}>
                    <Link
                      to={`/lessons/${lesson.id}`}
                      className="flex items-center gap-4 rounded-xl border bg-background p-4 transition-colors hover:bg-accent"
                    >
                      <span
                        className={
                          p?.is_completed
                            ? "flex size-9 items-center justify-center rounded-full bg-success/15 text-success"
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
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
