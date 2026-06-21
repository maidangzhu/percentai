import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  Camera,
  Calendar as CalendarIcon,
  Keyboard,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Timer,
  ClipboardCopy,
  KeyRound,
  Eye,
  EyeOff,
} from "lucide-react";
import { db } from "@/db/client";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { isCalendarAutoAddEnabled } from "@/lib/calendar";
import type { PermissionStatus, ShortcutConfig } from "@/lib/types";
import { PROVIDER_PRESETS, type ProviderId } from "@percent/runtime";
import {
  clearByokKey,
  isByokConfiguredAsync,
  loadByokConfig,
  loadByokKey,
  saveByokConfig,
  saveByokKey,
  type ByokConfig,
} from "@/lib/byokConfig";

const BYOK_PROVIDER_IDS = ["openai", "minimax"] as const satisfies readonly ProviderId[];
type ByokProviderId = (typeof BYOK_PROVIDER_IDS)[number];

const BYOK_PROVIDER_OPTIONS = BYOK_PROVIDER_IDS.map((id) => PROVIDER_PRESETS[id]);

function normalizeByokConfig(config: ByokConfig): ByokConfig {
  const provider: ByokProviderId = BYOK_PROVIDER_IDS.includes(config.provider as ByokProviderId)
    ? (config.provider as ByokProviderId)
    : "minimax";
  const preset = PROVIDER_PRESETS[provider];
  const model = preset.suggestedModels?.[0];
  return {
    ...config,
    provider,
    modelId: model?.id ?? preset.defaultModelId,
    modelName: model?.name ?? preset.defaultModelName,
    baseUrl: config.provider === provider && config.baseUrl ? config.baseUrl : preset.baseUrl,
  };
}

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
  onCacheCleared: () => void;
}

export function SettingsView(props: SettingsViewProps) {
  const [byokReady, setByokReady] = useState<boolean | null>(null);
  useEffect(() => {
    void isByokConfiguredAsync().then(setByokReady);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow="配置"
        title="设置"
        description="截屏、日历、快捷键和本地数据。"
      />
      {byokReady === false && <ByokRequiredBanner />}
      <div className="flex-1 overflow-y-auto scroll-thin">
        <div className="mx-auto w-full max-w-2xl divide-y divide-border/40 stagger">
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

function ByokRequiredBanner() {
  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 px-6 py-3 text-[12.5px] text-amber-900 dark:text-amber-200">
      <span className="font-medium">未配置 BYOK。</span>{" "}
      客户端无法直连 LLM —— 下面填一个 provider 和 key，截屏/回复/任务检测才会工作。
      （已加的 provider 走 {`https://`} 协议，baseUrl 会自动加 https://）
    </div>
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
      index="05"
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
      index="04"
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
      index="06"
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
      index="07"
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
  const [draft, setDraft] = useState<ByokConfig>(() => normalizeByokConfig(loadByokConfig()));
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
  const selectedProviderLabel = preset.label;
  const selectedModelLabel =
    preset.suggestedModels?.find((model) => model.id === draft.modelId)?.name ?? draft.modelName;

  const onProviderChange = (next: ProviderId) => {
    const p = PROVIDER_PRESETS[next];
    const model = p.suggestedModels?.[0];
    setDraft({
      ...draft,
      provider: next,
      modelId: model?.id ?? p.defaultModelId,
      modelName: model?.name ?? p.defaultModelName,
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

  void onToggleEnabled; // kept for reference; UI no longer exposes the toggle.

  return (
    <SettingRow
      index="01"
      icon={<KeyRound className="h-[14px] w-[14px]" strokeWidth={1.75} />}
      title="BYOK (Bring Your Own Key)"
      description="用你自己的 LLM API key，客户端直连 provider，不经 Percent 服务器。"
    >
      <div className="w-[460px]">
        {/* Status row */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-border/60 bg-muted/30 px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "inline-flex h-2 w-2 rounded-full",
                hasKey ? "bg-emerald-500" : "bg-amber-500",
              )}
            />
            <span className="text-[12.5px] text-foreground">
              {hasKey ? "已配置 key" : "未配置 key"}
            </span>
            {draft.enabled && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:text-emerald-300">
                启用
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3.5">
          {/* Provider */}
          <div className="space-y-1.5">
            <Label htmlFor="byok-provider" className="text-[11.5px] text-muted-foreground">
              服务方
            </Label>
            <Select
              value={draft.provider}
              onValueChange={(v) => onProviderChange(v as ProviderId)}
            >
              <SelectTrigger id="byok-provider" className="h-9 w-full">
                <SelectValue>{selectedProviderLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {BYOK_PROVIDER_OPTIONS.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Model */}
          <div className="space-y-1.5">
            <Label htmlFor="byok-model" className="text-[11.5px] text-muted-foreground">
              模型
            </Label>
            {preset.suggestedModels && preset.suggestedModels.length > 0 ? (
              <Select
                value={draft.modelId}
                onValueChange={(v) => {
                  const found = preset.suggestedModels?.find((m) => m.id === v);
                  setDraft({
                    ...draft,
                    modelId: v,
                    modelName: found?.name ?? v,
                  });
                }}
              >
                <SelectTrigger id="byok-model" className="h-9 w-full">
                  <SelectValue>{selectedModelLabel}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {preset.suggestedModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="byok-model"
                className="h-9"
                value={draft.modelId}
                onChange={(e) => setDraft({ ...draft, modelId: e.target.value })}
                placeholder={preset.defaultModelId}
              />
            )}
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <Label htmlFor="byok-url" className="text-[11.5px] text-muted-foreground">
              API 地址
            </Label>
            <Input
              id="byok-url"
              className="h-9 font-mono text-[12px]"
              value={draft.baseUrl}
              onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
              placeholder="https://api.example.com/v1"
            />
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <Label htmlFor="byok-key" className="text-[11.5px] text-muted-foreground">
              API key
              {hasKey && (
                <span className="ml-2 text-emerald-700 dark:text-emerald-300">· 已保存</span>
              )}
            </Label>
            <div className="relative">
              <Input
                id="byok-key"
                className="h-9 pr-9 font-mono text-[12px]"
                type={showKey ? "text" : "password"}
                value={apiKeyDraft}
                onChange={(e) => setApiKeyDraft(e.target.value)}
                placeholder={hasKey ? "•••••• (输入即替换)" : "sk-..."}
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
        </div>

        {/* Action row */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            {message && (
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 text-[12px]",
                  message.kind === "ok"
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-destructive",
                )}
              >
                {message.kind === "ok" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" strokeWidth={2} />
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
              >
                清除 key
              </Button>
            )}
            <Button size="sm" onClick={onSave} disabled={saving}>
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
