import { describe, expect, it } from "vitest";
import { lerp, lerpClamped } from "../lib/utils";

describe("utility functions", () => {
  it("calculates linear interpolation correctly", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
    expect(lerp(10, 20, 0)).toBe(10);
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it("clamps interpolation value between 0 and 1", () => {
    expect(lerpClamped(0, 10, -1)).toBe(0);
    expect(lerpClamped(0, 10, 0.5)).toBe(5);
    expect(lerpClamped(0, 10, 2)).toBe(10);
  });
});