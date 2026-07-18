import { useEffect, useState } from "react";
import { Link } from "react-router";
import { BookOpen, Clock, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import type { Module, Progress } from "@/types/api";

function formatDuration(totalSeconds?: number) {
  if (!totalSeconds) return null;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.round((totalSeconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function Modules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Module[]>("/modules")
      .then((mods) => setModules(mods ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    api<Progress[]>("/progress")
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">All Modules</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Structured, step-by-step medical teachings from Jerome.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading modules…</p>
      ) : modules.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <BookOpen className="size-8 text-muted-foreground" />
            <p className="font-medium">No modules published yet</p>
            <p className="text-sm text-muted-foreground">
              New content is on the way — check back soon.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m) => (
            <Card key={m.id} className="gap-3 py-4">
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
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {m.description}
                  </p>
                </div>
                {formatDuration(m.total_duration) && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="size-3" /> {formatDuration(m.total_duration)}
                  </p>
                )}
                {(m.lesson_count ?? 0) > 0 && (completedByModule[m.id] ?? 0) > 0 && (
                  <div className="space-y-1">
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{
                          width: `${Math.min(100, ((completedByModule[m.id] ?? 0) / m.lesson_count!) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {completedByModule[m.id]} of {m.lesson_count} lessons completed
                    </p>
                  </div>
                )}
                <Button variant="outline" size="sm" className="w-full" asChild>
                  <Link to={`/modules/${m.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
