import { Sparkles, MessageSquareQuote, ListTodo, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export function WelcomeView({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-6">
      <div className="grid w-full max-w-4xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
        {/* left: brand statement */}
        <div className="flex flex-col gap-7">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-foreground text-background text-[16px] font-semibold leading-none">
              %
            </div>
            <span className="text-display text-[16px] font-semibold tracking-[-0.01em] text-foreground">
              Percent
            </span>
          </div>
          <div>
            <h1 className="text-display text-[44px] font-semibold leading-[1.04] tracking-[-0.025em] text-foreground">
              An AI for<br />
              <span className="text-foreground/40">reading the room.</span>
            </h1>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
              When a chat is hard to read, Percent explains what they mean. When
              you don't know what to say, Percent drafts something you can use.
            </p>
          </div>
          <div className="flex items-center gap-5 text-mono-caps text-muted-foreground/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="live-dot" aria-hidden /> Local-first
            </span>
            <span>·</span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" strokeWidth={1.75} /> Private
            </span>
          </div>
          <div>
            <Button onClick={onContinue} size="lg" className="h-10 px-5">
              Get started
              <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
            </Button>
            <p className="mt-3 text-mono-caps text-muted-foreground/60">
              No account needed to try
            </p>
          </div>
        </div>

        {/* right: feature stack */}
        <div className="flex flex-col gap-3">
          <FeatureCard
            number="01"
            icon={<MessageSquareQuote className="h-[14px] w-[14px]" strokeWidth={1.75} />}
            label="Read the room"
            description="When a chat is hard to read, Percent explains what they're actually saying — tone, intent, the part they didn't say."
          />
          <FeatureCard
            number="02"
            icon={<Sparkles className="h-[14px] w-[14px]" strokeWidth={1.75} />}
            label="Reply with care"
            description="A few natural options you can send as-is, regenerate, or tweak. Never a single awkward autocomplete."
          />
          <FeatureCard
            number="03"
            icon={<ListTodo className="h-[14px] w-[14px]" strokeWidth={1.75} />}
            label="Stay on top of it"
            description="Hidden to-dos in chat get pulled into your task list. Follow-ups, deadlines, the stuff you'd forget."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  number,
  icon,
  label,
  description,
}: {
  number: string;
  icon: React.ReactNode;
  label: string;
  description: string;
}) {
  return (
    <div className="group relative flex items-start gap-4 rounded-lg border border-border/60 bg-card p-4 transition-colors duration-[var(--duration-fast)] hover:border-foreground/20">
      <div className="flex w-7 shrink-0 flex-col">
        <span className="text-mono-caps text-[10px] text-muted-foreground/50">{number}</span>
      </div>
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border/60 bg-background text-muted-foreground">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-display text-[14px] font-medium tracking-tight text-foreground">{label}</h3>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
