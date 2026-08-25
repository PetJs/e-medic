import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HelpCircle, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { api, ApiError } from "@/lib/api";
import type {
  Course,
  ListQuizAnswersResponse,
  ListQuizQuestionsResponse,
  Lesson,
  Module,
  QuizAnswer,
  QuizQuestion,
} from "@/types/api";

const selectClass =
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] disabled:opacity-50";

function handleError(err: unknown) {
  toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
}

interface OptionDraft {
  text: string;
}

export default function AdminQuiz() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [lessonId, setLessonId] = useState("");

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<QuizQuestion | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [type, setType] = useState<"multiple_choice" | "free_text">("multiple_choice");
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState<OptionDraft[]>([{ text: "" }, { text: "" }]);
  const [correctIndex, setCorrectIndex] = useState("0");
  const [creating, setCreating] = useState(false);

  const [reviewQuestion, setReviewQuestion] = useState<QuizQuestion | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);

  useEffect(() => {
    api<{ courses: Course[] }>("/courses")
      .then((res) => setCourses(res.courses ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setModules([]);
    setModuleId("");
    if (!courseId) return;
    api<Module[]>(`/modules?course_id=${courseId}`)
      .then((m) => setModules(m ?? []))
      .catch(() => {});
  }, [courseId]);

  useEffect(() => {
    setLessons([]);
    setLessonId("");
    if (!moduleId) return;
    api<Lesson[]>(`/modules/${moduleId}/lessons`)
      .then((l) => setLessons(l ?? []))
      .catch(() => {});
  }, [moduleId]);

  function loadQuestions() {
    if (!lessonId) return;
    setLoadingQuestions(true);
    api<ListQuizQuestionsResponse>(`/admin/lessons/${lessonId}/quiz-questions`)
      .then((res) => setQuestions(res.questions ?? []))
      .catch(() => {})
      .finally(() => setLoadingQuestions(false));
  }

  useEffect(() => {
    setQuestions([]);
    setReviewQuestion(null);
    if (lessonId) loadQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  function resetForm() {
    setType("multiple_choice");
    setPrompt("");
    setOptions([{ text: "" }, { text: "" }]);
    setCorrectIndex("0");
  }

  async function createQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!lessonId || !prompt.trim()) return;

    const body: Record<string, unknown> = { type, prompt, order: questions.length };
    if (type === "multiple_choice") {
      const cleaned = options.map((o) => o.text.trim()).filter(Boolean);
      if (cleaned.length < 2) {
        toast.error("Add at least 2 options.");
        return;
      }
      body.options = options.map((o, i) => ({
        text: o.text,
        is_correct: String(i) === correctIndex,
      }));
    }

    setCreating(true);
    try {
      await api(`/admin/lessons/${lessonId}/quiz-questions`, { method: "POST", body });
      toast.success("Question added.");
      resetForm();
      loadQuestions();
    } catch (err) {
      handleError(err);
    } finally {
      setCreating(false);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api(`/admin/quiz-questions/${pendingDelete.id}`, { method: "DELETE" });
      if (reviewQuestion?.id === pendingDelete.id) setReviewQuestion(null);
      toast.success("Question deleted.");
      setPendingDelete(null);
      loadQuestions();
    } catch (err) {
      handleError(err);
    } finally {
      setDeleting(false);
    }
  }

  function openReview(q: QuizQuestion) {
    setReviewQuestion(q);
    setLoadingAnswers(true);
    api<ListQuizAnswersResponse>(`/admin/quiz-questions/${q.id}/answers`)
      .then((res) => setAnswers(res.answers ?? []))
      .catch(() => {})
      .finally(() => setLoadingAnswers(false));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Quiz Questions"
        description="Author post-lesson questions. Students must answer every question before a lesson counts as complete."
      />

      <Card>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Course</Label>
              <select className={selectClass} value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                <option value="">Select course…</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Module</Label>
              <select
                className={selectClass}
                value={moduleId}
                onChange={(e) => setModuleId(e.target.value)}
                disabled={!courseId}
              >
                <option value="">Select module…</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>{m.title}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Lesson</Label>
              <select
                className={selectClass}
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value)}
                disabled={!moduleId}
              >
                <option value="">Select lesson…</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>{l.title}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {lessonId && (
        <>
          {/* Existing questions */}
          {loadingQuestions ? (
            <p className="text-sm text-muted-foreground">Loading questions…</p>
          ) : questions.length === 0 ? (
            <EmptyState icon={HelpCircle} title="No questions yet" description="Add one below." />
          ) : (
            <div className="space-y-2">
              {questions.map((q, i) => (
                <Card key={q.id}>
                  <CardContent className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={q.type === "multiple_choice" ? "default" : "secondary"}>
                          {q.type === "multiple_choice" ? "Multiple Choice" : "Free Text"}
                        </Badge>
                        <p className="font-medium">
                          {i + 1}. {q.prompt}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {q.type === "free_text" && (
                          <Button variant="outline" size="sm" onClick={() => openReview(q)}>
                            View Answers
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          title="Delete question"
                          onClick={() => setPendingDelete(q)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    {q.options && q.options.length > 0 && (
                      <ul className="space-y-1 pl-1 text-sm text-muted-foreground">
                        {q.options.map((o) => (
                          <li key={o.id} className="flex items-center gap-2">
                            <span
                              className={
                                o.is_correct
                                  ? "flex size-4 items-center justify-center rounded-full bg-success/15 text-success"
                                  : "flex size-4 items-center justify-center rounded-full bg-muted"
                              }
                            />
                            {o.text}
                            {o.is_correct && <span className="text-xs text-success">correct</span>}
                          </li>
                        ))}
                      </ul>
                    )}
                    {reviewQuestion?.id === q.id && (
                      <div className="space-y-2 border-t pt-3">
                        <p className="text-xs font-medium text-muted-foreground">Student answers</p>
                        {loadingAnswers ? (
                          <p className="text-sm text-muted-foreground">Loading…</p>
                        ) : answers.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No submissions yet.</p>
                        ) : (
                          <ul className="space-y-2">
                            {answers.map((a) => (
                              <li key={a.id} className="rounded-md bg-muted/40 p-2 text-sm">
                                <span className="font-medium">
                                  {a.author?.first_name} {a.author?.last_name}
                                </span>
                                : {a.free_text_body}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* New question form */}
          <Card>
            <CardContent>
              <form onSubmit={createQuestion} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Question type</Label>
                  <select
                    className={selectClass}
                    value={type}
                    onChange={(e) => setType(e.target.value as "multiple_choice" | "free_text")}
                  >
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="free_text">Free Text</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label>Prompt</Label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="e.g. Which nerve is the longest in the human body?"
                    required
                    rows={2}
                  />
                </div>

                {type === "multiple_choice" && (
                  <div className="space-y-2">
                    <Label>Options (select the correct one)</Label>
                    <RadioGroup value={correctIndex} onValueChange={setCorrectIndex}>
                      {options.map((o, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                          <Input
                            value={o.text}
                            onChange={(e) => {
                              const next = [...options];
                              next[i] = { text: e.target.value };
                              setOptions(next);
                            }}
                            placeholder={`Option ${i + 1}`}
                            className="flex-1"
                          />
                          {options.length > 2 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-destructive"
                              onClick={() => {
                                setOptions(options.filter((_, idx) => idx !== i));
                                if (correctIndex === String(i)) setCorrectIndex("0");
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </RadioGroup>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOptions([...options, { text: "" }])}
                    >
                      <Plus className="size-3.5" /> Add option
                    </Button>
                  </div>
                )}

                <Button type="submit" disabled={creating}>
                  {creating ? "Adding…" : "Add Question"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this question?</AlertDialogTitle>
            <AlertDialogDescription>
              "{pendingDelete?.prompt}" and every student's answer to it will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
