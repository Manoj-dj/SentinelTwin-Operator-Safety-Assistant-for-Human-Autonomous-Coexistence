import { describe, expect, it } from "vitest";
import { AxiosError } from "axios";
import { normalizeError } from "./client";

function makeAxiosError(overrides: Partial<AxiosError>): AxiosError {
  const error = new AxiosError(overrides.message ?? "Request failed");
  Object.assign(error, overrides);
  return error;
}

describe("normalizeError", () => {
  it("returns a network error when there is no response (backend unreachable)", () => {
    const error = makeAxiosError({ response: undefined, code: "ERR_NETWORK" });
    const result = normalizeError(error);
    expect(result.kind).toBe("network");
    expect(result.message).toContain("uvicorn app.main:app --reload");
  });

  it("returns a timeout error for ECONNABORTED", () => {
    const error = makeAxiosError({ code: "ECONNABORTED" });
    const result = normalizeError(error);
    expect(result.kind).toBe("timeout");
  });

  it("extracts a string detail from an HTTP error response", () => {
    const error = makeAxiosError({
      response: {
        status: 404,
        data: { detail: "Operator not found" },
        statusText: "Not Found",
        headers: {},
        // @ts-expect-error -- minimal fake config for the test
        config: {},
      },
    });
    const result = normalizeError(error);
    expect(result.kind).toBe("http");
    expect(result.status).toBe(404);
    expect(result.message).toBe("Operator not found");
  });

  it("joins FastAPI validation error arrays into a readable message", () => {
    const error = makeAxiosError({
      response: {
        status: 422,
        data: { detail: [{ msg: "field required" }, { msg: "value is not a valid enum" }] },
        statusText: "Unprocessable Entity",
        headers: {},
        // @ts-expect-error -- minimal fake config for the test
        config: {},
      },
    });
    const result = normalizeError(error);
    expect(result.message).toBe("field required; value is not a valid enum");
  });

  it("wraps unknown thrown values without crashing", () => {
    const result = normalizeError("just a string");
    expect(result.kind).toBe("unknown");
  });
});
