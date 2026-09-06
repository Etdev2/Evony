import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { FeatureKey, PlanKey, planIncludes } from "./plans";

export type EntitlementOwner =
  | { type: "user"; id: string }
  | { type: "alliance"; id: string };

async function assertOwnerAccess(owner: EntitlementOwner) {
  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  const user = authData.user;
  if (!user) return false;

  if (owner.type === "user") return owner.id === user.id;

  const { data } = await supabase
    .from("alliance_members")
    .select("alliance_id")
    .eq("alliance_id", owner.id)
    .eq("user_id", user.id)
    .maybeSingle();
  return Boolean(data);
}

export async function hasFeature(owner: EntitlementOwner, feature: FeatureKey) {
  if (!(await assertOwnerAccess(owner))) return false;

  const admin = createSupabaseAdminClient();
  const { data: subscription } = await admin
    .from("subscriptions")
    .select("plan_key,status,current_period_end")
    .eq("owner_type", owner.type)
    .eq("owner_id", owner.id)
    .in("status", ["active", "trialing"])
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const plan: PlanKey = subscription?.plan_key && ["free", "scout", "pro", "alliance"].includes(subscription.plan_key)
    ? (subscription.plan_key as PlanKey)
    : "free";

  if (planIncludes(plan, feature)) return true;

  const { data: explicit } = await admin
    .from("entitlements")
    .select("id,expires_at")
    .eq("owner_type", owner.type)
    .eq("owner_id", owner.id)
    .eq("key", feature)
    .maybeSingle();

  if (!explicit) return false;
  if (!explicit.expires_at) return true;
  return new Date(explicit.expires_at).getTime() > Date.now();
}
