import { describe, expect, it } from "vitest";
import { errorMessage } from "./utils";

describe("errorMessage", () => {
  it("reads Errors, Supabase-style objects and anything else", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
    expect(errorMessage({ message: "duplicate key", code: "23505" })).toBe("duplicate key");
    expect(errorMessage("plain")).toBe("plain");
    expect(errorMessage(null)).toBe("null");
  });
});
