import { useEffect, useRef, useState } from "react";
import { CheckCircle2, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, apiUpload, ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Course, Lesson, Module } from "@/types/api";

export default function Uploads() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courseId, setCourseId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [lessonId, setLessonId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function pickFile(f: File | null) {
    setFile(f);
    if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function handleUpload() {
    if (!file || !lessonId) return;
    setError(null);
    setMessage(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("lesson_id", lessonId);
      formData.append("title", title || file.name);
      formData.append("file", file);
      await apiUpload("/admin/content", formData);
      setMessage(`"${title || file.name}" uploaded successfully.`);
      setFile(null);
      setTitle("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const selectClass =
    "border-input flex h-9 w-full rounded-md border bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Uploads</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload videos, PDFs, or images into a lesson. Files are stored privately
          and streamed with short-lived signed URLs.
        </p>
      </div>

      {message && (
        <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle2 className="size-4" /> {message}
        </p>
      )}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Course</Label>
              <select
                className={selectClass}
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
              >
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

          {/* Dropzone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files?.[0] ?? null);
            }}
            className={cn(
              "flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors",
              dragging && "border-primary bg-primary/5"
            )}
          >
            <FileUp className="size-8 text-muted-foreground" />
            {file ? (
              <p className="text-sm font-medium">{file.name}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drag &amp; drop video, PDF, or image here, or click to browse
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*,application/pdf,image/*"
              className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </Button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="content-title">Content Title</Label>
            <Input
              id="content-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to Cardiac Anatomy"
            />
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleUpload}
            disabled={!file || !lessonId || uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Uploading…
              </>
            ) : (
              "Upload Content"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
