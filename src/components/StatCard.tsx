import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { fadeInUp } from "@/lib/motion"

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  delay = 0,
  className,
}: {
  label: string
  value: ReactNode
  icon: LucideIcon
  tone?: "primary" | "amber" | "success"
  delay?: number
  className?: string
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    amber: "bg-brand-amber/15 text-brand-amber-foreground",
    success: "bg-success/15 text-success",
  }[tone]

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeInUp(delay)}
      className={className}
    >
      <Card className="gap-3 py-5">
        <CardContent className="flex items-center gap-4 px-5">
          <span
            className={cn(
              "inline-flex size-11 shrink-0 items-center justify-center rounded-xl",
              toneClasses
            )}
          >
            <Icon className="size-5" strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight text-foreground">
              {value}
            </p>
            <p className="truncate text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
