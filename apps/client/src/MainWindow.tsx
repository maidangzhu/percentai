import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { AppShell, type MenuKey } from "@/components/AppShell";
import { HomeView } from "@/views/HomeView";
import { LogsView } from "@/views/LogsView";
import { PeopleView } from "@/views/PeopleView";
import { TasksView } from "@/views/TasksView";
import { SettingsView } from "@/views/SettingsView";
import { PermissionsView, PermissionsOnboarding } from "@/views/PermissionsView";
import { LocalTestView } from "@/views/LocalTestView";
import { AuthView } from "@/views/AuthView";
import { WelcomeView } from "@/views/WelcomeView";
import { LoadingView } from "@/views/LoadingView";
import { AUTH_BASE } from "@/lib/types";
import {
  useLogs,
  usePeople,
  useTasks,
  useCredits,
  useStats,
  useLogSearch,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useDeletePerson,
  useInvalidateAll,
} from "@/lib/queries";
import type {
  AuthUser,
  PermissionStatus,
  ShortcutConfig,
} from "@/lib/types";

export default function MainWindow() {
  const [activeKey, setActiveKey] = useState<MenuKey>("home");
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [screenshotEnabled, setScreenshotEnabled] = useState(false);
  const [shortcutConfig, setShortcutConfig] = useState<ShortcutConfig>({
    key: "Enter",
    modifiers: [],
  });
  const [permissions, setPermissions] = useState<PermissionStatus[]>([]);

  // TanStack Query hooks
  const logsQuery = useLogs();
  const peopleQuery = usePeople();
  const tasksQuery = useTasks();
  const creditsQuery = useCredits(authUser?.id);
  const statsQuery = useStats();
  const invalidateAll = useInvalidateAll();
  const triggerLogSearch = useLogSearch();

  const createTaskMut = useCreateTask();
  const updateTaskMut = useUpdateTask();
  const deleteTaskMut = useDeleteTask();
  const deletePersonMut = useDeletePerson();

  // Onboarding
  const [hasWelcomed, setHasWelcomed] = useState(false);
  const [welcomedChecked, setWelcomedChecked] = useState(false);
  const [onboardingPermissionsDone, setOnboardingPermissionsDone] = useState(false);
  const [onboardingPermissions, setOnboardingPermissions] = useState<PermissionStatus[]>([]);
  const [onboardingPermissionsLoading, setOnboardingPermissionsLoading] = useState(false);

  const missingRequiredPermissions = permissions.some((p) => p.required && !p.granted);

  const loadPermissions = async (redirectIfMissing = false) => {
    try {
      const next = await invoke<PermissionStatus[]>("get_required_permissions");
      setPermissions(next);
      if (redirectIfMissing && next.some((p) => p.required && !p.granted)) {
        setActiveKey("permissions");
      }
    } catch (e) {
      console.error("[main] get permissions error:", e);
    }
  };

  useEffect(() => {
    const welcomed = localStorage.getItem("percent.welcomed") === "true";
    setHasWelcomed(welcomed);
    setWelcomedChecked(true);
  }, []);

  const loadOnboardingPermissions = async () => {
    setOnboardingPermissionsLoading(true);
    try {
      const next = await invoke<PermissionStatus[]>("get_required_permissions");
      setOnboardingPermissions(next);
      if (next.length > 0 && next.every((p) => !p.required || p.granted)) {
        setOnboardingPermissionsDone(true);
      }
    } catch (e) {
      console.error("[main] onboarding get permissions error:", e);
    } finally {
      setOnboardingPermissionsLoading(false);
    }
  };

  useEffect(() => {
    if (!welcomedChecked || !hasWelcomed) return;
    void loadOnboardingPermissions();
  }, [welcomedChecked, hasWelcomed]);

  useEffect(() => {
    let cancelled = false;
    fetch(`${AUTH_BASE}/get-session`, { credentials: "include" })
      .then(async (resp) => {
        if (!resp.ok) {
          const body = await resp.json().catch(() => null);
          throw new Error(body?.message ?? "Session check failed");
        }
        return (await resp.json()) as { user?: AuthUser } | null;
      })
      .then((session) => {
        if (!cancelled) setAuthUser(session?.user ?? null);
      })
      .catch((e) => {
        console.error("[auth] session check failed:", e);
        if (!cancelled) {
          setAuthError(e instanceof Error ? e.message : "Session check failed");
          setAuthUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setAuthLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // 事件监听：外部事件触发时 invalidate 相关 query
  useEffect(() => {
    if (!authUser) return;

    void loadPermissions(true);
    invoke<boolean>("get_screenshot_enabled").then(setScreenshotEnabled);
    invoke<ShortcutConfig>("get_shortcut_config").then(setShortcutConfig);

    const unlistenEnter = listen("enter-pressed", () => {
      setTimeout(() => invalidateAll(), 1000);
    });
    const unlistenAI = listen("ai-result-updated", () => {
      invalidateAll();
    });
    const unlistenTasks = listen("tasks-updated", () => {
      invalidateAll();
    });
    return () => {
      unlistenEnter.then((f) => f());
      unlistenAI.then((f) => f());
      unlistenTasks.then((f) => f());
    };
  }, [authUser?.id]);

  useEffect(() => {
    if (activeKey === "permissions" && permissions.length > 0 && !missingRequiredPermissions) {
      setActiveKey("home");
    }
  }, [activeKey, permissions.length, missingRequiredPermissions]);

  const toggleScreenshot = async () => {
    const next = !screenshotEnabled;
    await invoke("set_screenshot_enabled", { enabled: next });
    setScreenshotEnabled(next);
  };

  const handleSignOut = async () => {
    try {
      await fetch(`${AUTH_BASE}/sign-out`, { method: "POST", credentials: "include" });
    } catch (e) {
      console.error("[auth] sign out failed:", e);
    } finally {
      setAuthUser(null);
      setActiveKey("home");
    }
  };

  const handleDeletePerson = async (id: string): Promise<boolean> => {
    try {
      await deletePersonMut.mutateAsync(id);
      return true;
    } catch {
      return false;
    }
  };

  // Render gates
  if (!welcomedChecked) {
    return <LoadingView message="Preparing…" />;
  }
  if (!hasWelcomed) {
    return <WelcomeView onContinue={() => {
      localStorage.setItem("percent.welcomed", "true");
      setHasWelcomed(true);
    }} />;
  }
  if (!onboardingPermissionsDone) {
    return (
      <PermissionsOnboarding
        permissions={onboardingPermissions}
        loading={onboardingPermissionsLoading}
        onRefresh={() => void loadOnboardingPermissions()}
        onContinue={() => setOnboardingPermissionsDone(true)}
      />
    );
  }
  if (authLoading) {
    return <LoadingView message="Checking session…" />;
  }
  if (!authUser) {
    return (
      <AuthView
        initialError={authError}
        onAuthenticated={(user) => {
          setAuthUser(user);
          setAuthError("");
        }}
      />
    );
  }

  return (
    <AppShell
      activeKey={activeKey}
      onSelect={setActiveKey}
      authUser={authUser}
      credits={creditsQuery.data?.balance ?? null}
      showPermissions={missingRequiredPermissions}
      onSignOut={handleSignOut}
    >
      {activeKey === "home" && (
        <HomeView
          user={authUser}
          stats={statsQuery.data ?? null}
          loading={statsQuery.isLoading}
        />
      )}
      {activeKey === "logs" && (
        <LogsView logs={logsQuery.data ?? []} onSearch={triggerLogSearch} />
      )}
      {activeKey === "permissions" && (
        <PermissionsView
          permissions={permissions}
          onRefresh={() => void loadPermissions(false)}
          onContinue={() => setActiveKey("home")}
          continueLabel="Continue"
        />
      )}
      {activeKey === "people" && (
        <PeopleView
          people={peopleQuery.data ?? []}
          onDeletePerson={handleDeletePerson}
        />
      )}
      {activeKey === "tasks" && (
        <TasksView
          tasks={tasksQuery.data ?? []}
          onCreateTask={async (input) => {
            try {
              const result = await createTaskMut.mutateAsync(input);
              return result;
            } catch {
              return null;
            }
          }}
          onUpdateTask={async (id, body) => {
            try {
              await updateTaskMut.mutateAsync({ id, ...body });
            } catch {
              // error handled by query client
            }
          }}
          onDeleteTask={async (id) => {
            try {
              await deleteTaskMut.mutateAsync(id);
            } catch {
              // error handled by query client
            }
          }}
          onRefresh={() => invalidateAll()}
        />
      )}
      {activeKey === "settings" && (
        <SettingsView
          screenshotEnabled={screenshotEnabled}
          onToggleScreenshot={toggleScreenshot}
          shortcutConfig={shortcutConfig}
          onShortcutSaved={setShortcutConfig}
          permissions={permissions}
          onRefreshPermissions={() => void loadPermissions(false)}
          authUser={authUser}
          onSignOut={handleSignOut}
          onCacheCleared={() => invalidateAll()}
        />
      )}
      {activeKey === "local_test" && <LocalTestView />}
    </AppShell>
  );
}
