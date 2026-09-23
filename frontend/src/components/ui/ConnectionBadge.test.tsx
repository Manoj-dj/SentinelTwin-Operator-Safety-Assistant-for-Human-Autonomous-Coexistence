import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ConnectionBadge } from "./ConnectionBadge";

describe("ConnectionBadge", () => {
  it("shows OFFLINE for a closed connection", () => {
    render(<ConnectionBadge status="closed" />);
    expect(screen.getByText("OFFLINE")).toBeInTheDocument();
  });

  it("shows LIVE for an open connection", () => {
    render(<ConnectionBadge status="open" />);
    expect(screen.getByText("LIVE")).toBeInTheDocument();
  });

  it("shows DEGRADED while reconnecting", () => {
    render(<ConnectionBadge status="reconnecting" />);
    expect(screen.getByText("DEGRADED")).toBeInTheDocument();
  });
});
