import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-colors duration-150",
        "placeholder:text-muted-foreground/70",
        "focus-visible:outline-none focus-visible:border-foreground/30 focus-visible:ring-2 focus-visible:ring-foreground/10",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
