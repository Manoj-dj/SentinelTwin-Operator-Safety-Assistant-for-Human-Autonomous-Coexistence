import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ErrorState } from "./ErrorState";
import type { ApiError } from "@/api/client";

describe("ErrorState (offline handling)", () => {
  it("shows a distinct 'Backend unavailable' message and startup command for network errors", () => {
    const error: ApiError = {
      kind: "network",
      message: "Cannot reach the SentinelTwin backend. Start it with: uvicorn app.main:app --reload",
    };
    render(<ErrorState error={error} />);
    expect(screen.getByText("Backend unavailable")).toBeInTheDocument();
    expect(screen.getByText(/uvicorn app.main:app --reload/)).toBeInTheDocument();
  });

  it("shows a generic error message for non-network failures", () => {
    const error: ApiError = { kind: "http", status: 500, message: "Internal server error." };
    render(<ErrorState error={error} />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("never hides the error in console only -- it always renders visible text", () => {
    render(<ErrorState error={new Error("boom")} />);
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
  });
});
