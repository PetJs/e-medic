import { BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Module } from "@/types/api";

export function ModuleCoverThumb({
  module,
  className,
  iconClassName,
}: {
  module: Pick<Module, "cover_image_url" | "cover_image_status">;
  className?: string;
  iconClassName?: string;
}) {
  if (module.cover_image_status === "ready" && module.cover_image_url) {
    return (
      <img
        src={module.cover_image_url}
        alt=""
        loading="lazy"
        className={cn("aspect-video w-full rounded-lg object-cover", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex aspect-video flex-col items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-primary/15 to-brand-amber/10",
        className
      )}
    >
      <BookOpen className={cn("size-8 text-primary/60", iconClassName)} />
      {module.cover_image_status === "pending" && (
        <span className="text-[10px] font-medium text-muted-foreground">
          Generating cover…
        </span>
      )}
    </div>
  );
}
