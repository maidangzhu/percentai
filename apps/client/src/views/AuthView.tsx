import { useEffect, useState } from "react";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AUTH_BASE } from "@/lib/types";
import type { AuthUser } from "@/lib/types";

export function AuthView({
  initialError,
  onAuthenticated,
}: {
  initialError: string;
  onAuthenticated: (user: AuthUser) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(initialError);

  useEffect(() => {
    setMessage(initialError);
  }, [initialError]);

  const submit = async () => {
    const trimmedEmail = email.trim();
    const trimmedName = name.trim();
    if (!trimmedEmail || !password || (mode === "register" && !trimmedName)) {
      setMessage("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const resp = await fetch(`${AUTH_BASE}/${mode === "login" ? "sign-in/email" : "sign-up/email"}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          mode === "login"
            ? { email: trimmedEmail, password, rememberMe: true }
            : { name: trimmedName, email: trimmedEmail, password, rememberMe: true }
        ),
      });
      const body = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(body?.message ?? "Request failed. Please try again.");
      }
      const user = body?.user as AuthUser | undefined;
      if (user) {
        onAuthenticated(user);
        return;
      }
      const sessionResp = await fetch(`${AUTH_BASE}/get-session`, { credentials: "include" });
      const session = (await sessionResp.json().catch(() => null)) as { user?: AuthUser } | null;
      if (!session?.user) throw new Error("Signed in, but no session was returned.");
      onAuthenticated(session.user);
    } catch (e) {
      console.error("[auth] submit failed:", e);
      setMessage(e instanceof Error ? e.message : "Request failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-6">
      <div className="grid w-full max-w-3xl grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_minmax(360px,420px)]">
        {/* left: brand */}
        <div className="hidden flex-col gap-6 lg:flex">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-foreground text-background text-[14px] font-semibold leading-none">
              %
            </div>
            <span className="text-display text-[15px] font-semibold tracking-[-0.01em] text-foreground">
              Percent
            </span>
          </div>
          <div>
            <h1 className="text-display text-[40px] font-semibold leading-[1.05] tracking-[-0.025em] text-foreground">
              Read the room,<br />
              <span className="text-foreground/40">before you reply.</span>
            </h1>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-muted-foreground">
              A local-first companion that watches your chat, explains what people
              mean, and drafts replies you can actually use.
            </p>
          </div>
          <div className="flex items-center gap-5 text-mono-caps text-muted-foreground/70">
            <span className="inline-flex items-center gap-1.5">
              <span className="live-dot" /> Local-first
            </span>
            <span>·</span>
            <span>Mac-native</span>
            <span>·</span>
            <span>Private</span>
          </div>
        </div>

        {/* right: form */}
        <div className="rounded-xl border border-border/60 bg-card p-6 shadow-[0_1px_0_oklch(0.918_0.003_80)] animate-fade-in-up">
          <div className="mb-5 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background text-[13px] font-semibold">
                %
              </div>
              <span className="text-display text-[14px] font-semibold tracking-tight text-foreground">
                Percent
              </span>
            </div>
          </div>
          <h2 className="text-display text-[18px] font-semibold tracking-tight text-foreground">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {mode === "login" ? "Sign in to continue." : "A few details to get started."}
          </p>

          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v as "login" | "register");
              setMessage("");
            }}
          >
            <TabsList className="mt-5 grid w-full grid-cols-2">
              <TabsTrigger value="login">Sign in</TabsTrigger>
              <TabsTrigger value="register">Create</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-5 flex flex-col gap-3.5">
              <AuthFormFields
                mode="login"
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={submit}
              />
            </TabsContent>

            <TabsContent value="register" className="mt-5 flex flex-col gap-3.5">
              <AuthFormFields
                mode="register"
                name={name}
                setName={setName}
                email={email}
                setEmail={setEmail}
                password={password}
                setPassword={setPassword}
                onSubmit={submit}
              />
            </TabsContent>
          </Tabs>

          {message && (
            <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
              {message}
            </div>
          )}

          <Button onClick={() => void submit()} disabled={busy} className="mt-5 h-9 w-full">
            {busy ? "Working…" : mode === "login" ? "Sign in" : "Create account"}
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={2} />
          </Button>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground/80">
            Account &amp; session live in Neon. People, chats, tasks, and screenshots stay on this Mac.
          </p>
        </div>
      </div>
    </div>
  );
}

function AuthFormFields({
  mode,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  onSubmit,
}: {
  mode: "login" | "register";
  name?: string;
  setName?: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex flex-col gap-3.5">
      {mode === "register" && setName && (
        <Field icon={<User className="h-3.5 w-3.5" strokeWidth={1.5} />} label="Name">
          <Input
            value={name ?? ""}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            autoComplete="name"
          />
        </Field>
      )}
      <Field icon={<Mail className="h-3.5 w-3.5" strokeWidth={1.5} />} label="Email">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
        />
      </Field>
      <Field icon={<Lock className="h-3.5 w-3.5" strokeWidth={1.5} />} label="Password">
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onSubmit();
            }
          }}
          placeholder={mode === "login" ? "Your password" : "At least 8 characters"}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
      </Field>
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-mono-caps text-muted-foreground/70">{label}</Label>
      <div className="relative">
        <div className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60">
          {icon}
        </div>
        <div className="[&_input]:pl-8">{children}</div>
      </div>
    </div>
  );
}
