import { ScrollText, Users, ListTodo, Settings, ShieldAlert, Home as HomeIcon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type MenuKey = "home" | "permissions" | "logs" | "people" | "tasks" | "settings";

interface MenuItem {
  key: MenuKey;
  label: string;
  icon: LucideIcon;
  highlight?: boolean;
  section?: "workspace" | "dev";
}

const BASE_MENU: MenuItem[] = [
  { key: "home", label: "首页", icon: HomeIcon, section: "workspace" },
  { key: "logs", label: "截屏日志", icon: ScrollText, section: "workspace" },
  { key: "people", label: "联系人", icon: Users, section: "workspace" },
  { key: "tasks", label: "任务", icon: ListTodo, section: "workspace" },
  { key: "permissions", label: "权限", icon: ShieldAlert, section: "workspace" },
  { key: "settings", label: "设置", icon: Settings, section: "workspace" },
];

interface AppShellProps {
  activeKey: MenuKey;
  onSelect: (key: MenuKey) => void;
  children: React.ReactNode;
}

export function AppShell({
  activeKey,
  onSelect,
  children,
}: AppShellProps) {
  const items = BASE_MENU;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      <aside className="relative flex w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
        {/* brand */}
        <div className="flex items-center gap-2.5 px-5 py-5">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-foreground text-background text-[13px] font-semibold leading-none">
            %
          </div>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="text-display text-[13.5px] font-semibold tracking-[-0.01em] text-foreground">
              Percent
            </span>
            <span className="text-mono-caps text-[9.5px] text-muted-foreground">
              Local · v0.1
            </span>
          </div>
        </div>

        {/* nav */}
        <nav className="mt-1.5 flex-1 overflow-y-auto px-2.5">
          {(["workspace", "dev"] as const).map((section) => {
            const sectionItems = items.filter((i) => (i.section ?? "workspace") === section);
            if (sectionItems.length === 0) return null;
            return (
              <div key={section}>
                <div className="px-2 pb-1.5 pt-1 text-mono-caps text-[9.5px] text-muted-foreground/70">
                  {section === "workspace" ? "工作区" : "开发"}
                </div>
                <ul className="flex flex-col gap-px">
                  {sectionItems.map((item) => {
                    const Icon = item.icon;
                    const active = activeKey === item.key;
                    return (
                      <li key={item.key} className="relative">
                        <span
                          className={cn(
                            "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-r-full transition-all duration-[var(--duration-base)]",
                            active ? "bg-foreground opacity-100" : "opacity-0"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => onSelect(item.key)}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "group relative flex h-7 w-full items-center gap-2.5 rounded-md pl-3 pr-2 text-[13px] transition-colors duration-[var(--duration-fast)]",
                            active
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-[14px] w-[14px] shrink-0 transition-colors",
                              active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground",
                              item.highlight && !active && "text-foreground"
                            )}
                            strokeWidth={1.75}
                          />
                          <span className="flex-1 truncate text-left">{item.label}</span>
                          {item.highlight && !active && (
                            <span className="live-dot" aria-label="Requires attention" />
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>

      <main className="flex flex-1 flex-col overflow-hidden bg-background">{children}</main>
    </div>
  );
}
