import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { getStoredValue, setStoredValue } from "@/lib/storage";
import type { ConnectionStatus } from "@/api/websocket";
import type { RiskLevel } from "@/api/types";

export interface ActiveSafetyAlert {
  severity: RiskLevel;
  message: string;
  source: string;
  receivedAt: string;
}

interface AppState {
  selectedOperatorId: string | null;
  selectedMachineId: string | null;
  selectedTruckId: string | null;
  sidebarCollapsed: boolean;
  copilotOpen: boolean;
  soundAlertsEnabled: boolean;
  demoModeAcknowledged: boolean;
  connectionStatus: ConnectionStatus;
  activeAlert: ActiveSafetyAlert | null;
  pendingCopilotPrompt: string | null;

  setSelectedOperatorId: (id: string | null) => void;
  setSelectedMachineId: (id: string | null) => void;
  setSelectedTruckId: (id: string | null) => void;
  setSidebarCollapsed: (value: boolean) => void;
  setCopilotOpen: (value: boolean) => void;
  toggleCopilot: () => void;
  setSoundAlertsEnabled: (value: boolean) => void;
  setDemoModeAcknowledged: (value: boolean) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setActiveAlert: (alert: ActiveSafetyAlert | null) => void;
  askCopilot: (prompt: string) => void;
  consumePendingCopilotPrompt: () => void;
}

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [selectedOperatorId, setSelectedOperatorIdState] = useState<string | null>(() =>
    getStoredValue("selectedOperatorId", null as string | null),
  );
  const [selectedMachineId, setSelectedMachineIdState] = useState<string | null>(() =>
    getStoredValue("selectedMachineId", null as string | null),
  );
  const [selectedTruckId, setSelectedTruckIdState] = useState<string | null>(() =>
    getStoredValue("selectedTruckId", null as string | null),
  );
  const [sidebarCollapsed, setSidebarCollapsedState] = useState<boolean>(() =>
    getStoredValue("sidebarCollapsed", false),
  );
  const [soundAlertsEnabled, setSoundAlertsEnabledState] = useState<boolean>(() =>
    getStoredValue("soundAlertsEnabled", false),
  );
  const [demoModeAcknowledged, setDemoModeAcknowledgedState] = useState<boolean>(() =>
    getStoredValue("demoModeAcknowledged", false),
  );
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("connecting");
  const [activeAlert, setActiveAlert] = useState<ActiveSafetyAlert | null>(null);
  const [pendingCopilotPrompt, setPendingCopilotPrompt] = useState<string | null>(null);

  const askCopilot = useCallback((prompt: string) => {
    setPendingCopilotPrompt(prompt);
    setCopilotOpen(true);
  }, []);
  const consumePendingCopilotPrompt = useCallback(() => setPendingCopilotPrompt(null), []);

  const setSelectedOperatorId = useCallback((id: string | null) => {
    setSelectedOperatorIdState(id);
    setStoredValue("selectedOperatorId", id);
  }, []);
  const setSelectedMachineId = useCallback((id: string | null) => {
    setSelectedMachineIdState(id);
    setStoredValue("selectedMachineId", id);
  }, []);
  const setSelectedTruckId = useCallback((id: string | null) => {
    setSelectedTruckIdState(id);
    setStoredValue("selectedTruckId", id);
  }, []);
  const setSidebarCollapsed = useCallback((value: boolean) => {
    setSidebarCollapsedState(value);
    setStoredValue("sidebarCollapsed", value);
  }, []);
  const setSoundAlertsEnabled = useCallback((value: boolean) => {
    setSoundAlertsEnabledState(value);
    setStoredValue("soundAlertsEnabled", value);
  }, []);
  const setDemoModeAcknowledged = useCallback((value: boolean) => {
    setDemoModeAcknowledgedState(value);
    setStoredValue("demoModeAcknowledged", value);
  }, []);
  const toggleCopilot = useCallback(() => setCopilotOpen((v) => !v), []);

  const value = useMemo<AppState>(
    () => ({
      selectedOperatorId,
      selectedMachineId,
      selectedTruckId,
      sidebarCollapsed,
      copilotOpen,
      soundAlertsEnabled,
      demoModeAcknowledged,
      connectionStatus,
      activeAlert,
      pendingCopilotPrompt,
      setSelectedOperatorId,
      setSelectedMachineId,
      setSelectedTruckId,
      setSidebarCollapsed,
      setCopilotOpen,
      toggleCopilot,
      setSoundAlertsEnabled,
      setDemoModeAcknowledged,
      setConnectionStatus,
      setActiveAlert,
      askCopilot,
      consumePendingCopilotPrompt,
    }),
    [
      selectedOperatorId,
      selectedMachineId,
      selectedTruckId,
      sidebarCollapsed,
      copilotOpen,
      soundAlertsEnabled,
      demoModeAcknowledged,
      connectionStatus,
      activeAlert,
      pendingCopilotPrompt,
      setSelectedOperatorId,
      setSelectedMachineId,
      setSelectedTruckId,
      setSidebarCollapsed,
      toggleCopilot,
      setSoundAlertsEnabled,
      setDemoModeAcknowledged,
      askCopilot,
      consumePendingCopilotPrompt,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components -- the context hook belongs beside its provider
export function useAppState(): AppState {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
