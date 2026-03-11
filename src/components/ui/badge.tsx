import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

/* ==========================================================================
   BADGE COMPONENT - Using semantic design tokens
   Small, informative labels with proper contrast
   ========================================================================== */

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-base focus-visible:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-accent text-text-inverse hover:bg-accent-hover",
        secondary:
          "border-transparent bg-slate-200 text-text-primary hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600",
        destructive:
          "border-transparent bg-error text-text-inverse hover:bg-error/90",
        outline: "border-border text-text-primary",
        success:
          "border-transparent bg-success text-text-inverse",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
