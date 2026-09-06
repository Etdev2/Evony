import { describe, expect, it } from "vitest";
import { scoreTarget } from "./score";

describe("scoreTarget", () => {
  it("rewards better value per minute", () => {
    const fast = scoreTarget({ estimatedReward: 100, travelSeconds: 60, rallyWaitSeconds: 60, staminaCost: 1 });
    const slow = scoreTarget({ estimatedReward: 100, travelSeconds: 300, rallyWaitSeconds: 60, staminaCost: 1 });
    expect(fast.score).toBeGreaterThan(slow.score);
  });

  it("applies event and rarity modifiers", () => {
    const base = scoreTarget({ estimatedReward: 100, travelSeconds: 60, rallyWaitSeconds: 60, staminaCost: 1 });
    const event = scoreTarget({
      estimatedReward: 100,
      travelSeconds: 60,
      rallyWaitSeconds: 60,
      staminaCost: 1,
      eventModifier: 1.5,
      rarityModifier: 1.2,
    });
    expect(event.score).toBeGreaterThan(base.score);
  });

  it("penalizes high stamina cost", () => {
    const cheap = scoreTarget({ estimatedReward: 100, travelSeconds: 60, rallyWaitSeconds: 60, staminaCost: 1 });
    const expensive = scoreTarget({ estimatedReward: 100, travelSeconds: 60, rallyWaitSeconds: 60, staminaCost: 25 });
    expect(cheap.score).toBeGreaterThan(expensive.score);
  });
});
