import type React from "react";
import { useEffect, useState } from "react";
import { Bell, ChevronDown, MapPin, User } from "lucide-react";
import { format } from "date-fns";
import { useAppState } from "@/contexts/AppStateContext";
import { useOperatorDirectory, useMachineDirectory } from "@/hooks/useDirectory";
import { ConnectionBadge } from "@/components/ui/ConnectionBadge";
import { useIncidentList } from "@/hooks/useIncidents";
import { Link } from "react-router-dom";
import { ROUTES } from "@/lib/constants";
import { MobileNavButton } from "./MobileNav";

export function Topbar() {
  const { selectedOperatorId, selectedMachineId, setSelectedOperatorId, setSelectedMachineId, connectionStatus } =
    useAppState();
  const operators = useOperatorDirectory();
  const machines = useMachineDirectory();
  const openIncidents = useIncidentList({ page: 1, page_size: 1, ack_status: "OPEN" });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000 * 30);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b border-black/5 bg-surface-raised px-4 md:px-6">
      <div className="flex min-w-0 items-center gap-2 text-sm text-ink-muted">
        <MobileNavButton />
        <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="truncate font-medium text-ink">Quarry Site Alpha</span>
        <span className="hidden text-ink-faint sm:inline">·</span>
        <span className="hidden tabular-nums sm:inline">{format(now, "EEE, MMM d · HH:mm")}</span>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <SelectorPill
          icon={<User className="h-3.5 w-3.5" aria-hidden="true" />}
          value={selectedOperatorId}
          onChange={setSelectedOperatorId}
          options={(operators.data?.items ?? []).map((o) => ({ id: o.id, label: o.name }))}
          placeholder="Select operator"
        />
        <SelectorPill
          icon={<span className="text-[10px] font-bold">M</span>}
          value={selectedMachineId}
          onChange={setSelectedMachineId}
          options={(machines.data?.items ?? []).map((m) => ({ id: m.id, label: m.machine_code }))}
          placeholder="Select machine"
        />
        <ConnectionBadge status={connectionStatus} />
        <Link
          to={ROUTES.incidents}
          className="relative rounded-full p-2 text-ink-muted hover:bg-surface-sunken hover:text-ink"
          aria-label="Open incidents"
        >
          <Bell className="h-4.5 w-4.5" aria-hidden="true" />
          {Boolean(openIncidents.data?.total) && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-status-critical px-1 text-[10px] font-bold text-white">
              {openIncidents.data?.total}
            </span>
          )}
        </Link>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-charcoal text-xs font-bold text-white"
          title="Demo profile"
        >
          OP
        </div>
      </div>
    </header>
  );
}

function SelectorPill({
  icon,
  value,
  onChange,
  options,
  placeholder,
}: {
  icon: React.ReactNode;
  value: string | null;
  onChange: (id: string) => void;
  options: { id: string; label: string }[];
  placeholder: string;
}) {
  return (
    <div className="relative hidden items-center gap-1.5 rounded-full bg-surface-sunken px-3 py-1.5 text-xs font-medium text-ink sm:flex">
      {icon}
      <select
        aria-label={placeholder}
        className="max-w-[7.5rem] appearance-none truncate bg-transparent pr-4 text-xs font-semibold text-ink focus:outline-none"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {!value && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-ink-faint" aria-hidden="true" />
    </div>
  );
}
