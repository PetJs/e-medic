import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, CheckCircle2, FileText, Play } from "lucide-react";
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
  const [activeContent, setActiveContent] = useState<Content | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"description" | "resources">("description");
  const [completed, setCompleted] = useState(false);
  const resumePosRef = useRef(0);
  const lastReportRef = useRef(0);

  useEffect(() => {
    if (!id) return;
    api<LessonDetail>(`/lessons/${id}`)
      .then((l) => {
        setLesson(l);
        const video = l.contents?.find((c) => c.type === "video");
        setActiveContent(video ?? l.contents?.[0] ?? null);
      })
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

  useEffect(() => {
    if (!activeContent) return;
    setStreamUrl(null);
    api<ContentURL>(`/content/${activeContent.id}/url`)
      .then((res) => setStreamUrl(res.url))
      .catch(() => setError("Failed to load content stream."));
  }, [activeContent]);

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
    const video = e.currentTarget;
    if (!video.duration) return;
    const now = Date.now();
    // Report at most every 10 seconds to keep chatter down
    if (now - lastReportRef.current < 10_000) return;
    lastReportRef.current = now;
    reportProgress({
      progress_pct: Math.floor((video.currentTime / video.duration) * 100),
      last_position: Math.floor(video.currentTime),
    });
  }

  function handleLoadedMetadata(e: React.SyntheticEvent<HTMLVideoElement>) {
    const video = e.currentTarget;
    // Resume where the student left off (unless nearly at the end)
    if (resumePosRef.current > 0 && resumePosRef.current < video.duration - 5) {
      video.currentTime = resumePosRef.current;
    }
  }

  function handleEnded() {
    reportProgress({ progress_pct: 100, is_completed: true });
  }

  const resources = useMemo(
    () => lesson?.contents?.filter((c) => c.type !== "video") ?? [],
    [lesson]
  );

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

      {/* Player */}
      <div className="relative overflow-hidden rounded-xl bg-black">
        {activeContent?.type === "video" && streamUrl ? (
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
        ) : activeContent?.type === "pdf" && streamUrl ? (
          <iframe
            src={`${streamUrl}#toolbar=0`}
            title={activeContent.title}
            className="aspect-video w-full bg-white"
          />
        ) : (
          <div className="flex aspect-video items-center justify-center text-white/60">
            {activeContent ? (
              <Play className="size-10" />
            ) : (
              <p className="text-sm">No content in this lesson yet.</p>
            )}
          </div>
        )}
        <span className="pointer-events-none absolute right-3 top-3 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/80">
          Stream-Only
        </span>
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
                    onClick={() => setActiveContent(r)}
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <FileText className="size-4" /> {r.title}
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
