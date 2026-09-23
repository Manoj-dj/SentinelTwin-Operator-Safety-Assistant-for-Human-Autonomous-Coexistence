import type { DemoScenarioName, RiskLevel, TruckState } from "@/api/types";

export const ROUTES = {
  dashboard: "/dashboard",
  liveSafety: "/live-safety",
  tasks: "/tasks",
  analytics: "/analytics",
  incidents: "/incidents",
  training: "/training",
  machineHealth: "/machine-health",
  chat: "/chat",
  settings: "/settings",
} as const;

/** Risk-level -> Tailwind token mapping. Color is always paired with text/icon, never used alone. */
export const RISK_STYLES: Record<RiskLevel, { text: string; bg: string; label: string }> = {
  LOW: { text: "text-status-safe", bg: "bg-status-safe-bg", label: "Low" },
  MODERATE: { text: "text-status-warning", bg: "bg-status-warning-bg", label: "Moderate" },
  HIGH: { text: "text-status-critical", bg: "bg-status-critical-bg", label: "High" },
  CRITICAL: { text: "text-status-critical", bg: "bg-status-critical-bg", label: "Critical" },
};

/** Truck state -> halo/badge color per the product spec (never implies "safe" for STOPPED/SUSPENDED alone). */
export const TRUCK_STATE_STYLES: Record<
  TruckState,
  { text: string; bg: string; ring: string; label: string; description: string }
> = {
  NORMAL: {
    text: "text-status-safe",
    bg: "bg-status-safe-bg",
    ring: "text-status-safe",
    label: "Normal",
    description: "Executing an active mission under normal autonomous operation.",
  },
  EXCEPTION: {
    text: "text-status-warning",
    bg: "bg-status-warning-bg",
    ring: "text-status-warning",
    label: "Exception",
    description: "Paused due to a safety, communication, or system exception.",
  },
  RECOVERY: {
    text: "text-status-critical",
    bg: "bg-status-critical-bg",
    ring: "text-status-critical",
    label: "Recovery",
    description: "Personnel or equipment recovery interaction is underway.",
  },
  TRANSITIONING: {
    text: "text-status-critical",
    bg: "bg-status-critical-bg",
    ring: "text-status-critical",
    label: "Transitioning",
    description: "A relevant condition changed; the system may reevaluate its mission.",
  },
  STOPPED: {
    text: "text-status-info",
    bg: "bg-status-info-bg",
    ring: "text-status-info",
    label: "Stopped",
    description: "Confirmed stopped. Only safe to approach if explicitly confirmed.",
  },
  SUSPENDED: {
    text: "text-status-info",
    bg: "bg-status-info-bg",
    ring: "text-status-info",
    label: "Suspended",
    description: "Mission isolated/suspended by approved procedure.",
  },
  OFFLINE: {
    text: "text-status-unknown",
    bg: "bg-status-unknown-bg",
    ring: "text-status-unknown",
    label: "Offline",
    description: "No reliable telemetry. Treat as unknown, high caution.",
  },
};

export const DEMO_SCENARIO_LABELS: Record<DemoScenarioName, string> = {
  normal_loading_cycle: "Normal Loading Cycle",
  seatbelt_violation: "Seatbelt Violation",
  state_transition_risk: "State Transition Risk",
  fatigue_break_alert: "Fatigue / Break Alert",
  machine_health_risk: "Machine Health Risk",
  low_visibility_collision_risk: "Low Visibility Collision Risk",
};

export const DEMO_SCENARIO_ROUTE: Record<DemoScenarioName, string> = {
  normal_loading_cycle: ROUTES.dashboard,
  seatbelt_violation: ROUTES.incidents,
  state_transition_risk: ROUTES.liveSafety,
  fatigue_break_alert: ROUTES.analytics,
  machine_health_risk: ROUTES.machineHealth,
  low_visibility_collision_risk: ROUTES.liveSafety,
};

export const SUGGESTED_PROMPTS = [
  "What is my next task?",
  "Why did I get this safety alert?",
  "Can I approach AHT-07?",
  "Why is my efficiency low?",
  "When should I take a break?",
  "What does EXCEPTION state mean?",
  "What training should I complete?",
  "Is my machine showing failure risk?",
];

export const ENABLE_DEMO_FALLBACK = import.meta.env.VITE_ENABLE_DEMO_FALLBACK === "true";
