import { describe, expect, it } from "vitest";
import { FEATURE_KEYS, planIncludes } from "./plans";

describe("plan entitlements", () => {
  it("keeps free access intentionally narrow", () => {
    expect(planIncludes("free", "scan.upload")).toBe(true);
    expect(planIncludes("free", "alliance.realtime")).toBe(false);
  });

  it("grants every current feature to alliance plan", () => {
    for (const feature of FEATURE_KEYS) {
      expect(planIncludes("alliance", feature)).toBe(true);
    }
  });
});
