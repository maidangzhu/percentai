import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10.5px] font-medium tracking-tight transition-colors duration-[var(--duration-fast)]",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border border-border/80 text-foreground",
        muted: "bg-muted text-muted-foreground",
        success: "bg-emerald-500/10 text-emerald-700",
        destructive: "bg-destructive/10 text-destructive",
        accent: "bg-foreground text-background",
      },
    },
    defaultVariants: { variant: "muted" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
