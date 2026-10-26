import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowLeft, BookOpen, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/EmptyState";
import { ModuleCoverThumb } from "@/components/ModuleCoverThumb";
import { api } from "@/lib/api";
import { findActiveSubscription } from "@/lib/subscription";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import type {
  CourseDetail as CourseDetailData,
  Progress as LessonProgress,
  Subscription,
} from "@/types/api";

function formatDuration(totalSeconds?: number) {
  if (!totalSeconds) return null;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<CourseDetailData | null>(null);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api<CourseDetailData>(`/courses/${id}`)
      .then(setCourse)
      .catch(() => toast.error("Couldn't load this course."))
      .finally(() => setLoading(false));
    api<LessonProgress[]>("/progress")
      .then((p) => setProgress(p ?? []))
      .catch(() => {});
    api<Subscription[]>("/subscriptions")
      .then((subs) => setSubscriptions(subs ?? []))
      .catch(() => {});
  }, [id]);

  const completedByModule = progress.reduce<Record<string, number>>((acc, p) => {
    if (p.is_completed && p.module_id) {
      acc[p.module_id] = (acc[p.module_id] ?? 0) + 1;
    }
    return acc;
  }, {});

  const hasAccess = findActiveSubscription(subscriptions) !== null;

  return (
    <div className="space-y-6">
      <Link
        to="/modules"
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to Library
      </Link>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
      ) : !course ? (
        <p className="text-sm text-muted-foreground">Course not found.</p>
      ) : (
        <>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{course.title}</h1>
            {course.description && (
              <p className="mt-1.5 max-w-2xl font-body text-sm text-muted-foreground sm:text-base">
                {course.description}
              </p>
            )}
          </div>

          {course.modules.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No modules yet"
              description="This course doesn't have any modules published yet — check back soon."
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerContainer}
              className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {course.modules.map((m) => {
                const completed = completedByModule[m.id] ?? 0;
                const locked = m.is_premium && !hasAccess;
                return (
                  <motion.div key={m.id} variants={fadeInUp()} whileHover={{ y: -3 }}>
                    <Card className="h-full gap-3 py-4">
                      <CardContent className="flex h-full flex-col space-y-3 px-4">
                        <div className="relative">
                          <ModuleCoverThumb module={m} />
                          <div className="absolute top-2 right-2">
                            {m.is_premium ? (
                              <Badge
                                variant={locked ? "secondary" : "success"}
                                className="gap-1"
                              >
                                {locked && <Lock className="size-3" />}
                                {locked ? "Locked" : "Unlocked"}
                              </Badge>
                            ) : (
                              <Badge variant="success">Free Preview</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{m.title}</p>
                          <p className="mt-1 line-clamp-2 font-body text-sm text-muted-foreground">
                            {m.description}
                          </p>
                        </div>
                        {formatDuration(m.total_duration) && (
                          <p className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" /> {formatDuration(m.total_duration)}
                          </p>
                        )}
                        {(m.lesson_count ?? 0) > 0 && completed > 0 && (
                          <div className="space-y-1.5">
                            <Progress
                              value={Math.min(100, (completed / m.lesson_count!) * 100)}
                              className="h-1.5"
                            />
                            <p className="text-xs text-muted-foreground">
                              {completed} of {m.lesson_count} lessons completed
                            </p>
                          </div>
                        )}
                        {locked ? (
                          <div className="grid gap-2">
                            <Button size="sm" className="w-full" asChild>
                              <Link to="/subscribe">Subscribe to Unlock</Link>
                            </Button>
                            <Button variant="outline" size="sm" className="w-full" asChild>
                              <Link to={`/modules/${m.id}`}>View Details</Link>
                            </Button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" className="w-full" asChild>
                            <Link to={`/modules/${m.id}`}>View Details</Link>
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
