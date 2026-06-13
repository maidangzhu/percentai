import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Camera,
  Calendar as CalendarIcon,
  Keyboard,
  Trash2,
  LogOut,
  CheckCircle2,
  AlertCircle,
  User2,
  Timer,
  ClipboardCopy,
  KeyRound,
  Eye,
  EyeOff,
  Plug,
} from "lucide-react";
import { db } from "@/db/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { isCalendarAutoAddEnabled } from "@/lib/calendar";
import type { AuthUser, PermissionStatus, ShortcutConfig } from "@/lib/types";
import { PROVIDER_PRESETS, type ProviderId } from "@percent/runtime";
import {
  clearByokKey,
  loadByokConfig,
  loadByokKey,
  saveByokConfig,
  saveByokKey,
  type ByokConfig,
} from "@/lib/byokConfig";

const SHORTCUT_OPTIONS: { label: string; value: ShortcutConfig }[] = [
  { label: "Enter", value: { key: "Enter", modifiers: [] } },
  { label: "⌘ + Enter", value: { key: "Enter", modifiers: ["Command"] } },
  { label: "⌃ + Enter", value: { key: "Enter", modifiers: ["Control"] } },
];

function shortcutEquals(a: ShortcutConfig, b: ShortcutConfig) {
  return a.key === b.key && a.modifiers.join(",") === b.modifiers.join(",");
}

interface SettingsViewProps {
  screenshotEnabled: boolean;
  onToggleScreenshot: () => void;
  shortcutConfig: ShortcutConfig;
  onShortcutSaved: (shortcut: ShortcutConfig) => void;
  permissions: PermissionStatus[];
  onRefreshPermissions: () => void;
  authUser: AuthUser;
  onSignOut: () => void;
  onCacheCleared: () => void;
}

export function SettingsView(props: SettingsViewProps) {
  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow="配置"
        title="设置"
        description="截屏、日历、快捷键和本地数据。"
      />
      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="mx-auto w-full max-w-2xl divide-y divide-border/40 stagger">
          <AccountSection authUser={props.authUser} onSignOut={props.onSignOut} />
          <ByokSection />
          <CaptureSection
            screenshotEnabled={props.screenshotEnabled}
            onToggleScreenshot={props.onToggleScreenshot}
          />
          <ReplySection />
          <TaskCaptureSection />
          <CalendarSection />
          <ShortcutSection
            shortcutConfig={props.shortcutConfig}
            onShortcutSaved={props.onShortcutSaved}
          />
          <ClearCacheSection onCacheCleared={props.onCacheCleared} />
        </div>
      </div>
    </div>
  );
}

function AccountSection({ authUser, onSignOut }: { authUser: AuthUser; onSignOut: () => void }) {
  return (
    <SettingRow
      index="01"
      icon={<User2 className="h-[14px] w-[14px]" strokeWidth={1.75} />}
      title="账号"
      description="用邮箱登录。账号信息存 Neon，业务数据全在这台 Mac 上。"
    >
      <div className="flex items-center gap-2.5">
        <span className="font-mono text-[12px] tabular-nums text-muted-foreground">{authUser.email}</span>
        <Button variant="outline" size="sm" onClick={onSignOut} className="h-7">
          <LogOut className="h-3 w-3" strokeWidth={1.75} />
          退出登录
        </Button>
      </div>
    </SettingRow>
  );
}

function CaptureSection({
  screenshotEnabled,
  onToggleScreenshot,
}: {
  screenshotEnabled: boolean;
  onToggleScreenshot: () => void;
}) {
  return (
    <SettingRow
      index="02"
      icon={<Camera className="h-[14px] w-[14px]" strokeWidth={1.75} />}
      title="截屏"
      description="在微信里按快捷键时，先截一张前台 app 的图，然后跑 AI 流水线。"
    >
      <Switch checked={screenshotEnabled} onCheckedChange={onToggleScreenshot} />
    </SettingRow>
  );
}

function CalendarSection() {
  const [autoAdd, setAutoAdd] = useState(true);
  useEffect(() => {
    setAutoAdd(isCalendarAutoAddEnabled());
  }, []);
  return (
    <SettingRow
      index="04"
      icon={<CalendarIcon className="h-[14px] w-[14px]" strokeWidth={1.75} />}
      title="日历"
      description="开启后，有截止时间的任务会加到 macOS 日历（1 小时块）。首次会弹 macOS 授权。"
    >
      <Switch
        checked={autoAdd}
        onCheckedChange={(next) => {
          setAutoAdd(next);
          localStorage.setItem("percent.calendar.autoAdd", String(next));
        }}
      />
    </SettingRow>
  );
}

const REPLY_WRITE_CLIPBOARD_KEY = "percent.reply.writeToClipboard";

function isReplyWriteClipboardEnabled() {
  if (typeof localStorage === "undefined") return true;
  // 默认开 — 显式存了 "false" 才算关
  return localStorage.getItem(REPLY_WRITE_CLIPBOARD_KEY) !== "false";
}

function ReplySection() {
  const [writeClipboard, setWriteClipboard] = useState(true);
  useEffect(() => {
    setWriteClipboard(isReplyWriteClipboardEnabled());
    const sync = (event: StorageEvent) => {
      if (event.key !== REPLY_WRITE_CLIPBOARD_KEY) return;
      setWriteClipboard(isReplyWriteClipboardEnabled());
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  return (
    <SettingRow
      index="03"
      icon={<ClipboardCopy className="h-[14px] w-[14px]" strokeWidth={1.75} />}
      title="回复建议"
      description="开启后，生成的回复会自动复制到剪贴板，你再 ⌘V 粘到聊天框。关掉就只能屏幕上读。"
    >
      <Switch
        checked={writeClipboard}
        onCheckedChange={(next) => {
          setWriteClipboard(next);
          localStorage.setItem(REPLY_WRITE_CLIPBOARD_KEY, String(next));
        }}
      />
    </SettingRow>
  );
}

function TaskCaptureSection() {
  const [autoCreate, setAutoCreate] = useState(true);
  useEffect(() => {
    setAutoCreate(localStorage.getItem("percent.task.autoCreateOnCountdown") !== "false");
  }, []);
  return (
    <SettingRow
      index="03"
      icon={<Timer className="h-[14px] w-[14px]" strokeWidth={1.75} />}
      title="任务捕捉"
      description="气泡弹出待办候选时，6.5s 倒计时结束后自动确认。关掉则每次都需手动 Confirm 或 Ignore。"
    >
      <Switch
        checked={autoCreate}
        onCheckedChange={(next) => {
          setAutoCreate(next);
          localStorage.setItem("percent.task.autoCreateOnCountdown", String(next));
        }}
      />
    </SettingRow>
  );
}

function ShortcutSection({
  shortcutConfig,
  onShortcutSaved,
}: {
  shortcutConfig: ShortcutConfig;
  onShortcutSaved: (shortcut: ShortcutConfig) => void;
}) {
  const [draft, setDraft] = useState<ShortcutConfig>(shortcutConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    setDraft(shortcutConfig);
  }, [shortcutConfig]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const saved = await invoke<ShortcutConfig>("set_shortcut_config", { shortcut: draft });
      onShortcutSaved(saved);
      setMessage({ kind: "ok", text: "已保存" });
    } catch (e) {
      console.error("[settings] save shortcut failed:", e);
      setMessage({ kind: "err", text: "暂不支持" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingRow
      index="04"
      icon={<Keyboard className="h-[14px] w-[14px]" strokeWidth={1.75} />}
      title="截屏快捷键"
      description="触发截屏 + 分析流程。"
    >
      <div className="flex flex-col items-end gap-2">
        <div className="inline-flex rounded-md border border-border/60 bg-card p-0.5">
          {SHORTCUT_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              onClick={() => {
                setDraft(option.value);
                setMessage(null);
              }}
              className={cn(
                "rounded-[5px] px-3 py-1 text-[12px] font-medium transition-colors",
                shortcutEquals(draft, option.value)
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {message && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px]",
                message.kind === "ok" ? "text-emerald-700" : "text-destructive"
              )}
            >
              {message.kind === "ok" ? (
                <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
              ) : (
                <AlertCircle className="h-3 w-3" strokeWidth={2} />
              )}
              {message.text}
            </span>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={save}
            disabled={saving}
            className="h-7 px-3 text-[12px]"
          >
            {saving ? "保存中…" : "保存"}
          </Button>
        </div>
      </div>
    </SettingRow>
  );
}

function ClearCacheSection({ onCacheCleared }: { onCacheCleared: () => void }) {
  const [open, setOpen] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const clear = async () => {
    setClearing(true);
    setMessage(null);
    try {
      // All persistence is now local SQLite (Diesel in the Rust process).
      // Clear cache = clear_local_cache Tauri command (deletes screenshots)
      // + wipe the local log / people / task tables through the same
      // `db_*` invoke surface.
      const [removed, deletedLogs, deletedPeople, deletedTasks] = await Promise.all([
        invoke<number>("clear_local_cache"),
        db.purgeAllLogs(),
        db.purgeAllPeople(),
        db.purgeAllTasks(),
      ]);
      setMessage({
        kind: "ok",
        text:
          removed > 0 || deletedLogs > 0 || deletedPeople > 0 || deletedTasks > 0
            ? `已清空 ${removed} 缓存 · ${deletedLogs} 日志 · ${deletedPeople} 联系人 · ${deletedTasks} 任务`
            : "没有可清空的内容",
      });
      onCacheCleared();
      setOpen(false);
    } catch (e) {
      console.error("[settings] clear cache failed:", e);
      setMessage({ kind: "err", text: "Couldn't clear — see console" });
    } finally {
      setClearing(false);
    }
  };

  return (
    <SettingRow
      index="05"
      icon={<Trash2 className="h-[14px] w-[14px]" strokeWidth={1.75} />}
      title="清空本地数据"
      description="删除缓存的截图、本地的按 Enter/AI 日志、以及 server 端所有日志、联系人、聊天、任务。"
    >
      <div className="flex flex-col items-end gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen((v) => !v)}
          className="h-7 text-destructive hover:text-destructive"
        >
          清空缓存
        </Button>
        {open && (
          <Card className="w-80 p-4 animate-fade-in-up">
            <p className="text-[13.5px] font-medium text-foreground">清空所有本地数据？</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
              这会删除缓存的截图、本地日志、以及 server 端所有日志、联系人、聊天、任务。无法撤销。
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={clearing} className="h-7 px-2.5 text-[12px]">
                取消
              </Button>
              <Button size="sm" variant="destructive" onClick={() => void clear()} disabled={clearing} className="h-7 px-2.5 text-[12px]">
                {clearing ? "清空中…" : "全部清空"}
              </Button>
            </div>
          </Card>
        )}
        {message && (
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[11px]",
              message.kind === "ok" ? "text-emerald-700" : "text-destructive"
            )}
          >
            {message.kind === "ok" ? (
              <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
            ) : (
              <AlertCircle className="h-3 w-3" strokeWidth={2} />
            )}
            {message.text}
          </span>
        )}
      </div>
    </SettingRow>
  );
}

function ByokSection() {
  const [draft, setDraft] = useState<ByokConfig>(() => loadByokConfig());
  const [apiKeyDraft, setApiKeyDraft] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    loadByokKey()
      .then((k) => {
        if (alive) setHasKey(Boolean(k));
      })
      .catch(() => {
        if (alive) setHasKey(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const preset = PROVIDER_PRESETS[draft.provider];

  const onProviderChange = (next: ProviderId) => {
    const p = PROVIDER_PRESETS[next];
    setDraft({
      ...draft,
      provider: next,
      modelId: p.defaultModelId,
      modelName: p.defaultModelName,
      baseUrl: p.baseUrl || draft.baseUrl,
    });
  };

  const onSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      if (apiKeyDraft.trim()) {
        await saveByokKey(apiKeyDraft.trim());
        setHasKey(true);
        setApiKeyDraft("");
        setShowKey(false);
      }
      saveByokConfig(draft);
      setMessage({ kind: "ok", text: "已保存" });
    } catch (e) {
      console.error("[settings] byok save failed:", e);
      setMessage({ kind: "err", text: "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const onClearKey = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await clearByokKey();
      setHasKey(false);
      setMessage({ kind: "ok", text: "已清除 key" });
    } catch (e) {
      console.error("[settings] byok clear failed:", e);
      setMessage({ kind: "err", text: "清除失败" });
    } finally {
      setSaving(false);
    }
  };

  const onToggleEnabled = (next: boolean) => {
    if (next && !hasKey) {
      setMessage({ kind: "err", text: "请先填写 API key" });
      return;
    }
    setDraft({ ...draft, enabled: next });
    saveByokConfig({ ...draft, enabled: next });
    setMessage({ kind: "ok", text: next ? "BYOK on" : "BYOK off" });
  };

  return (
    <SettingRow
      index="02"
      icon={<KeyRound className="h-[14px] w-[14px]" strokeWidth={1.75} />}
      title="BYOK (Bring Your Own Key)"
      description="Use your own LLM API key for the Ask-the-screen agent. Traffic goes directly to the provider — no server proxy, no credit deduction. You pay the provider."
    >
      <div className="flex w-[420px] flex-col items-stretch gap-3">
        <div className="flex items-center justify-between">
          <span className="text-[12px] text-muted-foreground">
            {draft.enabled ? "开启" : "关闭"}
            {draft.enabled && hasKey ? " · key 已保存" : draft.enabled ? " · 缺少 key" : ""}
          </span>
          <Switch
            checked={draft.enabled}
            onCheckedChange={onToggleEnabled}
            disabled={!hasKey && !draft.enabled}
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground">服务方</label>
          <select
            className="input mt-1 w-full"
            value={draft.provider}
            onChange={(e) => onProviderChange(e.target.value as ProviderId)}
          >
            {Object.values(PROVIDER_PRESETS).map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground">模型</label>
          {preset.suggestedModels && preset.suggestedModels.length > 0 ? (
            <select
              className="input mt-1 w-full"
              value={draft.modelId}
              onChange={(e) => {
                const found = preset.suggestedModels?.find((m) => m.id === e.target.value);
                setDraft({
                  ...draft,
                  modelId: e.target.value,
                  modelName: found?.name ?? e.target.value,
                });
              }}
            >
              {preset.suggestedModels.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            <input
              className="input mt-1 w-full"
              value={draft.modelId}
              onChange={(e) => setDraft({ ...draft, modelId: e.target.value })}
              placeholder={preset.defaultModelId}
            />
          )}
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground">API 地址</label>
          <input
            className="input mt-1 w-full font-mono text-[11.5px]"
            value={draft.baseUrl}
            onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
            placeholder="https://api.example.com/v1"
          />
        </div>

        <div>
          <label className="text-[11px] font-medium text-muted-foreground">
            API key {hasKey && <span className="text-emerald-700">· 已保存</span>}
          </label>
          <div className="relative mt-1">
            <input
              className="input w-full pr-9 font-mono text-[11.5px]"
              type={showKey ? "text" : "password"}
              value={apiKeyDraft}
              onChange={(e) => setApiKeyDraft(e.target.value)}
              placeholder={hasKey ? "•••••• (已保存；输入即替换)" : "sk-..."}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              onClick={() => setShowKey((s) => !s)}
              tabIndex={-1}
            >
              {showKey ? (
                <EyeOff className="h-3.5 w-3.5" strokeWidth={1.75} />
              ) : (
                <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {message && (
              <span
                className={cn(
                  "inline-flex items-center gap-1 text-[11px]",
                  message.kind === "ok" ? "text-emerald-700" : "text-destructive"
                )}
              >
                {message.kind === "ok" ? (
                  <CheckCircle2 className="h-3 w-3" strokeWidth={2} />
                ) : (
                  <AlertCircle className="h-3 w-3" strokeWidth={2} />
                )}
                {message.text}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasKey && (
              <Button
                size="sm"
                variant="outline"
                onClick={onClearKey}
                disabled={saving}
                className="h-7 px-3 text-[12px]"
              >
                清除 key
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onSave}
              disabled={saving}
              className="h-7 px-3 text-[12px]"
            >
              <Plug className="mr-1 h-3 w-3" strokeWidth={1.75} />
              {saving ? "保存中…" : "保存"}
            </Button>
          </div>
        </div>
      </div>
    </SettingRow>
  );
}

function SettingRow({
  index,
  icon,
  title,
  description,
  children,
}: {
  index: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-7">
      <div className="flex min-w-0 items-start gap-3.5">
        <div className="flex w-7 shrink-0 flex-col items-start pt-0.5">
          <span className="text-mono-caps text-[9.5px] text-muted-foreground/40">{index}</span>
        </div>
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-border/60 bg-card text-muted-foreground">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-display text-[14px] font-medium tracking-tight text-foreground">{title}</h3>
          <p className="mt-1 max-w-md text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-start pt-1">{children}</div>
    </div>
  );
}
