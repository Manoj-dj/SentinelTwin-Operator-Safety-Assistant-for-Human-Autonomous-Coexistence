import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApproachStatusBadge } from "./ApproachStatusBadge";

describe("ApproachStatusBadge", () => {
  it("never implies approach is safe when not explicitly confirmed", () => {
    render(<ApproachStatusBadge confirmed={false} />);
    expect(screen.getByText(/do not approach/i)).toBeInTheDocument();
    expect(screen.queryByText(/confirmed/i)).not.toBeInTheDocument();
  });

  it("only shows 'Confirmed' when the backend explicitly confirms safe-to-approach", () => {
    render(<ApproachStatusBadge confirmed={true} />);
    expect(screen.getByText(/approach status: confirmed/i)).toBeInTheDocument();
  });
});
