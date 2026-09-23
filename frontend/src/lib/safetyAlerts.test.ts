import { describe, expect, it } from "vitest";
import { classifyScore, deriveAlertFromWsEvent, isAtLeast } from "./safetyAlerts";
import type { TelemetryUpdateEvent, SimulationScenarioEvent } from "@/api/types";

describe("classifyScore", () => {
  it("mirrors the backend's 0-24/25-49/50-74/75-100 buckets", () => {
    expect(classifyScore(0)).toBe("LOW");
    expect(classifyScore(24)).toBe("LOW");
    expect(classifyScore(25)).toBe("MODERATE");
    expect(classifyScore(49)).toBe("MODERATE");
    expect(classifyScore(50)).toBe("HIGH");
    expect(classifyScore(74)).toBe("HIGH");
    expect(classifyScore(75)).toBe("CRITICAL");
    expect(classifyScore(100)).toBe("CRITICAL");
  });
});

describe("isAtLeast", () => {
  it("ranks severity correctly", () => {
    expect(isAtLeast("CRITICAL", "HIGH")).toBe(true);
    expect(isAtLeast("HIGH", "HIGH")).toBe(true);
    expect(isAtLeast("MODERATE", "HIGH")).toBe(false);
    expect(isAtLeast("LOW", "MODERATE")).toBe(false);
  });
});

describe("deriveAlertFromWsEvent", () => {
  it("returns null for a telemetry_update event with no safety alert", () => {
    const event: TelemetryUpdateEvent = {
      event: "telemetry_update",
      machine_id: "mc_1",
      operator_id: "op_1",
      safety_alert_triggered: false,
      state_transition_risk_score: 10,
      failure_risk_score: 5,
      anomaly_label: "NORMAL",
    };
    expect(deriveAlertFromWsEvent(event)).toBeNull();
  });

  it("classifies a triggered telemetry_update by its highest risk score", () => {
    const event: TelemetryUpdateEvent = {
      event: "telemetry_update",
      machine_id: "mc_1",
      operator_id: "op_1",
      safety_alert_triggered: true,
      state_transition_risk_score: 40,
      failure_risk_score: 82,
      anomaly_label: "ANOMALY",
    };
    const derived = deriveAlertFromWsEvent(event);
    expect(derived?.severity).toBe("CRITICAL");
    expect(derived?.message).toContain("Unusual pattern");
  });

  it("reads risk_level directly when a simulation scenario provides one", () => {
    const event: SimulationScenarioEvent = {
      event: "simulation_scenario",
      scenario_name: "machine_health_risk",
      timestamp: new Date().toISOString(),
      final_risk_summary: { risk_level: "HIGH", failure_risk_score: 60 },
      incident_count: 1,
    };
    const derived = deriveAlertFromWsEvent(event);
    expect(derived?.severity).toBe("HIGH");
  });

  it("falls back to fatigue_level for the fatigue_break_alert scenario shape", () => {
    const event: SimulationScenarioEvent = {
      event: "simulation_scenario",
      scenario_name: "fatigue_break_alert",
      timestamp: new Date().toISOString(),
      final_risk_summary: { fatigue_level: "HIGH", fatigue_score: 80 },
      incident_count: 0,
    };
    const derived = deriveAlertFromWsEvent(event);
    expect(derived?.severity).toBe("HIGH");
  });

  it("falls back to score-based classification when no level field is present", () => {
    const event: SimulationScenarioEvent = {
      event: "simulation_scenario",
      scenario_name: "low_visibility_collision_risk",
      timestamp: new Date().toISOString(),
      final_risk_summary: { collision_risk_score: 55 },
      incident_count: 1,
    };
    const derived = deriveAlertFromWsEvent(event);
    expect(derived?.severity).toBe("HIGH");
  });

  it("returns null when a scenario summary has no recognizable risk fields", () => {
    const event: SimulationScenarioEvent = {
      event: "simulation_scenario",
      scenario_name: "normal_loading_cycle",
      timestamp: new Date().toISOString(),
      final_risk_summary: {},
      incident_count: 0,
    };
    expect(deriveAlertFromWsEvent(event)).toBeNull();
  });
});
