import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-3 px-8 py-20 text-center animate-fade-in",
        className
      )}
    >
      <div className="grid h-12 w-12 place-items-center rounded-full border border-dashed border-border bg-muted/30 text-muted-foreground">
        <Icon className="h-[18px] w-[18px]" strokeWidth={1.25} />
      </div>
      <div className="space-y-1">
        <p className="text-display text-[15px] font-medium tracking-tight text-foreground">{title}</p>
        {description && (
          <p className="mx-auto max-w-sm text-[13px] leading-relaxed text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
