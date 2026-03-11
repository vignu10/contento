import * as React from "react"

import { cn } from "@/lib/utils"

/* ==========================================================================
   INPUT COMPONENT - Using semantic design tokens
   Accessible, consistent, proper focus states
   ========================================================================== */

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-base text-text-primary placeholder:text-text-tertiary transition-base focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
