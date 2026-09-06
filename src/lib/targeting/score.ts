export type TargetScoreInput = {
  estimatedReward: number;
  travelSeconds: number;
  rallyWaitSeconds: number;
  actionSeconds?: number;
  staminaCost?: number;
  rarityModifier?: number;
  eventModifier?: number;
  allianceDemandModifier?: number;
};

export type TargetScoreResult = {
  score: number;
  rewardPerMinute: number;
  totalSeconds: number;
  modifiers: {
    rarity: number;
    event: number;
    allianceDemand: number;
    staminaEfficiency: number;
  };
};

const finiteNonNegative = (value: number, fallback = 0) =>
  Number.isFinite(value) && value >= 0 ? value : fallback;

export function scoreTarget(input: TargetScoreInput): TargetScoreResult {
  const reward = finiteNonNegative(input.estimatedReward);
  const totalSeconds = Math.max(
    1,
    finiteNonNegative(input.travelSeconds) +
      finiteNonNegative(input.rallyWaitSeconds) +
      finiteNonNegative(input.actionSeconds ?? 0),
  );

  const rewardPerMinute = reward / (totalSeconds / 60);
  const rarity = Math.max(0.1, input.rarityModifier ?? 1);
  const event = Math.max(0.1, input.eventModifier ?? 1);
  const allianceDemand = Math.max(0.1, input.allianceDemandModifier ?? 1);
  const stamina = Math.max(1, finiteNonNegative(input.staminaCost ?? 1, 1));
  const staminaEfficiency = 1 / Math.sqrt(stamina);

  const score = rewardPerMinute * rarity * event * allianceDemand * staminaEfficiency;

  return {
    score: Number(score.toFixed(4)),
    rewardPerMinute: Number(rewardPerMinute.toFixed(4)),
    totalSeconds,
    modifiers: { rarity, event, allianceDemand, staminaEfficiency },
  };
}
