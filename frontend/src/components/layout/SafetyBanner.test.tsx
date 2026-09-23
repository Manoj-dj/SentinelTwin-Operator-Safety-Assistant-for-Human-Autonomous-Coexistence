import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { AppStateProvider, useAppState } from "@/contexts/AppStateContext";
import { SafetyBanner } from "./SafetyBanner";

function TriggerAlert({ severity }: { severity: "HIGH" | "CRITICAL" }) {
  const { setActiveAlert } = useAppState();
  useEffect(() => {
    setActiveAlert({ severity, message: "Test alert message", source: "test", receivedAt: new Date().toISOString() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

describe("SafetyBanner", () => {
  it("renders nothing when there is no active alert", () => {
    const { container } = render(
      <AppStateProvider>
        <SafetyBanner />
      </AppStateProvider>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows a persistent CRITICAL banner when a critical alert is active", () => {
    render(
      <AppStateProvider>
        <TriggerAlert severity="CRITICAL" />
        <SafetyBanner />
      </AppStateProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("CRITICAL RISK");
    expect(screen.getByRole("alert")).toHaveTextContent("Test alert message");
  });

  it("shows a HIGH risk banner (not CRITICAL wording) for a high-severity alert", () => {
    render(
      <AppStateProvider>
        <TriggerAlert severity="HIGH" />
        <SafetyBanner />
      </AppStateProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("HIGH RISK");
  });
});
