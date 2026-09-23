import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskBadge } from "./RiskBadge";

describe("RiskBadge", () => {
  it.each([
    ["LOW", "Low"],
    ["MODERATE", "Moderate"],
    ["HIGH", "High"],
    ["CRITICAL", "Critical"],
  ] as const)("maps risk level %s to label %s", (level, label) => {
    render(<RiskBadge level={level} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });

  it("falls back to a safe default label for an unexpected raw value instead of crashing", () => {
    render(<RiskBadge level={"NOT_A_REAL_LEVEL"} />);
    expect(screen.getByText("Moderate")).toBeInTheDocument();
  });
});
