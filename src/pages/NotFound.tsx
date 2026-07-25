import { Link } from "react-router";
import { motion } from "framer-motion";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fadeInUp } from "@/lib/motion";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeInUp()}
        className="flex flex-col items-center gap-4"
      >
        <span className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Compass className="size-6" strokeWidth={1.75} />
        </span>
        <p className="text-6xl font-extrabold tracking-tight text-primary">404</p>
        <h1 className="text-xl font-bold">Page not found</h1>
        <p className="max-w-sm font-body text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </motion.div>
    </div>
  );
}
