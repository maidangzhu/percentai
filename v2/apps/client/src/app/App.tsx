import { useEffect, useState } from "react";
import {
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Command,
  Copy,
  Database,
  KeyRound,
  MessageSquareText,
  Monitor,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAppShellStore, type AppRoute, type SettingsSection } from "./appShellStore";
import { useI18n } from "../i18n/I18nProvider";
import { getReadinessSnapshot } from "../services/readiness/readinessService";
import { openNativePermissionSettings } from "../services/native/nativeClient";
import {
  loadProviderProfiles,
  runProviderCapabilityTest,
  saveProviderProfileForm,
  type ProviderProfileForm,
} from "../services/intelligence/providerProfileService";
import { getProviderPreset, providerPresets } from "../services/intelligence/providerPresets";
import type { ProviderPresetId, ProviderProfile } from "../services/intelligence/providerTypes";
import type {
  CapabilityState,
  CapabilityStatus,
  CoreActionStatus,
  ReadinessSnapshot,
  RepairTarget,
} from "../services/readiness/readinessTypes";
import type { MessageKey } from "../i18n/messages";

const navItems: Array<{ id: AppRoute; labelKey: MessageKey; icon: typeof Monitor }> = [
  { id: "home", labelKey: "nav.home", icon: Monitor },
  { id: "contacts", labelKey: "nav.contacts", icon: Users },
  { id: "calendar", labelKey: "nav.calendar", icon: CalendarDays },
  { id: "settings", labelKey: "nav.settings", icon: Settings },
];

const settingsItems: Array<{ id: SettingsSection; labelKey: MessageKey }> = [
  { id: "account", labelKey: "settings.account" },
  { id: "app", labelKey: "settings.app" },
  { id: "shortcuts-data", labelKey: "settings.shortcutsData" },
  { id: "intelligence", labelKey: "settings.intelligence" },
  { id: "permissions", labelKey: "settings.permissions" },
];

const stateLabel: Record<CapabilityState, string> = {
  ready: "Ready",
  degraded: "Degraded",
  blocked: "Blocked",
  not_configured: "Not Configured",
  unknown: "Unknown",
};

export function App() {
  const [readiness, setReadiness] = useState<ReadinessSnapshot | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getReadinessSnapshot()
      .then((snapshot) => {
        if (mounted) {
          setReadiness(snapshot);
        }
      })
      .catch(() => {
        if (mounted) {
          setLoadError("Readiness failed to load. Reload the app or check the local service boundary.");
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loadError) {
    return <AppError message={loadError} />;
  }

  if (!readiness) {
    return <LoadingShell />;
  }

  return <AppShell readiness={readiness} />;
}

function AppShell({ readiness }: { readiness: ReadinessSnapshot }) {
  const route = useAppShellStore((state) => state.route);
  const setRoute = useAppShellStore((state) => state.setRoute);
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="window-controls" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>

        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            %
          </div>
          <div className="brand-copy">
            <strong>Percent</strong>
            <span>{t("brand.subtitle")}</span>
          </div>
        </div>

        <nav className="nav-list">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                className="nav-button"
                data-active={route === item.id}
                type="button"
                onClick={() => setRoute(item.id)}
              >
                <Icon aria-hidden="true" size={17} />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-status">
          <StatusDot state="ready" />
          <span>{readiness.runtime.tauri ? t("shell.tauriActive") : t("shell.browserPreview")}</span>
        </div>
      </aside>

      <div className="client-frame">
        <TopBar readiness={readiness} />
        <div className="workspace">
          <main id="main-content" className="main-content">
            {route === "home" ? <HomeView readiness={readiness} /> : null}
            {route === "contacts" ? <PlaceholderView kind="contacts" /> : null}
            {route === "calendar" ? <PlaceholderView kind="calendar" /> : null}
            {route === "settings" ? <SettingsView readiness={readiness} /> : null}
          </main>
          <RightAgentRail />
        </div>
      </div>

      <BubblePreview readiness={readiness} />
    </div>
  );
}

function TopBar({ readiness }: { readiness: ReadinessSnapshot }) {
  const provider = readiness.capabilities.find((capability) => capability.key === "provider_image");
  const screen = readiness.capabilities.find((capability) => capability.key === "screen_recording");
  const input = readiness.capabilities.find((capability) => capability.key === "input_monitoring");
  const { t } = useI18n();

  return (
    <header className="topbar">
      <div className="topbar-title">
        <span className="topbar-app">Percent v2</span>
        <span className="topbar-subtitle">
          {readiness.runtime.tauri ? "Tauri desktop" : t("shell.browserPreview")} · {readiness.runtime.platform}
        </span>
      </div>
      <div className="topbar-status" aria-label="Readiness summary">
        {provider ? <MiniStatus capability={provider} /> : null}
        {screen ? <MiniStatus capability={screen} /> : null}
        {input ? <MiniStatus capability={input} /> : null}
      </div>
      <button className="account-button" type="button">
        {t("shell.accountOptional")}
      </button>
    </header>
  );
}

function MiniStatus({ capability }: { capability: CapabilityStatus }) {
  return (
    <span className="mini-status" data-state={capability.state}>
      <StatusDot state={capability.state} />
      {capability.label}
    </span>
  );
}

function HomeView({ readiness }: { readiness: ReadinessSnapshot }) {
  const welcomeDismissed = useAppShellStore((state) => state.welcomeDismissed);
  const dismissWelcome = useAppShellStore((state) => state.dismissWelcome);
  const { t } = useI18n();

  return (
    <div className="page-stack">
      {!welcomeDismissed ? <WelcomePanel onDismiss={dismissWelcome} /> : null}

      <div className="dashboard-grid">
        <section className="workbench-panel" aria-labelledby="home-title">
          <div className="workbench-header">
            <div>
              <p className="eyebrow">{t("home.eyebrow")}</p>
              <h1 id="home-title">{t("home.title")}</h1>
              <p className="runtime-path">{readiness.runtime.dataDir}</p>
            </div>
            <StateBadge state="degraded" />
          </div>

          <div className="quick-actions" aria-label="Core actions">
            {readiness.coreActions.slice(0, 3).map((action) => (
              <CoreActionCard key={action.id} action={action} />
            ))}
          </div>

          <div className="desktop-preview-grid">
            <ReplyPreviewPanel />
            <TodayPanel />
          </div>
        </section>

        <section className="setup-panel" aria-labelledby="checklist-title">
          <SectionHeader title={t("home.readiness")} description={t("home.readinessDescription")} />
          <div className="checklist">
            {readiness.checklist.map((item) => (
              <div className="checklist-row" key={item.id}>
                <StatusIcon state={item.state} />
                <div className="row-main">
                  <div className="row-title">
                    <span>{item.title}</span>
                    <StateBadge state={item.state} />
                  </div>
                  <p>{item.impact}</p>
                </div>
                <RepairButton target={item.repairTarget}>{item.actionLabel}</RepairButton>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="section" aria-labelledby="status-title">
        <SectionHeader
          title="System Status"
          description="Current capability states from the readiness service."
        />
        <CapabilityList capabilities={readiness.capabilities} compact />
      </section>
    </div>
  );
}

function WelcomePanel({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useI18n();

  return (
    <section className="welcome-panel" aria-labelledby="welcome-title">
      <div>
        <p className="eyebrow">{t("home.localFirst")}</p>
        <h1 id="welcome-title">{t("home.localFirstTitle")}</h1>
        <div className="trust-grid" role="list">
          <TrustItem icon={Database} text={t("trust.local")} />
          <TrustItem icon={KeyRound} text={t("trust.byok")} />
          <TrustItem icon={MessageSquareText} text={t("trust.suggestion")} />
          <TrustItem icon={ShieldCheck} text={t("trust.account")} />
        </div>
      </div>
      <button className="primary-button" type="button" onClick={onDismiss}>
        {t("home.startSetup")}
      </button>
    </section>
  );
}

function TrustItem({ icon: Icon, text }: { icon: typeof Database; text: string }) {
  return (
    <div className="trust-item" role="listitem">
      <Icon aria-hidden="true" size={17} />
      <span>{text}</span>
    </div>
  );
}

function CoreActionCard({ action }: { action: CoreActionStatus }) {
  const blocked = action.state !== "ready" && action.disabledReason;

  return (
    <article className="action-card">
      <div className="action-card-top">
        <ActionIcon actionId={action.id} />
        <div>
          <h3>{action.label}</h3>
          <p>{action.description}</p>
        </div>
        <StateBadge state={action.state} />
      </div>
      {blocked ? (
        <p className="disabled-reason">
          <CircleAlert aria-hidden="true" size={16} />
          <span>{action.disabledReason}</span>
        </p>
      ) : null}
      <RepairButton target={action.repairTarget}>{action.actionLabel}</RepairButton>
    </article>
  );
}

function ActionIcon({ actionId }: { actionId: CoreActionStatus["id"] }) {
  if (actionId === "reply") {
    return <Sparkles className="action-icon" aria-hidden="true" size={18} />;
  }

  if (actionId === "ask_screen") {
    return <Monitor className="action-icon" aria-hidden="true" size={18} />;
  }

  if (actionId === "enter_capture") {
    return <Command className="action-icon" aria-hidden="true" size={18} />;
  }

  return <CalendarDays className="action-icon" aria-hidden="true" size={18} />;
}

function ReplyPreviewPanel() {
  const { t } = useI18n();

  return (
    <section className="client-panel" aria-labelledby="reply-preview-title">
      <div className="client-panel-header">
        <div>
          <p className="eyebrow">{t("panel.reply")}</p>
          <h2 id="reply-preview-title">{t("panel.suggestions")}</h2>
        </div>
        <button className="icon-button" type="button" aria-label={t("panel.regenerate")} disabled>
          <RefreshCw aria-hidden="true" size={15} />
        </button>
      </div>
      <div className="suggestion-list">
        {["Stable", "Natural", "Short"].map((label) => (
          <div className="suggestion-row" key={label}>
            <div>
              <span>{label}</span>
              <p>{t("panel.configureReply")}</p>
            </div>
            <button className="icon-button" type="button" aria-label={t("panel.copySuggestion", { label })} disabled>
              <Copy aria-hidden="true" size={15} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function TodayPanel() {
  const { t } = useI18n();

  return (
    <section className="client-panel" aria-labelledby="today-title">
      <div className="client-panel-header">
        <div>
          <p className="eyebrow">{t("panel.calendar")}</p>
          <h2 id="today-title">{t("panel.today")}</h2>
        </div>
        <StateBadge state="unknown" />
      </div>
      <div className="timeline-empty">
        <CalendarDays aria-hidden="true" size={18} />
        <div>
          <strong>{t("panel.noLocalItems")}</strong>
          <p>{t("panel.suggestedCalendar")}</p>
        </div>
      </div>
    </section>
  );
}

function RightAgentRail() {
  const { t } = useI18n();

  return (
    <aside className="agent-rail" aria-label="Local Agent">
      <div className="agent-header">
        <div>
          <p className="eyebrow">{t("agent.eyebrow")}</p>
          <h2>{t("agent.title")}</h2>
        </div>
        <Bot aria-hidden="true" size={18} />
      </div>
      <div className="screen-card">
        <div className="screen-thumbnail">
          <Monitor aria-hidden="true" size={24} />
        </div>
        <div>
          <strong>{t("agent.noScreenshot")}</strong>
          <p>{t("agent.startAfterPermission")}</p>
        </div>
      </div>
      <div className="agent-messages" aria-live="polite">
        <div className="agent-message assistant">
          {t("agent.localTools")}
        </div>
      </div>
      <div className="agent-input">
        <label className="sr-only" htmlFor="agent-query">
          {t("agent.queryLabel")}
        </label>
        <input id="agent-query" value={t("agent.queryValue")} readOnly />
        <button className="icon-button" type="button" aria-label={t("agent.send")} disabled>
          <Send aria-hidden="true" size={15} />
        </button>
      </div>
    </aside>
  );
}

function BubblePreview({ readiness }: { readiness: ReadinessSnapshot }) {
  const reply = readiness.coreActions.find((action) => action.id === "reply");
  const ask = readiness.coreActions.find((action) => action.id === "ask_screen");
  const { t } = useI18n();

  return (
    <aside className="bubble-preview" aria-label={t("bubble.label")}>
      <button className="bubble-trigger" type="button" aria-label={t("bubble.trigger")}>
        %
      </button>
      <div className="bubble-menu">
        {reply ? <BubbleAction action={reply} icon={Sparkles} /> : null}
        {ask ? <BubbleAction action={ask} icon={Monitor} /> : null}
        <button className="bubble-action" type="button">
          <Settings aria-hidden="true" size={15} />
          {t("bubble.open")}
        </button>
      </div>
    </aside>
  );
}

function BubbleAction({
  action,
  icon: Icon,
}: {
  action: CoreActionStatus;
  icon: typeof Sparkles;
}) {
  return (
    <button className="bubble-action" type="button" disabled={action.state !== "ready"} title={action.disabledReason ?? undefined}>
      <Icon aria-hidden="true" size={15} />
      {action.label}
    </button>
  );
}

function SettingsView({ readiness }: { readiness: ReadinessSnapshot }) {
  const section = useAppShellStore((state) => state.settingsSection);
  const setSettingsSection = useAppShellStore((state) => state.setSettingsSection);
  const { t } = useI18n();

  return (
    <div className="settings-layout">
      <aside className="settings-nav" aria-label="Settings sections">
        <p className="eyebrow">{t("nav.settings")}</p>
        {settingsItems.map((item) => (
          <button
            key={item.id}
            className="settings-nav-button"
            data-active={section === item.id}
            type="button"
            onClick={() => setSettingsSection(item.id)}
          >
            <span>{t(item.labelKey)}</span>
            <ChevronRight aria-hidden="true" size={15} />
          </button>
        ))}
      </aside>
      <section className="settings-panel" aria-labelledby="settings-heading">
        {section === "intelligence" ? <IntelligenceSettings readiness={readiness} /> : null}
        {section === "permissions" ? <PermissionSettings readiness={readiness} /> : null}
        {section === "account" ? (
          <StaticSettings title={t("settings.account")} description="Sign-in will support membership, device authorization, purchases, and future update channels. Local BYOK use does not require it." />
        ) : null}
        {section === "app" ? (
          <AppSettings />
        ) : null}
        {section === "shortcuts-data" ? (
          <StaticSettings title={t("settings.shortcutsData")} description="Shortcut bindings, clear screenshot cache, export database, and clear local database controls will live here." />
        ) : null}
      </section>
    </div>
  );
}

function IntelligenceSettings({ readiness }: { readiness: ReadinessSnapshot }) {
  const providerCapabilities = readiness.capabilities.filter((capability) =>
    capability.key.startsWith("provider_"),
  );
  const { t } = useI18n();
  const [profiles, setProfiles] = useState<ProviderProfile[]>([]);
  const [keyAvailability, setKeyAvailability] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState<ProviderProfileForm>(() => defaultProviderForm());
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<"text" | "image" | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const selectedPreset = getProviderPreset(form.providerPresetId);

  useEffect(() => {
    let mounted = true;

    loadProviderProfiles()
      .then((snapshot) => {
        if (!mounted) {
          return;
        }
        setProfiles(snapshot.profiles);
        setKeyAvailability(
          Object.fromEntries(
            snapshot.keyAvailability.map((item) => [item.profileId, item.hasApiKey]),
          ),
        );
        if (snapshot.defaultProfile) {
          setForm(formFromProfile(snapshot.defaultProfile));
        }
      })
      .catch((error) => {
        if (mounted) {
          setErrorMessage(formatError(error));
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  async function refreshProfiles(nextProfileId?: string) {
    const snapshot = await loadProviderProfiles();
    setProfiles(snapshot.profiles);
    setKeyAvailability(
      Object.fromEntries(snapshot.keyAvailability.map((item) => [item.profileId, item.hasApiKey])),
    );
    const nextProfile =
      snapshot.profiles.find((profile) => profile.id === nextProfileId) ??
      snapshot.defaultProfile ??
      snapshot.profiles[0];
    if (nextProfile) {
      setForm(formFromProfile(nextProfile));
    }
  }

  async function handleSave() {
    setSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const saved = await saveProviderProfileForm(form);
      await refreshProfiles(saved.id);
      setStatusMessage(t("settings.providerSaved"));
    } catch (error) {
      setErrorMessage(formatError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleTest(testKind: "text" | "image") {
    if (!form.id) {
      setErrorMessage(t("settings.saveBeforeTest"));
      return;
    }

    setTesting(testKind);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const result = await runProviderCapabilityTest(form.id, testKind);
      await refreshProfiles(form.id);
      if (result.status === "succeeded") {
        setStatusMessage(testKind === "text" ? t("settings.textTestPassed") : t("settings.imageTestPassed"));
      } else {
        setErrorMessage(result.normalizedErrorMessage ?? t("settings.testFailed"));
      }
    } catch (error) {
      setErrorMessage(formatError(error));
    } finally {
      setTesting(null);
    }
  }

  function updatePreset(providerPresetId: ProviderPresetId) {
    const preset = getProviderPreset(providerPresetId);
    setForm({
      id: undefined,
      displayName: preset.displayName,
      providerPresetId,
      baseUrl: preset.defaultBaseUrl ?? "",
      modelId: preset.defaultModelId,
      apiKey: "",
      isDefault: profiles.length === 0,
    });
  }

  return (
    <div className="page-stack">
      <header className="panel-header">
        <p className="eyebrow">{t("nav.settings")}</p>
        <h1 id="settings-heading">{t("settings.intelligence")}</h1>
        <p>{t("settings.intelligenceDescription")}</p>
      </header>
      <div className="form-shell">
        <div className="settings-card-header">
          <div>
            <p className="eyebrow">BYOK</p>
            <h2>{t("settings.providerProfile")}</h2>
          </div>
          <StateBadge state={profiles.length > 0 ? "degraded" : "not_configured"} />
        </div>
        <div className="field-row">
          <label htmlFor="provider-preset">{t("settings.providerPreset")}</label>
          <select
            id="provider-preset"
            value={form.providerPresetId}
            onChange={(event) => updatePreset(event.target.value as ProviderPresetId)}
          >
            {providerPresets.map((preset) => (
              <option key={preset.id} value={preset.id}>
                {preset.displayName}
              </option>
            ))}
          </select>
        </div>
        <div className="field-row">
          <label htmlFor="provider-display-name">{t("settings.displayName")}</label>
          <input
            id="provider-display-name"
            value={form.displayName}
            onChange={(event) => setForm({ ...form, displayName: event.target.value })}
          />
        </div>
        <div className="field-grid">
          <div className="field-row">
            <label htmlFor="provider-base-url">{t("settings.baseUrl")}</label>
            <input
              id="provider-base-url"
              value={form.baseUrl}
              placeholder={selectedPreset.defaultBaseUrl ?? "https://provider.example/v1"}
              readOnly={!selectedPreset.requiresBaseUrl && form.providerPresetId !== "custom_openai"}
              onChange={(event) => setForm({ ...form, baseUrl: event.target.value })}
            />
          </div>
          <div className="field-row">
            <label htmlFor="model-display">{t("settings.model")}</label>
            <input
              id="model-display"
              value={form.modelId}
              placeholder={selectedPreset.modelIdPlaceholder}
              onChange={(event) => setForm({ ...form, modelId: event.target.value })}
            />
          </div>
        </div>
        <div className="field-row">
          <label htmlFor="provider-api-key">{t("settings.apiKey")}</label>
          <input
            id="provider-api-key"
            type="password"
            value={form.apiKey}
            placeholder={form.id && keyAvailability[form.id] ? t("settings.apiKeySaved") : t("settings.apiKeyPlaceholder")}
            autoComplete="off"
            onChange={(event) => setForm({ ...form, apiKey: event.target.value })}
          />
        </div>
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(event) => setForm({ ...form, isDefault: event.target.checked })}
          />
          <span>{t("settings.makeDefaultProvider")}</span>
        </label>
        {statusMessage ? <p className="status-message success">{statusMessage}</p> : null}
        {errorMessage ? <p className="status-message error">{errorMessage}</p> : null}
        <div className="button-row">
          <button className="primary-button" type="button" disabled={saving} onClick={handleSave}>
            {saving ? t("common.saving") : t("settings.saveProvider")}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={!form.id || testing !== null}
            onClick={() => void handleTest("text")}
          >
            {testing === "text" ? t("common.testing") : t("settings.testText")}
          </button>
          <button
            className="secondary-button"
            type="button"
            disabled={!form.id || testing !== null}
            onClick={() => void handleTest("image")}
          >
            {testing === "image" ? t("common.testing") : t("settings.testImage")}
          </button>
          <button className="secondary-button" type="button" disabled title={t("settings.streamingDeferred")}>
            {t("settings.testStreaming")}
          </button>
        </div>
      </div>

      <div className="form-shell">
        <div className="settings-card-header">
          <div>
            <p className="eyebrow">{t("settings.savedProfiles")}</p>
            <h2>{profiles.length ? `${profiles.length} ${t("settings.profiles")}` : t("settings.noProvider")}</h2>
          </div>
        </div>
        <div className="profile-list">
          {profiles.length === 0 ? (
            <div className="empty-state compact">
              <CircleHelp aria-hidden="true" size={18} />
              <div>
                <strong>{t("settings.noProvider")}</strong>
                <p>{t("settings.addProviderFirst")}</p>
              </div>
            </div>
          ) : null}
          {profiles.map((profile) => (
            <button
              className="profile-row"
              data-active={form.id === profile.id}
              key={profile.id}
              type="button"
              onClick={() => setForm(formFromProfile(profile))}
            >
              <div>
                <strong>{profile.displayName}</strong>
                <span>
                  {profile.modelId} · {keyAvailability[profile.id] ? t("settings.keychainReady") : t("settings.keyMissing")}
                </span>
              </div>
              <div className="profile-badges">
                {profile.isDefault ? <StateBadge state="ready" /> : null}
                <span className="test-pill" data-ready={profile.supportsText}>
                  Text
                </span>
                <span className="test-pill" data-ready={profile.supportsImage}>
                  Image
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>
      <CapabilityList capabilities={providerCapabilities} />
    </div>
  );
}

function defaultProviderForm(): ProviderProfileForm {
  const preset = providerPresets[0];
  return {
    displayName: preset.displayName,
    providerPresetId: preset.id,
    baseUrl: preset.defaultBaseUrl ?? "",
    modelId: preset.defaultModelId,
    apiKey: "",
    isDefault: true,
  };
}

function formFromProfile(profile: ProviderProfile): ProviderProfileForm {
  return {
    id: profile.id,
    displayName: profile.displayName,
    providerPresetId: profile.providerPresetId,
    baseUrl: profile.baseUrl ?? "",
    modelId: profile.modelId,
    apiKey: "",
    isDefault: profile.isDefault,
  };
}

function formatError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function PermissionSettings({ readiness }: { readiness: ReadinessSnapshot }) {
  const permissionCapabilities = readiness.capabilities.filter((capability) =>
    ["screen_recording", "accessibility", "input_monitoring", "apple_calendar"].includes(capability.key),
  );
  const { t } = useI18n();

  return (
    <div className="page-stack">
      <header className="panel-header">
        <p className="eyebrow">{t("nav.settings")}</p>
        <h1 id="settings-heading">{t("settings.permissions")}</h1>
        <p>{t("settings.permissionsDescription")}</p>
      </header>
      <CapabilityList capabilities={permissionCapabilities} nativePermissionActions />
    </div>
  );
}

function AppSettings() {
  const theme = useAppShellStore((state) => state.theme);
  const locale = useAppShellStore((state) => state.locale);
  const setTheme = useAppShellStore((state) => state.setTheme);
  const setLocale = useAppShellStore((state) => state.setLocale);
  const { t } = useI18n();

  return (
    <div className="page-stack">
      <header className="panel-header">
        <p className="eyebrow">{t("nav.settings")}</p>
        <h1 id="settings-heading">{t("settings.app")}</h1>
        <p>Enter Capture, screenshots, Reply, Ask Screen, Calendar recognition, and updater controls will live here.</p>
      </header>

      <section className="form-shell" aria-labelledby="appearance-heading">
        <div className="settings-card-header">
          <div>
            <p className="eyebrow">{t("settings.appearance")}</p>
            <h2 id="appearance-heading">{t("settings.theme")}</h2>
          </div>
        </div>
        <div className="segmented-control" role="group" aria-label={t("settings.theme")}>
          {[
            ["system", "settings.themeSystem"],
            ["light", "settings.themeLight"],
            ["dark", "settings.themeDark"],
          ].map(([value, labelKey]) => (
            <button
              key={value}
              className="segmented-button"
              data-active={theme === value}
              type="button"
              onClick={() => setTheme(value as typeof theme)}
            >
              {t(labelKey as MessageKey)}
            </button>
          ))}
        </div>
      </section>

      <section className="form-shell" aria-labelledby="language-heading">
        <div className="settings-card-header">
          <div>
            <p className="eyebrow">{t("settings.language")}</p>
            <h2 id="language-heading">{t("settings.language")}</h2>
          </div>
        </div>
        <div className="segmented-control" role="group" aria-label={t("settings.language")}>
          {[
            ["en", "settings.languageEnglish"],
            ["zh", "settings.languageChinese"],
          ].map(([value, labelKey]) => (
            <button
              key={value}
              className="segmented-button"
              data-active={locale === value}
              type="button"
              onClick={() => setLocale(value as typeof locale)}
            >
              {t(labelKey as MessageKey)}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function StaticSettings({ title, description }: { title: string; description: string }) {
  const { t } = useI18n();

  return (
    <div className="page-stack">
      <header className="panel-header">
        <p className="eyebrow">{t("nav.settings")}</p>
        <h1 id="settings-heading">{title}</h1>
        <p>{description}</p>
      </header>
      <div className="empty-state">
        <CircleHelp aria-hidden="true" size={20} />
        <div>
          <strong>{t("settings.notImplemented")}</strong>
          <p>{t("settings.reserved")}</p>
        </div>
      </div>
    </div>
  );
}

function PlaceholderView({ kind }: { kind: "contacts" | "calendar" }) {
  const { t } = useI18n();
  const content =
    kind === "contacts"
      ? {
          title: t("contacts.emptyTitle"),
          description: t("contacts.emptyDescription"),
        }
      : {
          title: t("calendar.emptyTitle"),
          description: t("calendar.emptyDescription"),
        };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <p className="eyebrow">{kind === "contacts" ? t("nav.contacts") : t("nav.calendar")}</p>
          <h1>{kind === "contacts" ? t("nav.contacts") : t("nav.calendar")}</h1>
          <p className="page-description">{content.description}</p>
        </div>
      </header>
      <div className="empty-state">
        <CircleHelp aria-hidden="true" size={20} />
        <div>
          <strong>{content.title}</strong>
          <p>{content.description}</p>
        </div>
      </div>
    </div>
  );
}

function CapabilityList({
  capabilities,
  compact = false,
  nativePermissionActions = false,
}: {
  capabilities: CapabilityStatus[];
  compact?: boolean;
  nativePermissionActions?: boolean;
}) {
  return (
    <div className={compact ? "capability-list compact" : "capability-list"}>
      {capabilities.map((capability) => (
        <CapabilityRow
          capability={capability}
          key={capability.key}
          nativePermissionActions={nativePermissionActions}
        />
      ))}
    </div>
  );
}

function CapabilityRow({
  capability,
  nativePermissionActions,
}: {
  capability: CapabilityStatus;
  nativePermissionActions: boolean;
}) {
  const nativePermissionKey = isNativePermissionKey(capability.key) ? capability.key : null;
  const { t } = useI18n();

  return (
    <article className="capability-row">
      <div className="capability-title">
        <StatusIcon state={capability.state} />
        <div>
          <h3>{capability.label}</h3>
          <p>{capability.impact}</p>
        </div>
      </div>
      <div className="capability-side">
        <StateBadge state={capability.state} />
        <span className="next-step">{capability.nextStep}</span>
        {nativePermissionActions && nativePermissionKey ? (
          <button
            className="secondary-button"
            type="button"
            onClick={() => {
              void openNativePermissionSettings(nativePermissionKey);
            }}
          >
            {t("settings.openSystemSettings")}
          </button>
        ) : capability.repairTarget !== "none" ? (
          <RepairButton target={capability.repairTarget}>{t("common.open")}</RepairButton>
        ) : null}
      </div>
    </article>
  );
}

function isNativePermissionKey(
  key: CapabilityStatus["key"],
): key is "screen_recording" | "accessibility" | "input_monitoring" | "apple_calendar" {
  return ["screen_recording", "accessibility", "input_monitoring", "apple_calendar"].includes(key);
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="section-header">
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
  );
}

function RepairButton({ target, children }: { target: RepairTarget; children: string }) {
  const setRoute = useAppShellStore((state) => state.setRoute);
  const setSettingsSection = useAppShellStore((state) => state.setSettingsSection);

  function handleClick() {
    if (target === "settings:intelligence") {
      setSettingsSection("intelligence");
      return;
    }
    if (target === "settings:permissions" || target === "system-settings") {
      setSettingsSection("permissions");
      return;
    }
    if (target === "settings:account") {
      setSettingsSection("account");
      return;
    }
    if (target === "settings:app") {
      setSettingsSection("app");
      return;
    }
    if (target === "settings:shortcuts-data") {
      setSettingsSection("shortcuts-data");
      return;
    }
    setRoute("home");
  }

  return (
    <button className="secondary-button" type="button" onClick={handleClick}>
      {children}
    </button>
  );
}

function StatusIcon({ state }: { state: CapabilityState }) {
  if (state === "ready") {
    return <CheckCircle2 className="status-icon ready" aria-hidden="true" size={18} />;
  }

  if (state === "blocked" || state === "not_configured") {
    return <CircleAlert className="status-icon blocked" aria-hidden="true" size={18} />;
  }

  return <CircleHelp className="status-icon unknown" aria-hidden="true" size={18} />;
}

function StatusDot({ state }: { state: CapabilityState }) {
  return <span className="status-dot" data-state={state} aria-hidden="true" />;
}

function StateBadge({ state }: { state: CapabilityState }) {
  return (
    <span className="state-badge" data-state={state}>
      {stateLabel[state]}
    </span>
  );
}

function LoadingShell() {
  const { t } = useI18n();

  return (
    <div className="center-shell" aria-live="polite">
      <div className="loading-card">
        <Database aria-hidden="true" size={22} />
        <span>{t("common.loadingReadiness")}</span>
      </div>
    </div>
  );
}

function AppError({ message }: { message: string }) {
  return (
    <div className="center-shell" role="alert">
      <div className="loading-card error-card">
        <CircleAlert aria-hidden="true" size={22} />
        <span>{message}</span>
      </div>
    </div>
  );
}
