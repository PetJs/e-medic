import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, Image, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Content, Lesson, Progress } from "@/types/api";

interface LessonDetail extends Lesson {
  contents: Content[];
}

interface ContentURL {
  url: string;
  expires_in: number;
}

export default function LessonPlayer() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"description" | "resources">("description");
  const [completed, setCompleted] = useState(false);
  const resumePosRef = useRef(0);
  const lastReportRef = useRef(0);

  const video = useMemo(
    () => lesson?.contents?.find((c) => c.type === "video") ?? null,
    [lesson]
  );
  const resources = useMemo(
    () => lesson?.contents?.filter((c) => c.type !== "video") ?? [],
    [lesson]
  );

  useEffect(() => {
    if (!id) return;
    api<LessonDetail>(`/lessons/${id}`)
      .then((l) => setLesson(l))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 402) {
          setError("subscription");
        } else {
          setError("Failed to load lesson.");
        }
      });
    api<Progress>(`/progress/${id}`)
      .then((p) => {
        setCompleted(p.is_completed);
        resumePosRef.current = p.last_position ?? 0;
      })
      .catch(() => {});
  }, [id]);

  // Only videos are streamed in the player; other files open in a new tab.
  useEffect(() => {
    if (!video) return;
    setStreamUrl(null);
    api<ContentURL>(`/content/${video.id}/url`)
      .then((res) => setStreamUrl(res.url))
      .catch(() => setError("Failed to load content stream."));
  }, [video]);

  function openResource(content: Content) {
    // Open the tab synchronously so popup blockers allow it, then point it
    // at the short-lived signed URL once fetched.
    const win = window.open("about:blank", "_blank");
    api<ContentURL>(`/content/${content.id}/url`)
      .then((res) => {
        if (win) {
          win.location.href = res.url;
        } else {
          window.open(res.url, "_blank");
        }
      })
      .catch(() => {
        win?.close();
        setError("Failed to open resource.");
      });
  }

  function reportProgress(body: {
    progress_pct?: number;
    last_position?: number;
    is_completed?: boolean;
  }) {
    if (!id) return;
    api<Progress>("/progress", {
      method: "POST",
      body: { lesson_id: id, ...body },
    })
      .then((p) => setCompleted(p.is_completed))
      .catch(() => {});
  }

  function handleTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
    const el = e.currentTarget;
    if (!el.duration) return;
    const now = Date.now();
    // Report at most every 10 seconds to keep chatter down
    if (now - lastReportRef.current < 10_000) return;
    lastReportRef.current = now;
    reportProgress({
      progress_pct: Math.floor((el.currentTime / el.duration) * 100),
      last_position: Math.floor(el.currentTime),
    });
  }

  function handleLoadedMetadata(e: React.SyntheticEvent<HTMLVideoElement>) {
    const el = e.currentTarget;
    // Resume where the student left off (unless nearly at the end)
    if (resumePosRef.current > 0 && resumePosRef.current < el.duration - 5) {
      el.currentTime = resumePosRef.current;
    }
  }

  function handleEnded() {
    reportProgress({ progress_pct: 100, is_completed: true });
  }

  if (error === "subscription") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-xl font-bold">Subscription required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This lesson is part of Jerome's premium content. Subscribe to stream it.
        </p>
        <Button className="mt-6" asChild>
          <Link to="/subscribe">Subscribe to Unlock</Link>
        </Button>
      </div>
    );
  }

  if (!lesson) {
    return (
      <p className="text-sm text-muted-foreground">
        {error ?? "Loading lesson…"}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to={`/modules/${lesson.module_id}`}
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to module
      </Link>

      {/* Player — videos only */}
      <div className="relative overflow-hidden rounded-xl bg-black">
        {video && streamUrl ? (
          <video
            key={streamUrl}
            src={streamUrl}
            controls
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleEnded}
            className="aspect-video w-full"
          />
        ) : (
          <div className="flex aspect-video flex-col items-center justify-center gap-2 text-white/60">
            {video ? (
              <Play className="size-10" />
            ) : (
              <>
                <p className="text-sm">No video in this lesson.</p>
                {resources.length > 0 && (
                  <p className="text-xs">
                    Open the materials from the Resources tab below.
                  </p>
                )}
              </>
            )}
          </div>
        )}
        {video && (
          <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80">
            Stream-Only
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        {completed ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-4" /> Completed
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => reportProgress({ progress_pct: 100, is_completed: true })}
          >
            <CheckCircle2 className="size-4" /> Mark as complete
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-6 border-b text-sm">
          {(["description", "resources"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "-mb-px border-b-2 border-transparent py-2 font-medium capitalize text-muted-foreground transition-colors hover:text-foreground",
                tab === t && "border-primary text-primary"
              )}
            >
              {t}
              {t === "resources" && resources.length > 0 && ` (${resources.length})`}
            </button>
          ))}
        </div>
        <div className="py-4 text-sm leading-relaxed text-muted-foreground">
          {tab === "description" ? (
            <p>{lesson.description || "No description for this lesson."}</p>
          ) : resources.length === 0 ? (
            <p>No additional resources.</p>
          ) : (
            <ul className="space-y-2">
              {resources.map((r) => (
                <li key={r.id}>
                  <button
                    onClick={() => openResource(r)}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    {r.type === "image" ? (
                      <Image className="size-4" />
                    ) : (
                      <FileText className="size-4" />
                    )}
                    {r.title}
                    <ExternalLink className="size-3 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
