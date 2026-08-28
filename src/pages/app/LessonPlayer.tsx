import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileText,
  HelpCircle,
  Image,
  Play,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api, ApiError } from "@/lib/api";
import type {
  Content,
  LessonNote,
  ListNotesResponse,
  ListQuizAnswersResponse,
  ListQuizQuestionsResponse,
  Lesson,
  Progress,
  QuizAnswer,
  QuizQuestion,
} from "@/types/api";

function formatTimestamp(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface LessonDetail extends Lesson {
  contents: Content[];
}

interface ContentURL {
  url: string;
  expires_in: number;
}

function QuizQuestionItem({
  question,
  answer,
  onAnswered,
}: {
  question: QuizQuestion;
  answer?: QuizAnswer;
  onAnswered: (answer: QuizAnswer) => void;
}) {
  const [selected, setSelected] = useState("");
  const [freeText, setFreeText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (question.type === "multiple_choice" && !selected) return;
    if (question.type === "free_text" && !freeText.trim()) return;

    setSubmitting(true);
    try {
      const body =
        question.type === "multiple_choice"
          ? { selected_option_id: selected }
          : { free_text_body: freeText };
      const result = await api<QuizAnswer>(`/quiz-questions/${question.id}/answers`, {
        method: "POST",
        body,
      });
      onAnswered(result);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to submit answer.");
    } finally {
      setSubmitting(false);
    }
  }

  if (answer) {
    // Already answered — one attempt only, render read-only.
    return (
      <Card>
        <CardContent className="space-y-2">
          <p className="font-medium">{question.prompt}</p>
          {question.type === "multiple_choice" ? (
            <div className="space-y-1">
              {question.options?.map((o) => {
                const isSelected = o.id === answer.selected_option_id;
                return (
                  <p
                    key={o.id}
                    className={
                      isSelected
                        ? answer.is_correct
                          ? "flex items-center gap-2 rounded-md bg-success/10 px-2 py-1 text-sm text-success"
                          : "flex items-center gap-2 rounded-md bg-destructive/10 px-2 py-1 text-sm text-destructive"
                        : "flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground"
                    }
                  >
                    {o.text}
                  </p>
                );
              })}
              <p className="text-xs text-muted-foreground">
                {answer.is_correct ? "Correct!" : "Not quite — but you've answered this one."}
              </p>
            </div>
          ) : (
            <p className="rounded-md bg-muted/40 px-2 py-1 text-sm text-muted-foreground">
              {answer.free_text_body}
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-3">
        <p className="font-medium">{question.prompt}</p>
        {question.type === "multiple_choice" ? (
          <RadioGroup value={selected} onValueChange={setSelected}>
            {question.options?.map((o) => (
              <div key={o.id} className="flex items-center gap-2">
                <RadioGroupItem value={o.id} id={o.id} />
                <Label htmlFor={o.id} className="font-normal">{o.text}</Label>
              </div>
            ))}
          </RadioGroup>
        ) : (
          <Textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="Type your answer…"
            rows={3}
          />
        )}
        <Button size="sm" onClick={submit} disabled={submitting}>
          <Send className="size-3.5" /> {submitting ? "Submitting…" : "Submit"}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function LessonPlayer() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [tab, setTab] = useState("description");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [myAnswers, setMyAnswers] = useState<QuizAnswer[]>([]);
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [noteBody, setNoteBody] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [pendingDeleteNote, setPendingDeleteNote] = useState<LessonNote | null>(null);
  const [deletingNote, setDeletingNote] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const resumePosRef = useRef(0);
  const lastReportRef = useRef(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const video = useMemo(
    () => lesson?.contents?.find((c) => c.type === "video") ?? null,
    [lesson]
  );
  const resources = useMemo(
    () => lesson?.contents?.filter((c) => c.type !== "video") ?? [],
    [lesson]
  );
  const answersByQuestion = useMemo(
    () => new Map(myAnswers.map((a) => [a.question_id, a])),
    [myAnswers]
  );
  const quizFullyAnswered =
    questions.length > 0 && questions.every((q) => answersByQuestion.has(q.id));

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
    api<ListQuizQuestionsResponse>(`/lessons/${id}/quiz-questions`)
      .then((res) => setQuestions(res.questions ?? []))
      .catch(() => {});
    api<ListQuizAnswersResponse>(`/lessons/${id}/quiz-answers`)
      .then((res) => setMyAnswers(res.answers ?? []))
      .catch(() => {});
    api<ListNotesResponse>(`/lessons/${id}/notes`)
      .then((res) => setNotes(res.notes ?? []))
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
        toast.error("Failed to open resource.");
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
      .catch((err) => {
        // A blocked completion attempt (quiz not finished yet) — point the
        // student at the quiz instead of a generic error. Background
        // progress pings (no is_completed) never hit this, so this only
        // fires for an explicit "mark complete" / video-ended attempt.
        if (err instanceof ApiError && err.status === 409) {
          toast.error("Answer the quiz below to finish this lesson.");
          setTab("quiz");
        }
      });
  }

  function handleTimeUpdate(e: React.SyntheticEvent<HTMLVideoElement>) {
    const el = e.currentTarget;
    setCurrentPosition(Math.floor(el.currentTime));
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

  function handleMarkComplete() {
    reportProgress({ progress_pct: 100, is_completed: true });
  }

  function seekTo(position: number) {
    if (videoRef.current) videoRef.current.currentTime = position;
  }

  async function submitNote() {
    if (!id || !noteBody.trim()) return;
    setSubmittingNote(true);
    try {
      const note = await api<LessonNote>(`/lessons/${id}/notes`, {
        method: "POST",
        body: { body: noteBody, video_position: currentPosition },
      });
      setNotes((prev) => [...prev, note].sort((a, b) => a.video_position - b.video_position));
      setNoteBody("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to add note.");
    } finally {
      setSubmittingNote(false);
    }
  }

  async function confirmDeleteNote() {
    if (!pendingDeleteNote) return;
    setDeletingNote(true);
    try {
      await api(`/notes/${pendingDeleteNote.id}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== pendingDeleteNote.id));
      setPendingDeleteNote(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete note.");
    } finally {
      setDeletingNote(false);
    }
  }

  function handleQuestionAnswered(answer: QuizAnswer) {
    const next = [...myAnswers, answer];
    setMyAnswers(next);
    // If that was the last unanswered question, complete the lesson right away.
    if (questions.length > 0 && questions.every((q) => next.some((a) => a.question_id === q.id))) {
      reportProgress({ progress_pct: 100, is_completed: true });
      toast.success("Quiz complete — lesson marked as complete.");
    }
  }

  if (error === "subscription") {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="text-xl font-bold">Subscription required</h1>
        <p className="mt-2 font-body text-sm text-muted-foreground">
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
        className="flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Back to module
      </Link>

      {/* Player — videos only */}
      <div className="relative overflow-hidden rounded-xl bg-black shadow-sm">
        {video && streamUrl ? (
          <video
            key={streamUrl}
            ref={videoRef}
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
              <Play className="size-10 animate-pulse" />
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
          <span className="pointer-events-none absolute top-3 right-3 rounded bg-black/60 px-2 py-0.5 text-[10px] font-medium tracking-wide text-white/80 uppercase">
            Stream-Only
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{lesson.title}</h1>
        {completed ? (
          <Badge variant="success" className="gap-1.5 py-1">
            <CheckCircle2 className="size-3.5" /> Completed
          </Badge>
        ) : questions.length > 0 ? (
          <Badge variant="secondary" className="gap-1.5 py-1">
            <HelpCircle className="size-3.5" />
            {quizFullyAnswered ? "Finishing up…" : "Answer the quiz to finish"}
          </Badge>
        ) : (
          <Button variant="outline" size="sm" onClick={handleMarkComplete}>
            <CheckCircle2 className="size-4" /> Mark as complete
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="resources">
            Resources{resources.length > 0 && ` (${resources.length})`}
          </TabsTrigger>
          <TabsTrigger value="notes">
            Notes{notes.length > 0 && ` (${notes.length})`}
          </TabsTrigger>
          {questions.length > 0 && (
            <TabsTrigger value="quiz">
              Quiz ({myAnswers.length}/{questions.length})
            </TabsTrigger>
          )}
        </TabsList>
        <TabsContent
          value="description"
          className="py-4 font-body text-sm leading-relaxed text-muted-foreground"
        >
          {lesson.description || "No description for this lesson."}
        </TabsContent>
        <TabsContent value="resources" className="py-4 text-sm">
          {resources.length === 0 ? (
            <p className="font-body text-muted-foreground">No additional resources.</p>
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
        </TabsContent>
        <TabsContent value="notes" className="space-y-4 py-4">
          <div className="space-y-2">
            {notes.length === 0 ? (
              <p className="font-body text-sm text-muted-foreground">
                No notes yet — jot one down as you watch.
              </p>
            ) : (
              notes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start gap-3 rounded-lg border bg-background p-3"
                >
                  <button
                    type="button"
                    onClick={() => seekTo(note.video_position)}
                    className="shrink-0 rounded-md bg-primary/10 px-2 py-1 font-mono text-xs font-medium text-primary hover:bg-primary/15"
                  >
                    {formatTimestamp(note.video_position)}
                  </button>
                  <p className="flex-1 font-body text-sm">{note.body}</p>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 shrink-0 text-muted-foreground hover:text-destructive"
                    title="Delete note"
                    onClick={() => setPendingDeleteNote(note)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="space-y-2">
            <Textarea
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
              placeholder="Write a note…"
              rows={2}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={submitNote}
              disabled={submittingNote || !noteBody.trim()}
            >
              <Plus className="size-3.5" /> Add Note at {formatTimestamp(currentPosition)}
            </Button>
          </div>
        </TabsContent>
        {questions.length > 0 && (
          <TabsContent value="quiz" className="space-y-3 py-4">
            {questions.map((q) => (
              <QuizQuestionItem
                key={q.id}
                question={q}
                answer={answersByQuestion.get(q.id)}
                onAnswered={handleQuestionAnswered}
              />
            ))}
          </TabsContent>
        )}
      </Tabs>

      <AlertDialog open={!!pendingDeleteNote} onOpenChange={(open) => !open && setPendingDeleteNote(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingNote}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                confirmDeleteNote();
              }}
              disabled={deletingNote}
            >
              {deletingNote ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
