import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  Award,
  Facebook,
  GraduationCap,
  Linkedin,
  Lock,
  Pill,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Twitter,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/lib/auth";
import { fadeInUp, staggerContainer } from "@/lib/motion";

const previewModules = [
  {
    icon: Activity,
    iconClass: "bg-sky-100 text-sky-600",
    title: "Introduction to Cardiology",
    description:
      "Grasp the fundamentals of the heart, circulation, and common cardiovascular conditions.",
  },
  {
    icon: Pill,
    iconClass: "bg-success/15 text-success",
    title: "Pharmacology Basics",
    description:
      "Understand drug actions, classifications, and principles of safe medication administration.",
  },
  {
    icon: Stethoscope,
    iconClass: "bg-primary/10 text-primary",
    title: "Clinical Diagnosis Fundamentals",
    description:
      "Learn the systematic approach to patient assessment and diagnostic reasoning.",
  },
];

const benefits = [
  {
    icon: GraduationCap,
    title: "Built for medical curricula",
    description:
      "Modules structured the way you actually study — by system, by topic, by exam.",
  },
  {
    icon: ShieldCheck,
    title: "Stream-only, always available",
    description:
      "Secure video lessons you can revisit anytime, without eating up your device storage.",
  },
  {
    icon: Award,
    title: "Track every step forward",
    description:
      "Progress bars and completion streaks that keep momentum visible and motivating.",
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "Create your account",
    description: "Sign up in under a minute — no long onboarding forms.",
  },
  {
    icon: Sparkles,
    title: "Subscribe to unlock",
    description: "One simple plan unlocks every module, lesson, and resource.",
  },
  {
    icon: GraduationCap,
    title: "Start learning",
    description: "Stream lessons, track progress, and study at your own pace.",
  },
];

export default function Landing() {
  const { user } = useAuth();
  const appHome = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#modules" className="transition-colors hover:text-foreground">
              Modules
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#about" className="transition-colors hover:text-foreground">
              About
            </a>
          </nav>
          <Button asChild>
            <Link to={user ? appHome : "/login"}>
              {user ? "Dashboard" : "Login"}
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,--theme(--color-primary/12%)_0%,transparent_65%)]"
        />
        <motion.div
          initial="hidden"
          animate="show"
          variants={staggerContainer}
          className="relative mx-auto max-w-4xl px-6 py-12 text-center md:py-16"
        >
          <motion.div variants={fadeInUp()}>
            {/* <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <Stethoscope className="size-3.5 text-primary" />
              Built for medical students
            </Badge> */}
          </motion.div>
          <motion.h1
            variants={fadeInUp(0.05)}
            className="mt-6 text-4xl font-extrabold tracking-tight md:text-6xl"
          >
            Master medicine, one module at a time.
          </motion.h1>
          <motion.p
            variants={fadeInUp(0.1)}
            className="mx-auto mt-6 max-w-xl font-body text-muted-foreground md:text-lg"
          >
            A calm, focused e-learning platform that helps aspiring medical
            professionals study smarter — structured modules, secure video
            lessons, and progress that's always in view.
          </motion.p>
          <motion.div
            variants={fadeInUp(0.15)}
            className="mt-8 flex items-center justify-center gap-3"
          >
            <Button size="lg" asChild>
              <Link to={user ? appHome : "/signup"}>
                Get Started <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#modules">Explore Modules</a>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-3"
          >
            {benefits.map(({ icon: Icon, title, description }) => (
              <motion.div
                key={title}
                variants={fadeInUp()}
                className="rounded-xl border bg-card p-6"
              >
                <span className="flex size-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" strokeWidth={2} />
                </span>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  {description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Modules preview */}
      <section id="modules" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            Explore Our Core Modules
          </h2>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="mt-10 grid gap-6 md:grid-cols-3"
          >
            {previewModules.map(({ icon: Icon, iconClass, title, description }) => (
              <motion.div
                key={title}
                variants={fadeInUp()}
                whileHover={{ y: -3 }}
                className="rounded-xl border bg-background p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`flex size-11 items-center justify-center rounded-lg ${iconClass}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="size-3" /> Locked
                  </Badge>
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-2 font-body text-sm text-muted-foreground">
                  {description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            How it works
          </h2>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            variants={staggerContainer}
            className="mt-12 grid gap-10 sm:grid-cols-3"
          >
            {steps.map(({ icon: Icon, title, description }, i) => (
              <motion.div key={title} variants={fadeInUp()} className="text-center">
                <div className="relative mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Icon className="size-6" strokeWidth={2} />
                  <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-brand-amber text-[11px] font-bold text-brand-amber-foreground">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-4 font-semibold">{title}</h3>
                <p className="mt-1.5 font-body text-sm text-muted-foreground">
                  {description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA band */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-20">
        <div className="rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground">
          <h2 className="text-2xl font-bold md:text-3xl">
            Ready to start studying smarter?
          </h2>
          <p className="mx-auto mt-3 max-w-md font-body text-primary-foreground/80">
            Join Jerome today and get structured, stream-only access to every
            module you need.
          </p>
          <Button size="lg" variant="secondary" className="mt-6" asChild>
            <Link to={user ? appHome : "/signup"}>
              {user ? "Go to Dashboard" : "Create your account"}
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t bg-muted/20  py-4">
        <div className="mx-auto flex flex-col gap-3 items-center ">
          <Logo />
          <div className="flex gap-4 w-full max-w-6xl md:flex-row md:justify-between items-center">
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">FAQ</a>
              <a href="#" className="hover:text-foreground">Contact</a>
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Terms of Service</a>
            </nav>
            <div className="flex items-center gap-5 text-muted-foreground">
              <a href="#" aria-label="Facebook" className="hover:text-foreground">
                <Facebook className="size-4" />
              </a>
              <a href="#" aria-label="Twitter" className="hover:text-foreground">
                <Twitter className="size-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="hover:text-foreground">
                <Linkedin className="size-4" />
              </a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Jerome E-Platform. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
