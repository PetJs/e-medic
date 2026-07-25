import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, GraduationCap, Library } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { api } from "@/lib/api";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import type { Course } from "@/types/api";

export default function CourseLibrary() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ courses: Course[] }>("/courses")
      .then((res) => setCourses((res.courses ?? []).filter((c) => c.is_published)))
      .catch(() => toast.error("Couldn't load the course library."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Library"
        description="Browse courses, then dive into their modules and lessons."
      />

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="gap-3 py-4">
              <CardContent className="space-y-3 px-4">
                <Skeleton className="aspect-video w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={Library}
          title="No courses published yet"
          description="New content is on the way — check back soon."
        />
      ) : (
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerContainer}
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {courses.map((c) => (
            <motion.div key={c.id} variants={fadeInUp()} whileHover={{ y: -3 }}>
              <Card className="h-full gap-3 py-4">
                <CardContent className="flex h-full flex-col space-y-3 px-4">
                  {c.cover_image ? (
                    <img
                      src={c.cover_image}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex aspect-video items-center justify-center rounded-lg bg-gradient-to-br from-brand-amber/15 to-primary/10">
                      <GraduationCap className="size-8 text-primary/60" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold">{c.title}</p>
                    <p className="mt-1 line-clamp-2 font-body text-sm text-muted-foreground">
                      {c.description}
                    </p>
                  </div>
                  <Button size="sm" className="w-full" asChild>
                    <Link to={`/courses/${c.id}`}>
                      View Modules <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
