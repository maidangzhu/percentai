import { invoke } from "@tauri-apps/api/core";
import {
  CheckCircle2,
  XCircle,
  RefreshCcw,
  ShieldCheck,
  Loader2,
  Monitor,
  MousePointer2,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
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
  const requiredPermissions = permissions.filter((permission) => permission.required);
  const grantedRequiredCount = requiredPermissions.filter((permission) => permission.granted).length;
  const allGranted = requiredPermissions.length === grantedRequiredCount;
  const optionalCount = permissions.length - requiredPermissions.length;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow="权限"
        title={title}
        description={subtitle}
        meta={
          permissions.length > 0 && (
            <div className="flex items-center gap-5">
              <PermissionMetric label="Required" value={`${grantedRequiredCount}/${requiredPermissions.length}`} />
              {optionalCount > 0 && <PermissionMetric label="Optional" value={optionalCount} />}
            </div>
          )
        }
        actions={
          <Button variant="outline" size="sm" onClick={onRefresh} className="h-7">
            <RefreshCcw className="h-3 w-3" strokeWidth={1.75} />
            刷新
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="mx-auto w-full max-w-[980px] px-10 py-8">
          {permissions.length === 0 ? (
            <EmptyPermissionState />
          ) : (
            <div className="space-y-5 stagger">
              <PermissionSummary
                allGranted={allGranted}
                grantedRequiredCount={grantedRequiredCount}
                requiredCount={requiredPermissions.length}
              />
              <ul className="grid gap-3 md:grid-cols-2">
                {permissions.map((permission) => (
                  <PermissionCard key={permission.id} permission={permission} onRefresh={onRefresh} />
                ))}
              </ul>
            </div>
          )}

          <div className="mt-7 flex items-center justify-between border-t border-border/50 pt-5">
            <p className="max-w-md text-[12.5px] leading-relaxed text-muted-foreground">
              授权完成后点击刷新。macOS 有时需要重启应用或重新打开窗口后才会同步新状态。
            </p>
            <Button onClick={onContinue} disabled={!allGranted} className="h-8 px-5">
              {allGranted ? continueLabel : continueDisabledLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PermissionMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col">
      <span className="text-mono-caps text-muted-foreground/70">{label}</span>
      <span className="text-display text-[14px] tracking-tight text-foreground">{value}</span>
    </div>
  );
}

function EmptyPermissionState() {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/25 px-6 py-14 text-center">
      <CheckCircle2 className="mx-auto h-5 w-5 text-emerald-600" strokeWidth={1.75} />
      <p className="mt-3 text-[13.5px] font-medium text-foreground">当前系统不需要额外权限</p>
      <p className="mt-1 text-[12.5px] text-muted-foreground">可以直接继续使用 Percent。</p>
    </div>
  );
}

function PermissionSummary({
  allGranted,
  grantedRequiredCount,
  requiredCount,
}: {
  allGranted: boolean;
  grantedRequiredCount: number;
  requiredCount: number;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-lg border px-4 py-3.5",
        allGranted
          ? "border-emerald-500/25 bg-emerald-500/[0.06]"
          : "border-amber-500/25 bg-amber-500/[0.07]",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-md border",
            allGranted
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700"
              : "border-amber-500/25 bg-amber-500/10 text-amber-700",
          )}
        >
          {allGranted ? (
            <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} />
          ) : (
            <ShieldCheck className="h-4 w-4" strokeWidth={1.75} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-display text-[14px] font-medium tracking-tight text-foreground">
            {allGranted ? "权限已就绪" : "还需要完成权限授权"}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
            必需权限 {grantedRequiredCount}/{requiredCount} 已开启。Percent 需要这些权限来识别前台应用并读取当前屏幕内容。
          </p>
        </div>
      </div>
    </section>
  );
}

function PermissionCard({
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

  const Icon = permissionIcon(permission.id);
  const status = getPermissionStatus(permission);

  return (
    <li
      className={cn(
        "group relative flex min-h-[168px] flex-col overflow-hidden rounded-lg border bg-card transition-colors",
        permission.granted
          ? "border-border/60"
          : permission.required
            ? "border-amber-500/25 bg-amber-500/[0.035]"
            : "border-border/60",
      )}
    >
      <span
        className={cn(
          "absolute inset-x-0 top-0 h-[3px]",
          permission.granted ? "bg-emerald-500" : permission.required ? "bg-amber-500" : "bg-border",
        )}
        aria-hidden
      />

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center rounded-md border",
                permission.granted
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700"
                  : "border-border/70 bg-background text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
            </div>
            <div className="min-w-0">
              <h3 className="text-display truncate text-[14px] font-medium tracking-tight text-foreground">
                {permission.name}
              </h3>
              <p className="mt-0.5 text-mono-caps text-muted-foreground/70">
                {permission.required ? "Required" : "Optional"}
              </p>
            </div>
          </div>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>

        <p className="mt-4 flex-1 text-[12.5px] leading-relaxed text-muted-foreground">
          {permission.description}
        </p>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-border/50 pt-3">
          <div className="flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
            {permission.granted ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.75} />
            ) : (
              <XCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            <span>{permission.granted ? "已授权" : "未授权"}</span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {!permission.granted && (
              <Button variant="outline" size="sm" onClick={request} className="h-7">
                请求授权
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={open} className="h-7 text-muted-foreground hover:text-foreground">
              <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
              设置
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}

function permissionIcon(id: string): LucideIcon {
  if (id === "screen_recording") return Monitor;
  if (id === "accessibility") return MousePointer2;
  return ShieldCheck;
}

function getPermissionStatus(permission: PermissionStatus): {
  label: string;
  variant: "success" | "destructive" | "muted";
} {
  if (permission.granted) return { label: "Granted", variant: "success" };
  if (permission.required) return { label: "Required", variant: "destructive" };
  return { label: "Optional", variant: "muted" };
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
