import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { AppShell, type MenuKey } from "@/components/AppShell";
import { HomeView } from "@/views/HomeView";
import { LogsView } from "@/views/LogsView";
import { PeopleView } from "@/views/PeopleView";
import { TasksView } from "@/views/TasksView";
import { SettingsView } from "@/views/SettingsView";
import { PermissionsView } from "@/views/PermissionsView";
import { LocalTestView } from "@/views/LocalTestView";
import { WelcomeView } from "@/views/WelcomeView";
import {
  useLogs,
  usePeople,
  useTasks,
  useStats,
  useLogSearch,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useDeletePerson,
  useInvalidateAll,
} from "@/lib/queries";
import type { PermissionStatus, ShortcutConfig } from "@/lib/types";

export default function MainWindow() {
  const [activeKey, setActiveKey] = useState<MenuKey>("home");
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
  const statsQuery = useStats();
  const invalidateAll = useInvalidateAll();
  const triggerLogSearch = useLogSearch();

  const createTaskMut = useCreateTask();
  const updateTaskMut = useUpdateTask();
  const deleteTaskMut = useDeleteTask();
  const deletePersonMut = useDeletePerson();

  // Onboarding
  // `hasWelcomed` is computed synchronously at component init from
  // localStorage. We deliberately do NOT have a "Preparing…" loading
  // state: the very first render already picks the right gate.
  //
  // Permission + BYOK setup is NO LONGER a startup gate. Both are
  // reachable from the side nav (权限 page / SettingsView BYOK banner).
  // We still check permission status in the background so the side nav
  // can highlight 权限 when something's missing, but we never block the
  // user from reaching the home view.
  const [hasWelcomed] = useState<boolean>(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem("percent.welcomed") === "true";
  });
  // Tracks permission state. Loaded in the background by `loadPermissions`
  // below; the side nav uses it to highlight 权限 when something's
  // missing, but the user can use the app before this resolves.
  // (No "onboarding step" — permission and BYOK setup live in the
  // side nav, not as startup gates.)

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
    // (placeholder — `hasWelcomed` is now computed synchronously at init
    // time. Permission state for the side-nav highlight is loaded by
    // the existing `loadPermissions` call below.)
  }, []);

  // We still load permissions in the background so the side nav can
  // highlight 权限 when something's missing — but never block on it.

  useEffect(() => {
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
  }, []);

  // (Removed: this effect used to auto-redirect from 权限 back to home
// once `permissions` finished loading and everything was granted. That
// made the page un-viewable: clicking 权限 would just bounce back to
// home. 权限 is an informational page now, reachable on demand.)

const toggleScreenshot = async () => {
    const next = !screenshotEnabled;
    await invoke("set_screenshot_enabled", { enabled: next });
    setScreenshotEnabled(next);
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
  if (!hasWelcomed) {
    return <WelcomeView onContinue={() => {
      localStorage.setItem("percent.welcomed", "true");
      // Re-render to advance to the next gate. We can't set state in
      // this closure (no setter), so we force a reload — cheap and
      // runs only on first launch.
      window.location.reload();
    }} />;
  }

  return (
    <AppShell
      activeKey={activeKey}
      onSelect={setActiveKey}
    >
      {activeKey === "home" && (
        <HomeView
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
          onRefresh={() => void peopleQuery.refetch()}
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
          onCacheCleared={() => invalidateAll()}
        />
      )}
      {activeKey === "local_test" && <LocalTestView />}
    </AppShell>
  );
}
