import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ eyebrow, title, description, meta, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "relative flex shrink-0 items-start justify-between gap-6 border-b border-border/60 bg-background px-10 py-8",
        className
      )}
    >
      <div className="min-w-0 flex-1">
        {eyebrow && (
          <div className="mb-2.5 flex items-center gap-2 text-mono-caps text-muted-foreground/80">
            <span className="live-dot" aria-hidden />
            <span>{eyebrow}</span>
          </div>
        )}
        <h1 className="text-display text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-foreground">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-prose text-[13.5px] leading-relaxed text-muted-foreground">
            {description}
          </p>
        )}
        {meta && <div className="mt-3.5 text-mono-caps text-muted-foreground">{meta}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2 pt-1">{actions}</div>}
    </header>
  );
}
