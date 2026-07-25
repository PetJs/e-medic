import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ChevronDown, ChevronRight, FileText, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PageHeader } from "@/components/PageHeader";
import { api, ApiError } from "@/lib/api";
import type { Content, Course, Lesson, Module } from "@/types/api";

interface LessonDetail extends Lesson {
  contents: Content[];
}

type PendingDelete =
  | { kind: "course"; item: Course }
  | { kind: "module"; item: Module }
  | { kind: "lesson"; item: Lesson }
  | { kind: "content"; item: Content };

const deleteCopy: Record<PendingDelete["kind"], (name: string) => string> = {
  course: (name) =>
    `Delete course "${name}"? All its modules, lessons, and uploaded files will be permanently removed.`,
  module: (name) =>
    `Delete module "${name}"? All its lessons and uploaded files will be permanently removed.`,
  lesson: (name) => `Delete lesson "${name}"? Its uploaded files will be permanently removed.`,
  content: (name) => `Delete "${name}"? The file will be permanently removed.`,
};

export default function AdminModules() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({});
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [contentsByLesson, setContentsByLesson] = useState<Record<string, Content[]>>({});
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCourses = useCallback(() => {
    api<{ courses: Course[] }>("/courses")
      .then((res) => setCourses(res.courses ?? []))
      .catch(() => {});
  }, []);

  useEffect(loadCourses, [loadCourses]);

  function loadModules(courseId: string) {
    api<Module[]>(`/modules?course_id=${courseId}`)
      .then((mods) =>
        setModulesByCourse((prev) => ({ ...prev, [courseId]: mods ?? [] }))
      )
      .catch(() => {});
  }

  function loadLessons(moduleId: string) {
    api<Lesson[]>(`/modules/${moduleId}/lessons`)
      .then((ls) =>
        setLessonsByModule((prev) => ({ ...prev, [moduleId]: ls ?? [] }))
      )
      .catch(() => {});
  }

  function loadContents(lessonId: string) {
    api<LessonDetail>(`/lessons/${lessonId}`)
      .then((l) =>
        setContentsByLesson((prev) => ({ ...prev, [lessonId]: l.contents ?? [] }))
      )
      .catch(() => {});
  }

  function handleError(err: unknown) {
    toast.error(err instanceof ApiError ? err.message : "Something went wrong.");
  }

  async function createCourse(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      await api("/admin/courses", {
        method: "POST",
        body: { title: data.title, description: data.description, is_published: true },
      });
      form.reset();
      loadCourses();
      toast.success("Course created.");
    } catch (err) {
      handleError(err);
    }
  }

  async function createModule(e: React.FormEvent<HTMLFormElement>, courseId: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      await api("/admin/modules", {
        method: "POST",
        body: {
          course_id: courseId,
          title: data.title,
          description: data.description,
          is_premium: data.is_premium === "on",
        },
      });
      form.reset();
      loadModules(courseId);
      toast.success("Module created.");
    } catch (err) {
      handleError(err);
    }
  }

  async function createLesson(e: React.FormEvent<HTMLFormElement>, moduleId: string) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    try {
      await api("/admin/lessons", {
        method: "POST",
        body: { module_id: moduleId, title: data.title, description: data.description },
      });
      form.reset();
      loadLessons(moduleId);
      toast.success("Lesson created.");
    } catch (err) {
      handleError(err);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      switch (pendingDelete.kind) {
        case "course": {
          const course = pendingDelete.item;
          await api(`/admin/courses/${course.id}`, { method: "DELETE" });
          if (expandedCourse === course.id) setExpandedCourse(null);
          loadCourses();
          break;
        }
        case "module": {
          const mod = pendingDelete.item;
          await api(`/admin/modules/${mod.id}`, { method: "DELETE" });
          if (expandedModule === mod.id) setExpandedModule(null);
          loadModules(mod.course_id);
          break;
        }
        case "lesson": {
          const lesson = pendingDelete.item;
          await api(`/admin/lessons/${lesson.id}`, { method: "DELETE" });
          if (expandedLesson === lesson.id) setExpandedLesson(null);
          loadLessons(lesson.module_id);
          break;
        }
        case "content": {
          const content = pendingDelete.item;
          await api(`/admin/content/${content.id}`, { method: "DELETE" });
          loadContents(content.lesson_id);
          break;
        }
      }
      toast.success("Deleted successfully.");
      setPendingDelete(null);
    } catch (err) {
      handleError(err);
    } finally {
      setDeleting(false);
    }
  }

  const deleteName =
    pendingDelete?.kind === "content" ? pendingDelete.item.title : pendingDelete?.item.title;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Modules"
        description="Organize your content: courses contain modules, modules contain lessons."
      />

      {/* New course */}
      <Card>
        <CardContent>
          <form onSubmit={createCourse} className="flex flex-wrap items-end gap-3">
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="course-title">New Course</Label>
              <Input id="course-title" name="title" placeholder="e.g. Cardiovascular System" required />
            </div>
            <div className="min-w-48 flex-1 space-y-1.5">
              <Label htmlFor="course-desc">Description</Label>
              <Input id="course-desc" name="description" placeholder="Short summary" />
            </div>
            <Button type="submit">
              <Plus className="size-4" /> Add Course
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Course tree */}
      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No courses yet — create one above.</p>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => {
            const courseOpen = expandedCourse === course.id;
            const modules = modulesByCourse[course.id] ?? [];
            return (
              <Card key={course.id} className="gap-0 overflow-hidden py-0">
                <div
                  role="button"
                  tabIndex={0}
                  className="flex w-full cursor-pointer items-center gap-2 px-5 py-4 text-left transition-colors hover:bg-accent/50"
                  onClick={() => {
                    setExpandedCourse(courseOpen ? null : course.id);
                    if (!courseOpen) loadModules(course.id);
                  }}
                >
                  {courseOpen ? (
                    <ChevronDown className="size-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="size-4 text-muted-foreground" />
                  )}
                  <span className="flex-1 font-semibold">{course.title}</span>
                  <Badge variant={course.is_published ? "success" : "secondary"}>
                    {course.is_published ? "Published" : "Draft"}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    title="Delete course"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPendingDelete({ kind: "course", item: course });
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                {courseOpen && (
                  <div className="space-y-4 border-t px-5 py-4">
                    {modules.map((mod) => {
                      const modOpen = expandedModule === mod.id;
                      const lessons = lessonsByModule[mod.id] ?? [];
                      return (
                        <div key={mod.id} className="rounded-lg border">
                          <div
                            role="button"
                            tabIndex={0}
                            className="flex w-full cursor-pointer items-center gap-2 px-4 py-3 text-left transition-colors hover:bg-accent/50"
                            onClick={() => {
                              setExpandedModule(modOpen ? null : mod.id);
                              if (!modOpen) loadLessons(mod.id);
                            }}
                          >
                            {modOpen ? (
                              <ChevronDown className="size-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="size-4 text-muted-foreground" />
                            )}
                            <span className="flex-1 text-sm font-medium">{mod.title}</span>
                            <Badge variant={mod.is_premium ? "premium" : "success"}>
                              {mod.is_premium ? "Premium" : "Free Preview"}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-7 text-muted-foreground hover:text-destructive"
                              title="Delete module"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPendingDelete({ kind: "module", item: mod });
                              }}
                            >
                              <Trash2 className="size-3.5" />
                            </Button>
                          </div>
                          {modOpen && (
                            <div className="space-y-3 border-t px-4 py-3">
                              {lessons.length > 0 && (
                                <ul className="space-y-1 text-sm">
                                  {lessons.map((l, i) => {
                                    const lessonOpen = expandedLesson === l.id;
                                    const contents = contentsByLesson[l.id] ?? [];
                                    return (
                                      <li key={l.id}>
                                        <div className="flex items-center gap-1">
                                          <button
                                            type="button"
                                            className="flex flex-1 items-center gap-1 py-1 text-left text-muted-foreground hover:text-foreground"
                                            onClick={() => {
                                              setExpandedLesson(lessonOpen ? null : l.id);
                                              if (!lessonOpen) loadContents(l.id);
                                            }}
                                          >
                                            {lessonOpen ? (
                                              <ChevronDown className="size-3" />
                                            ) : (
                                              <ChevronRight className="size-3" />
                                            )}
                                            {i + 1}. {l.title}
                                          </button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="size-6 text-muted-foreground hover:text-destructive"
                                            title="Delete lesson"
                                            onClick={() =>
                                              setPendingDelete({ kind: "lesson", item: l })
                                            }
                                          >
                                            <Trash2 className="size-3" />
                                          </Button>
                                        </div>
                                        {lessonOpen && (
                                          <ul className="ml-5 space-y-1 border-l pl-3">
                                            {contents.length === 0 ? (
                                              <li className="py-0.5 text-xs text-muted-foreground">
                                                No files uploaded — use the Uploads page.
                                              </li>
                                            ) : (
                                              contents.map((c) => (
                                                <li
                                                  key={c.id}
                                                  className="flex items-center gap-2 py-0.5 text-xs text-muted-foreground"
                                                >
                                                  <FileText className="size-3" />
                                                  <span className="flex-1">
                                                    {c.title}{" "}
                                                    <span className="uppercase">({c.type})</span>
                                                  </span>
                                                  <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="size-5 text-muted-foreground hover:text-destructive"
                                                    title="Delete file"
                                                    onClick={() =>
                                                      setPendingDelete({ kind: "content", item: c })
                                                    }
                                                  >
                                                    <Trash2 className="size-3" />
                                                  </Button>
                                                </li>
                                              ))
                                            )}
                                          </ul>
                                        )}
                                      </li>
                                    );
                                  })}
                                </ul>
                              )}
                              <form
                                onSubmit={(e) => createLesson(e, mod.id)}
                                className="flex flex-wrap items-end gap-2"
                              >
                                <Input
                                  name="title"
                                  placeholder="New lesson title"
                                  className="h-8 flex-1"
                                  required
                                />
                                <Input
                                  name="description"
                                  placeholder="Description"
                                  className="h-8 flex-1"
                                />
                                <Button type="submit" size="sm" variant="outline">
                                  <Plus className="size-3" /> Lesson
                                </Button>
                              </form>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    <form
                      onSubmit={(e) => createModule(e, course.id)}
                      className="flex flex-wrap items-end gap-2 rounded-lg bg-muted/40 p-3"
                    >
                      <Input name="title" placeholder="New module title" className="h-8 flex-1" required />
                      <Input name="description" placeholder="Description" className="h-8 flex-1" />
                      <label className="flex items-center gap-1.5 text-xs font-medium">
                        <input type="checkbox" name="is_premium" defaultChecked />
                        Premium
                      </label>
                      <Button type="submit" size="sm">
                        <Plus className="size-3" /> Module
                      </Button>
                    </form>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.kind}?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && deleteCopy[pendingDelete.kind](deleteName ?? "")}
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
