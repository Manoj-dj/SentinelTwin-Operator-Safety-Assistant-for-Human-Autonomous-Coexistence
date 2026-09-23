import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { LogoLockup } from "./Logo";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  Activity,
  BarChart3,
  Bot,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  Wrench,
} from "lucide-react";

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

export function MobileNavButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="rounded-full p-2 text-ink-muted hover:bg-surface-sunken md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Navigation" widthClass="max-w-xs">
        <div className="mb-4">
          <LogoLockup />
        </div>
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive ? "bg-brand-charcoal text-white" : "text-ink-muted hover:bg-surface-sunken",
                )
              }
            >
              <item.icon className="h-4.5 w-4.5" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </Drawer>
    </>
  );
}
