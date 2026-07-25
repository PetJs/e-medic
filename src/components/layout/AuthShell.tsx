import type { ReactNode } from "react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { GraduationCap, HeartPulse, Stethoscope } from "lucide-react";
import { Logo } from "@/components/Logo";
import { fadeInUp } from "@/lib/motion";

export function AuthShell({
  headline,
  subtext,
  children,
}: {
  headline: string;
  subtext: string;
  children: ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <Link to="/" className="mb-10 inline-flex w-fit">
          <Logo />
        </Link>
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeInUp()}
          className="w-full max-w-sm"
        >
          {children}
        </motion.div>
      </div>

      <div className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:items-center lg:justify-center lg:p-16">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-16 -right-16 size-72 rounded-full bg-brand-amber/25 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-10 size-80 rounded-full bg-white/10 blur-3xl"
        />

        <div className="relative flex items-center gap-4">
          <span className="flex size-16 items-center justify-center rounded-2xl bg-white/15 text-primary-foreground backdrop-blur-sm">
            <Stethoscope className="size-8" strokeWidth={1.75} />
          </span>
          <span className="flex size-16 translate-y-6 items-center justify-center rounded-2xl bg-white/15 text-primary-foreground backdrop-blur-sm">
            <HeartPulse className="size-8" strokeWidth={1.75} />
          </span>
          <span className="flex size-16 items-center justify-center rounded-2xl bg-white/15 text-primary-foreground backdrop-blur-sm">
            <GraduationCap className="size-8" strokeWidth={1.75} />
          </span>
        </div>

        <h2 className="relative mt-10 max-w-sm text-center text-2xl font-bold text-primary-foreground">
          {headline}
        </h2>
        <p className="relative mt-3 max-w-xs text-center font-body text-sm text-primary-foreground/80">
          {subtext}
        </p>
      </div>
    </div>
  );
}
