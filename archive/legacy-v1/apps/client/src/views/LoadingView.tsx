import { Loader2 } from "lucide-react";

export function LoadingView({ message }: { message: string }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-8">
      <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
}
