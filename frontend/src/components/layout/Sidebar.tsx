import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { ROUTES, NAV_ICONS } from "@/lib/constants";
import { LogoLockup } from "./Logo";
import { useAppState } from "@/contexts/AppStateContext";
import { cn } from "@/lib/utils";
import { FeatureIconBadge } from "@/components/ui/FeatureIconBadge";

const NAV_ITEMS = [
  { to: ROUTES.dashboard, label: "Dashboard", icon: NAV_ICONS.dashboard },
  { to: ROUTES.liveSafety, label: "Live Safety", icon: NAV_ICONS.liveSafety },
  { to: ROUTES.tasks, label: "Tasks", icon: NAV_ICONS.tasks },
  { to: ROUTES.analytics, label: "Analytics", icon: NAV_ICONS.analytics },
  { to: ROUTES.incidents, label: "Incidents", icon: NAV_ICONS.incidents },
  { to: ROUTES.training, label: "Training", icon: NAV_ICONS.training },
  { to: ROUTES.machineHealth, label: "Machine Health", icon: NAV_ICONS.machineHealth },
  { to: ROUTES.chat, label: "Copilot", icon: NAV_ICONS.chat },
  { to: ROUTES.settings, label: "Settings", icon: NAV_ICONS.settings },
];

export function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed } = useAppState();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-cat-gray-border bg-cat-white transition-[width] duration-200 md:flex",
        sidebarCollapsed ? "w-[76px]" : "w-64",
      )}
    >
      <div className="flex h-16 items-center border-b border-cat-gray-border px-4">
        <LogoLockup collapsed={sidebarCollapsed} />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Primary">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "cat-focus-ring group flex items-center gap-3 rounded-lg border-l-4 px-2.5 py-2 text-sm font-semibold transition-colors",
                isActive
                  ? "border-cat-yellow bg-cat-gray-light text-cat-black"
                  : "border-transparent text-cat-gray-mid hover:bg-cat-gray-light hover:text-cat-black",
              )
            }
          >
            <FeatureIconBadge icon={item.icon} size="sm" />
            {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-cat-gray-border p-3">
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="cat-focus-ring flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-cat-gray-mid hover:bg-cat-gray-light hover:text-cat-black"
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
