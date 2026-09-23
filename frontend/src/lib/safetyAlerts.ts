import type { RiskLevel, WebSocketServerEvent } from "@/api/types";

export interface DerivedAlert {
  severity: RiskLevel;
  message: string;
  source: string;
}

/** Mirrors the backend's 0-24/25-49/50-74/75-100 risk buckets (safety_risk_engine.classify_risk). */
export function classifyScore(score: number): RiskLevel {
  if (score >= 75) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 25) return "MODERATE";
  return "LOW";
}

const SEVERITY_RANK: Record<RiskLevel, number> = { LOW: 0, MODERATE: 1, HIGH: 2, CRITICAL: 3 };

function coerceRiskLevel(value: unknown): RiskLevel | null {
  if (typeof value !== "string") return null;
  const upper = value.toUpperCase();
  return upper === "LOW" || upper === "MODERATE" || upper === "HIGH" || upper === "CRITICAL"
    ? (upper as RiskLevel)
    : null;
}

/**
 * The backend's WebSocket payloads are intentionally minimal (see
 * app/services/websocket_manager.py callers) and their shape varies between
 * telemetry_update and simulation_scenario events, and even across the 6
 * demo scenarios (a fatigue scenario's final_risk_summary has
 * "fatigue_level", a machine-health scenario has "risk_level", etc). This
 * function inspects the known possible keys and falls back to score-based
 * classification so the UI never crashes on an unexpected shape.
 */
export function deriveAlertFromWsEvent(event: WebSocketServerEvent): DerivedAlert | null {
  if (event.event === "telemetry_update") {
    if (!event.safety_alert_triggered) return null;
    const score = Math.max(event.state_transition_risk_score ?? 0, event.failure_risk_score ?? 0);
    return {
      severity: classifyScore(score),
      message:
        event.anomaly_label === "ANOMALY"
          ? `Unusual pattern and safety alert detected on machine ${event.machine_id}.`
          : `Safety alert triggered on machine ${event.machine_id}.`,
      source: `machine:${event.machine_id}`,
    };
  }

  if (event.event === "simulation_scenario") {
    const summary = event.final_risk_summary ?? {};
    const directLevel =
      coerceRiskLevel(summary.risk_level) ??
      coerceRiskLevel(summary.severity) ??
      coerceRiskLevel(summary.fatigue_level) ??
      coerceRiskLevel(summary.delay_risk);

    let severity = directLevel;
    if (!severity) {
      const scoreKeys = [
        "risk_score",
        "collision_risk_score",
        "failure_risk_score",
        "fatigue_score",
      ];
      const scores = scoreKeys
        .map((key) => summary[key])
        .filter((v): v is number => typeof v === "number");
      if (scores.length > 0) {
        severity = classifyScore(Math.max(...scores));
      }
    }
    if (!severity) return null;

    return {
      severity,
      message: `Demo scenario "${event.scenario_name}" produced ${event.incident_count} incident(s).`,
      source: `scenario:${event.scenario_name}`,
    };
  }

  return null;
}

export function isAtLeast(level: RiskLevel, threshold: RiskLevel): boolean {
  return SEVERITY_RANK[level] >= SEVERITY_RANK[threshold];
}
