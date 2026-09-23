import { NavLink } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bot,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { ROUTES } from "@/lib/constants";
import { LogoLockup } from "./Logo";
import { useAppState } from "@/contexts/AppStateContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: "Dashboard", icon: LayoutDashboard },
  { to: ROUTES.liveSafety, label: "Live Safety", icon: ShieldAlert },
  { to: ROUTES.tasks, label: "Tasks", icon: ClipboardList },
  { to: ROUTES.analytics, label: "Analytics", icon: BarChart3 },
  { to: ROUTES.incidents, label: "Incidents", icon: Activity },
  { to: ROUTES.training, label: "Training", icon: GraduationCap },
  { to: ROUTES.machineHealth, label: "Machine Health", icon: Wrench },
  { to: ROUTES.chat, label: "Copilot", icon: Bot },
  { to: ROUTES.settings, label: "Settings", icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppState();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-black/5 bg-surface-raised transition-[width] duration-200 md:flex",
        sidebarCollapsed ? "w-[72px]" : "w-60",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-black/5 px-4">
        <LogoLockup collapsed={sidebarCollapsed} />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-brand-charcoal text-white"
                  : "text-ink-muted hover:bg-surface-sunken hover:text-ink",
              )
            }
          >
            <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden="true" />
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-black/5 p-2">
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-sunken hover:text-ink"
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="h-4.5 w-4.5" aria-hidden="true" />
          ) : (
            <PanelLeftClose className="h-4.5 w-4.5" aria-hidden="true" />
          )}
          {!sidebarCollapsed && "Collapse"}
        </button>
      </div>
    </aside>
  );
}
