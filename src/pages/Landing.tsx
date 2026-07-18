import { Link } from "react-router";
import {
  Activity,
  BookOpen,
  Facebook,
  Linkedin,
  Lock,
  Pill,
  Stethoscope,
  Twitter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth";

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
    iconClass: "bg-emerald-100 text-emerald-600",
    title: "Pharmacology Basics",
    description:
      "Understand drug actions, classifications, and principles of safe medication administration.",
  },
  {
    icon: Stethoscope,
    iconClass: "bg-blue-100 text-blue-600",
    title: "Clinical Diagnosis Fundamentals",
    description:
      "Learn the systematic approach to patient assessment and diagnostic reasoning.",
  },
];

export default function Landing() {
  const { user } = useAuth();
  const appHome = user?.role === "admin" ? "/admin" : "/dashboard";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen className="size-4" />
            </span>
            <span className="text-lg font-bold">Jerome</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#modules" className="transition-colors hover:text-foreground">
              Modules
            </a>
            <a href="#about" className="transition-colors hover:text-foreground">
              About
            </a>
            <a href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </a>
          </nav>
          {user ? (
            <Button asChild>
              <Link to={appHome}>Dashboard</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,--theme(--color-primary/12%)_0%,transparent_65%)]"
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <h1 className="text-4xl font-extrabold tracking-tight md:text-6xl">
            Learn from Jerome — Master Medicine, One Module at a Time.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-muted-foreground md:text-lg">
            A modern, professional e-learning platform designed to help aspiring
            medical professionals master their studies with comprehensive,
            easy-to-follow content.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link to={user ? appHome : "/signup"}>Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#modules">Explore Modules</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Modules preview */}
      <section id="modules" className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-bold md:text-3xl">
            Explore Our Core Modules
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {previewModules.map(({ icon: Icon, iconClass, title, description }) => (
              <div
                key={title}
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
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="mt-auto border-t bg-muted/20 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-6">
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
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Jerome. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
