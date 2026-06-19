import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelectContext() {
  const ctx = React.useContext(SelectContext);
  if (!ctx) throw new Error("Select sub-component must be used inside <Select>");
  return ctx;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

export function Select({ value, onValueChange, children, disabled: _disabled }: SelectProps) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);

  // Close on outside click / Escape
  React.useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (contentRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, open, setOpen, triggerRef, contentRef }}
    >
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children?: React.ReactNode;
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  function SelectTrigger({ className, children, disabled, ...props }, _ref) {
    const ctx = useSelectContext();
    const localRef = React.useRef<HTMLButtonElement | null>(null);
    // Bridge local + parent ref
    const setRefs = React.useCallback(
      (node: HTMLButtonElement | null) => {
        localRef.current = node;
        (ctx.triggerRef as React.MutableRefObject<HTMLElement | null>).current = node;
      },
      [ctx.triggerRef],
    );
    return (
      <button
        ref={setRefs}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && ctx.setOpen(!ctx.open)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-[13px] shadow-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "data-[state=open]:border-foreground/30",
          className,
        )}
        data-state={ctx.open ? "open" : "closed"}
        {...props}
      >
        <span className="truncate text-left">{children}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
            ctx.open && "rotate-180",
          )}
          strokeWidth={1.75}
        />
      </button>
    );
  },
);

interface SelectContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectContent({ children, className }: SelectContentProps) {
  const ctx = useSelectContext();
  if (!ctx.open) return null;
  return (
    <div
      ref={ctx.contentRef as React.RefObject<HTMLDivElement>}
      role="listbox"
      className={cn(
        "absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg",
        "animate-in fade-in-0 zoom-in-95",
        className,
      )}
    >
      {children}
    </div>
  );
}

interface SelectItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export function SelectItem({ value, children, className }: SelectItemProps) {
  const ctx = useSelectContext();
  const isSelected = ctx.value === value;
  return (
    <div
      role="option"
      aria-selected={isSelected}
      onClick={() => {
        ctx.onValueChange(value);
        ctx.setOpen(false);
      }}
      className={cn(
        "relative flex h-8 cursor-pointer items-center rounded-sm px-2 pl-8 text-[13px] outline-none select-none",
        "hover:bg-accent hover:text-accent-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        isSelected && "font-medium",
        className,
      )}
    >
      {isSelected && (
        <span className="absolute left-2 inline-flex h-4 w-4 items-center justify-center">
          <Check className="h-3.5 w-3.5" strokeWidth={2} />
        </span>
      )}
      <span className="truncate">{children}</span>
    </div>
  );
}

interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder }: SelectValueProps) {
  // The trigger renders its children directly (so it can format the
  // selected label however it wants). This helper is a no-op here but
  // kept for API parity with Radix/shadcn.
  void placeholder;
  return null;
}
