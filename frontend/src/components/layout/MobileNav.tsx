import { NavLink } from "react-router-dom";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { LogoLockup } from "./Logo";
import { ROUTES, NAV_ICONS } from "@/lib/constants";
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

export function MobileNavButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        className="cat-focus-ring rounded-full p-2 text-cat-gray-mid hover:bg-cat-gray-light md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Navigation" widthClass="max-w-xs">
        <div className="mb-4">
          <LogoLockup />
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-lg border-l-4 px-2.5 py-2 text-sm font-semibold",
                  isActive
                    ? "border-cat-yellow bg-cat-gray-light text-cat-black"
                    : "border-transparent text-cat-gray-mid hover:bg-cat-gray-light",
                )
              }
            >
              <FeatureIconBadge icon={item.icon} size="sm" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </Drawer>
    </>
  );
}
