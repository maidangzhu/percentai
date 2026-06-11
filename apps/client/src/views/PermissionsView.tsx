import { invoke } from "@tauri-apps/api/core";
import { CheckCircle2, XCircle, RefreshCcw, ShieldCheck, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PermissionStatus } from "@/lib/types";

interface PermissionsViewProps {
  permissions: PermissionStatus[];
  onRefresh: () => void;
  onContinue: () => void;
  title?: string;
  subtitle?: string;
  continueLabel?: string;
  continueDisabledLabel?: string;
}

export function PermissionsView({
  permissions,
  onRefresh,
  onContinue,
  title = "Permissions",
  subtitle = "Grant the required permissions so Percent can capture and analyze chat.",
  continueLabel = "Continue",
  continueDisabledLabel = "Waiting for permissions",
}: PermissionsViewProps) {
  const allGranted = permissions.every((p) => !p.required || p.granted);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow="Setup"
        title={title}
        description={subtitle}
        actions={
          <Button variant="outline" size="sm" onClick={onRefresh} className="h-7">
            <RefreshCcw className="h-3 w-3" strokeWidth={1.75} />
            Refresh
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="mx-auto w-full max-w-2xl px-10 py-8">
          {permissions.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/30 px-6 py-12 text-center text-[13px] text-muted-foreground">
              No permissions are required for your system.
            </div>
          ) : (
            <ul className="flex flex-col gap-2 stagger">
              {permissions.map((permission) => (
                <PermissionRow key={permission.id} permission={permission} onRefresh={onRefresh} />
              ))}
            </ul>
          )}

          <div className="mt-8 flex items-center justify-end">
            <Button onClick={onContinue} disabled={!allGranted} className="h-8 px-5">
              {allGranted ? continueLabel : continueDisabledLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PermissionRow({
  permission,
  onRefresh,
}: {
  permission: PermissionStatus;
  onRefresh: () => void;
}) {
  const request = async () => {
    try {
      await invoke<boolean>("request_permission", { permissionId: permission.id });
      window.setTimeout(onRefresh, 600);
    } catch (e) {
      console.error("[permissions] request failed:", e);
    }
  };
  const open = async () => {
    try {
      await invoke("open_permission_settings", { permissionId: permission.id });
      window.setTimeout(onRefresh, 600);
    } catch (e) {
      console.error("[permissions] open settings failed:", e);
    }
  };

  return (
    <li
      className={cn(
        "relative flex items-start gap-3.5 overflow-hidden rounded-md border border-border/60 bg-card p-4 transition-colors"
      )}
    >
      {/* left status bar */}
      <span
        className={cn(
          "absolute left-0 top-0 h-full w-[3px]",
          permission.granted
            ? "bg-foreground"
            : "bg-destructive/50"
        )}
        aria-hidden
      />

      <div className="ml-2 mt-0.5">
        {permission.granted ? (
          <CheckCircle2 className="h-4 w-4 text-foreground" strokeWidth={1.75} />
        ) : (
          <XCircle className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="text-display text-[13.5px] font-medium tracking-tight text-foreground">
            {permission.name}
          </h3>
          <Badge variant={permission.granted ? "success" : "destructive"}>
            {permission.granted ? "Granted" : permission.required ? "Required" : "Optional"}
          </Badge>
          {permission.required && !permission.granted && (
            <ShieldCheck className="h-3 w-3 text-muted-foreground/60" strokeWidth={1.5} />
          )}
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{permission.description}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        {!permission.granted && (
          <Button variant="outline" size="sm" onClick={request} className="h-7">
            Request
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={open} className="h-7 text-muted-foreground hover:text-foreground">
          Open
        </Button>
      </div>
    </li>
  );
}

export function PermissionsOnboarding({
  permissions,
  loading,
  onRefresh,
  onContinue,
}: {
  permissions: PermissionStatus[];
  loading: boolean;
  onRefresh: () => void;
  onContinue: () => void;
}) {
  if (loading) {
    return (
      <CenterShell>
        <Loader2 className="mb-3 h-4 w-4 animate-spin text-muted-foreground" />
        <p className="text-[13px] text-muted-foreground">Checking permissions…</p>
      </CenterShell>
    );
  }
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-2xl">
        <PermissionsView
          permissions={permissions}
          onRefresh={onRefresh}
          onContinue={onContinue}
          title="Set up permissions"
          subtitle="Percent needs screen recording and accessibility access to capture and analyze chat."
          continueLabel="Continue"
          continueDisabledLabel="Grant required permissions to continue"
        />
      </div>
    </div>
  );
}

export function CenterShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-8">
      <div className="flex flex-col items-center">{children}</div>
    </div>
  );
}
