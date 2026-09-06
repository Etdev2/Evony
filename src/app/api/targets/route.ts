import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const querySchema = z.object({
  allianceId: z.string().uuid().optional(),
  monster: z.string().min(1).max(120).optional(),
  minLevel: z.coerce.number().int().min(0).optional(),
  maxLevel: z.coerce.number().int().min(0).optional(),
  status: z.enum(["active", "claimed", "dead", "stale"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_query", details: parsed.error.flatten() }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const q = parsed.data;
  let query = supabase
    .from("targets")
    .select("id,alliance_id,monster_name,monster_level,map_x,map_y,status,last_seen_at,confidence,score,score_explanation")
    .order("score", { ascending: false, nullsFirst: false })
    .order("last_seen_at", { ascending: false })
    .limit(q.limit);

  if (q.allianceId) query = query.eq("alliance_id", q.allianceId);
  if (q.monster) query = query.ilike("monster_name", `%${q.monster}%`);
  if (q.minLevel !== undefined) query = query.gte("monster_level", q.minLevel);
  if (q.maxLevel !== undefined) query = query.lte("monster_level", q.maxLevel);
  if (q.status) query = query.eq("status", q.status);

  const { data, error } = await query;
  if (error) {
    return NextResponse.json({ error: "target_query_failed", message: error.message }, { status: 400 });
  }

  return NextResponse.json({ targets: data ?? [] });
}
