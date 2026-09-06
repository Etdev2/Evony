export const PLAN_KEYS = ["free", "scout", "pro", "alliance"] as const;
export type PlanKey = (typeof PLAN_KEYS)[number];

export const FEATURE_KEYS = [
  "scan.upload",
  "targets.search",
  "targets.advanced_filters",
  "alliance.shared_board",
  "alliance.realtime",
  "analytics.history",
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const PLAN_FEATURES: Record<PlanKey, ReadonlySet<FeatureKey>> = {
  free: new Set(["scan.upload", "targets.search"]),
  scout: new Set(["scan.upload", "targets.search", "targets.advanced_filters", "analytics.history"]),
  pro: new Set([
    "scan.upload",
    "targets.search",
    "targets.advanced_filters",
    "analytics.history",
    "alliance.shared_board",
  ]),
  alliance: new Set(FEATURE_KEYS),
};

export function planIncludes(plan: PlanKey, feature: FeatureKey) {
  return PLAN_FEATURES[plan].has(feature);
}
