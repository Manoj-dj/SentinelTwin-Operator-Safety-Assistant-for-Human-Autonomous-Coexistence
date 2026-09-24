import { Settings as SettingsIcon, Volume2 } from "lucide-react";
import { useAppState } from "@/contexts/AppStateContext";
import { useOperatorDirectory, useMachineDirectory } from "@/hooks/useDirectory";
import { useAllTrucks } from "@/hooks/useDigitalTwin";
import { useSystemSummary } from "@/hooks/useSystemSummary";
import { Card, CardHeader } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { CardSkeleton } from "@/components/ui/LoadingSkeleton";
import { DemoScenarioPanel } from "@/components/demo/DemoScenarioPanel";
import { API_BASE_URL } from "@/api/client";
import { WS_BASE_URL } from "@/api/websocket";
import { ENABLE_DEMO_FALLBACK } from "@/lib/constants";

export default function SettingsPage() {
  const {
    selectedOperatorId,
    selectedMachineId,
    selectedTruckId,
    setSelectedOperatorId,
    setSelectedMachineId,
    setSelectedTruckId,
    soundAlertsEnabled,
    setSoundAlertsEnabled,
  } = useAppState();

  const operators = useOperatorDirectory();
  const machines = useMachineDirectory();
  const trucks = useAllTrucks();
  const summary = useSystemSummary();

  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-2">
        <SettingsIcon className="h-5 w-5 text-brand-yellow-dark" />
        <div>
          <h1 className="cat-heading-accent text-lg font-extrabold tracking-tight text-cat-black">Settings</h1>
          <p className="text-sm text-ink-muted">Connection info and demo preferences. No secrets are stored here.</p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Backend connection" />
        <dl className="grid grid-cols-1 gap-y-2 text-xs sm:grid-cols-2">
          <Row label="API base URL" value={API_BASE_URL} />
          <Row label="WebSocket base URL" value={WS_BASE_URL} />
          <Row label="Demo fallback enabled" value={ENABLE_DEMO_FALLBACK ? "Yes" : "No"} />
        </dl>
        {summary.isLoading ? (
          <div className="mt-3">
            <CardSkeleton lines={2} />
          </div>
        ) : summary.isError ? (
          <div className="mt-3">
            <ErrorState error={summary.error} onRetry={() => summary.refetch()} compact />
          </div>
        ) : summary.data ? (
          <dl className="mt-3 grid grid-cols-2 gap-y-1.5 border-t border-black/5 pt-3 text-xs sm:grid-cols-3">
            <Row label="Operators" value={String(summary.data.operators)} />
            <Row label="Machines" value={String(summary.data.machines)} />
            <Row label="Autonomous trucks" value={String(summary.data.autonomous_trucks)} />
            <Row label="Open incidents" value={String(summary.data.open_incidents)} />
            <Row label="Telemetry records" value={String(summary.data.telemetry_records)} />
            <Row label="Gemini configured" value={summary.data.gemini_configured ? "Yes" : "No (local fallback)"} />
          </dl>
        ) : null}
      </Card>

      <Card>
        <CardHeader title="Default selections" subtitle="Used across the dashboard, live safety, and Copilot." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <SelectField
            label="Operator"
            value={selectedOperatorId}
            onChange={setSelectedOperatorId}
            options={(operators.data?.items ?? []).map((o) => ({ id: o.id, label: o.name }))}
          />
          <SelectField
            label="Machine"
            value={selectedMachineId}
            onChange={setSelectedMachineId}
            options={(machines.data?.items ?? []).map((m) => ({ id: m.id, label: `${m.machine_code} — ${m.name}` }))}
          />
          <SelectField
            label="Autonomous truck"
            value={selectedTruckId}
            onChange={setSelectedTruckId}
            options={(trucks.data?.items ?? []).map((t) => ({ id: t.id, label: t.truck_code }))}
          />
        </div>
      </Card>

      <Card>
        <CardHeader icon={<Volume2 className="h-4 w-4" />} title="Alert preferences" />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={soundAlertsEnabled}
            onChange={(e) => setSoundAlertsEnabled(e.target.checked)}
          />
          Play a subtle sound for new HIGH/CRITICAL safety alerts
        </label>
      </Card>

      <DemoScenarioPanel />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="contents">
      <dt className="text-ink-faint">{label}</dt>
      <dd className="text-right font-mono text-[11px] font-medium text-ink sm:text-left">{value}</dd>
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | null;
  onChange: (id: string) => void;
  options: { id: string; label: string }[];
}) {
  return (
    <label className="block text-xs font-semibold text-ink">
      {label}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg border border-black/10 bg-surface px-2.5 py-1.5 text-xs font-medium focus:border-brand-yellow-dark focus:outline-none"
      >
        <option value="" disabled>
          Select...
        </option>
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}
