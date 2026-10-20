import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, BadgeCheck, BookOpen, Flame, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/PageHeader";
import { StatCard } from "@/components/StatCard";
import { EmptyState } from "@/components/EmptyState";
import { ModuleCoverThumb } from "@/components/ModuleCoverThumb";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import {
  accessEndsAt,
  findActiveSubscription,
  hasActiveAccess,
  isInGrace,
} from "@/lib/subscription";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import type { Module, Progress, Subscription } from "@/types/api";

export default function Dashboard() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);

  useEffect(() => {
    api<Subscription[]>("/subscriptions")
      .then((subs) => setSubscription(findActiveSubscription(subs)))
      .catch(() => toast.error("Couldn't load your subscription status."));
    api<Module[]>("/modules")
      .then((mods) => setModules(mods ?? []))
      .catch(() => toast.error("Couldn't load modules."));
    api<Progress[]>("/progress")
      .then((p) => setProgress(p ?? []))
      .catch(() => toast.error("Couldn't load your progress."));
  }, []);

  const completedLessons = progress.filter((p) => p.is_completed).length;
  const inProgressLessons = progress.filter((p) => !p.is_completed).length;
  const hasActiveSub = hasActiveAccess(subscription);
  const inGrace = isInGrace(subscription);
  const accessEnd = subscription ? accessEndsAt(subscription) : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.first_name}!`}
        description="Let's continue your learning journey."
        actions={
          hasActiveSub ? (
            <Button asChild>
              <Link to="/modules">
                Continue Learning <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/subscribe">Subscribe Now</Link>
            </Button>
          )
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Lessons Completed"
          value={completedLessons}
          icon={BadgeCheck}
          tone="success"
        />
        <StatCard
          label="In Progress"
          value={inProgressLessons}
          icon={Flame}
          tone="amber"
          delay={0.05}
        />
        <StatCard
          label="Modules Available"
          value={modules.length}
          icon={GraduationCap}
          delay={0.1}
        />
      </div>

      <Card>
        <CardContent className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Subscription Status
            </p>
            {hasActiveSub ? (
              <>
                <p className="mt-1 text-lg font-bold">Monthly Access</p>
                <p className="font-body text-sm text-muted-foreground">
                  {inGrace ? (
                    <>
                      Grace period — renew by{" "}
                      {accessEnd?.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      to keep access.
                    </>
                  ) : (
                    <>
                      Active — renews on{" "}
                      {new Date(subscription!.current_period_end).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                      .
                    </>
                  )}
                </p>
              </>
            ) : (
              <>
                <p className="mt-1 text-lg font-bold">No Active Plan</p>
                <p className="font-body text-sm text-muted-foreground">
                  Subscribe to unlock all modules and stream every lesson.
                </p>
              </>
            )}
          </div>
          {(!hasActiveSub || inGrace) && (
            <Button asChild>
              <Link to="/subscribe">{inGrace ? "Pay Now" : "Subscribe Now"}</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Explore Modules</h2>
        {modules.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No modules published yet"
            description="Check back soon — new content is on the way."
          />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={staggerContainer}
            className="grid gap-4 md:grid-cols-3"
          >
            {modules.slice(0, 3).map((m) => (
              <motion.div key={m.id} variants={fadeInUp()} whileHover={{ y: -3 }}>
                <Card className="h-full gap-3 py-4">
                  <CardContent className="flex h-full flex-col space-y-3 px-4">
                    <ModuleCoverThumb module={m} />
                    <div className="flex-1">
                      <p className="font-semibold">{m.title}</p>
                      <p className="mt-1 line-clamp-2 font-body text-xs text-muted-foreground">
                        {m.description}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/modules/${m.id}`}>View Details</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
