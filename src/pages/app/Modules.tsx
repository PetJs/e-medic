import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BookOpen, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import type { Module, Progress as LessonProgress } from "@/types/api";

function formatDuration(totalSeconds?: number) {
  if (!totalSeconds) return null;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Modules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Module[]>("/modules")
      .then((mods) => setModules(mods ?? []))
      .catch(() => toast.error("Couldn't load modules."))
      .finally(() => setLoading(false));
    api<LessonProgress[]>("/progress")
      .then((p) => setProgress(p ?? []))
      .catch(() => {});
  }, []);

  const completedByModule = progress.reduce<Record<string, number>>((acc, p) => {
    if (p.is_completed && p.module_id) {
      acc[p.module_id] = (acc[p.module_id] ?? 0) + 1;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Modules"
        description="Structured, step-by-step medical teachings from Jerome."
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="gap-3 py-4">
              <CardContent className="space-y-3 px-4">
                <Skeleton className="size-10 rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : modules.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No modules published yet"
          description="New content is on the way — check back soon."
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerContainer}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {modules.map((m) => {
            const completed = completedByModule[m.id] ?? 0;
            return (
              <motion.div key={m.id} variants={fadeInUp()} whileHover={{ y: -3 }}>
                <Card className="h-full gap-3 py-4">
                  <CardContent className="flex h-full flex-col space-y-3 px-4">
                    <div className="flex items-start justify-between">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="size-5" />
                      </span>
                      {m.is_premium ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="size-3" /> Locked
                        </Badge>
                      ) : (
                        <Badge variant="success">Free Preview</Badge>
                      )}
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
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/modules/${m.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
