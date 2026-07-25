import { Stethoscope } from "lucide-react"
import { cn } from "@/lib/utils"

export function Logo({
  className,
  iconOnly = false,
}: {
  className?: string
  iconOnly?: boolean
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Stethoscope className="size-4.5" strokeWidth={2.25} />
      </span>
      {!iconOnly && (
        <span className="text-lg font-bold tracking-tight text-foreground">
          Jerome
        </span>
      )}
    </span>
  )
}
